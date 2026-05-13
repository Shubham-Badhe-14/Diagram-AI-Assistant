import pytest

from backend.app.services.inference import Diagram, Edge, InferenceEngine, Node
from backend.app.services.mermaid.generator import MermaidGenerator


def test_inference_builds_graph_and_merges_ocr():
    vision = {
        "diagram_type": "flowchart",
        "nodes": [
            {"id": "A", "label": "Step", "shape": "rectangle", "bbox": [0, 0, 100, 50]},
        ],
        "edges": [],
    }
    ocr = [
        {
            "text": "Hello",
            "bbox": [[10, 10], [40, 10], [40, 30], [10, 30]],
            "confidence": 0.99,
        }
    ]
    d: Diagram = InferenceEngine().build_graph(vision, ocr)
    assert len(d.nodes) == 1
    assert "Hello" in d.nodes[0].label


def test_mermaid_generator_shapes():
    diagram = Diagram(
        type="flowchart",
        nodes=[
            Node(id="n0", label='Say "hi"', shape="rectangle"),
            Node(id="n1", label="Q?", shape="diamond"),
            Node(id="n2", label="Start", shape="circle"),
        ],
        edges=[Edge(source="n0", target="n1", label="next", type="arrow")],
    )
    code = MermaidGenerator.generate_code(diagram)
    assert "flowchart TD" in code
    assert "n0" in code and "n1" in code
    assert "-->" in code
