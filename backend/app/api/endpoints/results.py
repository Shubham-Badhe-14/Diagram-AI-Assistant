
import os
from fastapi import APIRouter, HTTPException
from backend.app.services.storage import StorageService

router = APIRouter()

@router.get("/results/{job_id}/png")
async def get_png(job_id: str):
    """
    Download the generated PNG flowchart.
    """
    job_dir = StorageService.get_job_dir(job_id)
    file_path = os.path.join(job_dir, "diagram.png")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Diagram not found or not yet generated")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type="image/png", filename="flowchart.png")

@router.get("/results/{job_id}/mermaid")
async def get_mermaid(job_id: str):
    """
    Download the generated Mermaid code.
    """
    job_dir = StorageService.get_job_dir(job_id)
    file_path = os.path.join(job_dir, "diagram.mmd")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Mermaid code not found")
        
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type="text/plain", filename="flowchart.mmd")
