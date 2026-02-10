
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from loguru import logger
from backend.app.core.errors import GraphBuildFailure

# --- Canonical Schema ---
class Node(BaseModel):
    id: str
    label: str
    shape: str = "rectangle" # rectangle, diamond, circle, cylinder, etc.
    bbox: Optional[List[int]] = None # [x, y, w, h]

class Edge(BaseModel):
    source: str # using from/to as reserved words might catch us, so source/target
    target: str
    label: Optional[str] = None
    type: str = "arrow" # arrow, line, dotted

class Diagram(BaseModel):
    type: str = "flowchart"
    nodes: List[Node]
    edges: List[Edge]

# --- Inference Engine ---

class InferenceEngine:
    def __init__(self):
        pass

    def build_graph(self, vision_data: Dict[str, Any], ocr_data: List[Dict[str, Any]]) -> Diagram:
        """
        Combines Vision Output and OCR Data to build a canonical graph.
        For the MVP/Stub phase, we primarily rely on Vision Output.
        """
        try:
            logger.info("Building graph from vision data...")
            
            # Basic validation and conversion
            nodes = []
            for n_data in vision_data.get("nodes", []):
                # Ensure ID exists, sanitize label
                nodes.append(Node(
                    id=str(n_data.get("id", f"node_{len(nodes)}")),
                    label=str(n_data.get("label", "")),
                    shape=n_data.get("shape", "rectangle"),
                    bbox=n_data.get("bbox")
                ))

            edges = []
            for e_data in vision_data.get("edges", []):
                src = str(e_data.get("from"))
                tgt = str(e_data.get("to"))
                if src and tgt:
                    edges.append(Edge(
                        source=src,
                        target=tgt,
                        label=e_data.get("label"),
                        type=e_data.get("type", "arrow")
                    ))
            
            return Diagram(
                type=vision_data.get("diagram_type", "flowchart"),
                nodes=nodes,
                edges=edges
            )

        except Exception as e:
            logger.error(f"Inference failed: {e}")
            raise GraphBuildFailure(str(e))
