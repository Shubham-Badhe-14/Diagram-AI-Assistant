
import easyocr
import numpy as np
from typing import List, Dict, Any
from loguru import logger
from backend.app.core.errors import OCRFailure

class OCRService:
    def __init__(self, languages: List[str] = ['en']):
        logger.info(f"Initializing EasyOCR with languages: {languages}")
        try:
            self.reader = easyocr.Reader(languages, gpu=False) # GPU=False for wider compatibility
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}")
            raise OCRFailure(f"Failed to initialize OCR engine: {str(e)}")

    def extract_text(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Extracts text from an image.
        Returns a list of dicts:
        {
            "text": str,
            "bbox": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
            "confidence": float
        }
        """
        try:
            # result structure: ([[x1,y1],[x2,y2],[x3,y3],[x4,y4]], text, confidence)
            results = self.reader.readtext(image)
            
            structured_results = []
            for (bbox, text, prob) in results:
                # Convert numpy types to standard python types for JSON serialization
                bbox_list = [[int(pt[0]), int(pt[1])] for pt in bbox]
                structured_results.append({
                    "text": text,
                    "bbox": bbox_list,
                    "confidence": float(prob)
                })
                
            return structured_results
            
        except Exception as e:
            logger.error(f"OCR Extraction failed: {e}")
            raise OCRFailure(str(e))

    def merge_nearby_text(self, ocr_results: List[Dict[str, Any]], distance_threshold: int = 20) -> List[Dict[str, Any]]:
        """
        Merges text boxes that are vertically close and aligned.
        This is a heuristic to handle multi-line text in nodes.
        """
        # Sort by Y coordinate then X
        # TODO: Implement complex merging logic if needed. 
        # For MVP, we return raw results or simple concatenation if strictly required.
        return ocr_results
