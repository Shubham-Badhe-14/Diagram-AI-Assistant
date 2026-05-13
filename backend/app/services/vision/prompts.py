
FLOWCHART_PROMPT = """
You are an expert at analyzing handwritten diagrams. 
Look at the image and extract the structure of the flowchart or diagram.
Return ONLY valid JSON with the following structure:
{
  "diagram_type": "flowchart|tree|graph|mindmap",
  "nodes": [
    {
      "id": "unique_id",
      "label": "text inside node",
      "shape": "rectangle|diamond|circle|parallelogram",
      "bbox": [x, y, w, h] // approximate if unknown
    }
  ],
  "edges": [
    {
      "from": "node_id_start",
      "to": "node_id_end",
      "type": "arrow|line",
      "label": "text on line if any"
    }
  ]
}
"""

REIMAGINE_FLOWCHART_PROMPT = """
You refine hand-drawn flowcharts. The attached image is the original sketch.

Below is a first-pass Mermaid diagram extracted from that sketch. It may be noisy,
duplicated, or structurally imperfect. Produce a cleaner, more readable interpretation
that still matches the sketch.

Current Mermaid (reference only; improve the graph, do not echo blindly):
---
__CURRENT_MERMAID__
---

Return ONLY valid JSON with exactly this structure:
- diagram_type: one of flowchart, tree, graph, mindmap
- nodes: array of objects with id (string), label (string), shape (rectangle|diamond|circle|parallelogram), bbox [x, y, w, h] integers if known else approximate
- edges: array of objects with from (node id), to (node id), type (arrow|line), label (string, may be empty)

Rules: every edge must reference existing node ids; merge obvious duplicates; prefer concise labels.
"""

