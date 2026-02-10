
from typing import Dict, Any
import numpy as np
from loguru import logger
from backend.app.services.vision.base import VisionProvider

class StubVisionProvider(VisionProvider):
    async def analyze(self, image: np.ndarray, prompt: str) -> Dict[str, Any]:
        logger.info("StubVisionProvider: Returning mock data")
        # Mock structured output matching the schema
        return {
            "diagram_type": "flowchart",
            "nodes": [
                {"id": "N1", "label": "Start", "shape": "circle", "bbox": [50, 50, 100, 50]},
                {"id": "N2", "label": "Process", "shape": "rectangle", "bbox": [50, 150, 100, 50]},
                {"id": "N3", "label": "End", "shape": "circle", "bbox": [50, 250, 100, 50]}
            ],
            "edges": [
                {"from": "N1", "to": "N2", "type": "arrow", "label": ""},
                {"from": "N2", "to": "N3", "type": "arrow", "label": ""}
            ]
        }
