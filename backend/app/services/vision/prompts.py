
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
