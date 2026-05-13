import glob
import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from backend.app.core.config import settings
from backend.app.services.inference import InferenceEngine
from backend.app.services.mermaid.generator import MermaidGenerator
from backend.app.services.preprocessing import ImagePreprocessor
from backend.app.services.vision.prompts import REIMAGINE_FLOWCHART_PROMPT
from backend.app.services.storage import StorageService

router = APIRouter()


class ReimagineBody(BaseModel):
    """Optional JSON body; when `mermaid` is non-empty, it overrides on-disk `diagram.mmd` for the prompt."""

    mermaid: Optional[str] = None


def _find_job_input_image(job_dir: str) -> Optional[str]:
    input_files = glob.glob(os.path.join(job_dir, "*.*"))
    common_outputs = {"diagram.mmd", "diagram.png", "diagram.svg"}
    for f in input_files:
        base = os.path.basename(f)
        if base in common_outputs or base.startswith("debug_"):
            continue
        return f
    return None


def _vision_provider():
    if settings.VISION_PROVIDER == "openai":
        from backend.app.services.vision.openai import OpenAIVisionProvider

        return OpenAIVisionProvider()
    if settings.VISION_PROVIDER == "gemini":
        from backend.app.services.vision.gemini import GeminiVisionProvider

        return GeminiVisionProvider()
    from backend.app.services.vision.stub import StubVisionProvider

    return StubVisionProvider()


@router.post("/reimagine/{job_id}")
async def reimagine_diagram(job_id: str, body: ReimagineBody):
    """
    Second vision pass: refine structure using the same image + current Mermaid as context.
    Overwrites diagram.mmd in the job directory.
    If the client sends a non-empty JSON `mermaid` string, it is used as context instead of the file on disk.
    """
    job_dir = StorageService.get_job_dir(job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")

    mmd_path = os.path.join(job_dir, "diagram.mmd")
    if not os.path.isfile(mmd_path):
        raise HTTPException(status_code=404, detail="No diagram to reimagine")

    with open(mmd_path, encoding="utf-8") as f:
        disk_mermaid = f.read()

    from_client = (body.mermaid or "").strip()
    current_mermaid = from_client if from_client else disk_mermaid

    input_path = _find_job_input_image(job_dir)
    if not input_path:
        raise HTTPException(status_code=404, detail="Original image not found for this job")

    image = ImagePreprocessor.load_image(input_path)
    snippet = current_mermaid[:15000]
    prompt = REIMAGINE_FLOWCHART_PROMPT.replace("__CURRENT_MERMAID__", snippet)

    logger.info(f"Reimagine job {job_id} with provider {settings.VISION_PROVIDER}")
    provider = _vision_provider()
    vision_data = await provider.analyze(image, prompt, status_callback=None)

    inference_engine = InferenceEngine()
    diagram = inference_engine.build_graph(vision_data, [])
    mermaid_code = MermaidGenerator.generate_code(diagram)

    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(mermaid_code)

    return {"job_id": job_id, "mermaid": mermaid_code}
