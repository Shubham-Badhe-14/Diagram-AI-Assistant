
import json
from typing import Dict, Any, Union
import numpy as np
import cv2
from loguru import logger
from google import genai
from google.genai import types
from backend.app.core.config import settings
from backend.app.core.errors import VisionFailure
from backend.app.services.vision.base import VisionProvider
from PIL import Image

class GeminiVisionProvider(VisionProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. GeminiVisionProvider might fail.")
            return
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"

    def _convert_to_pil(self, image: np.ndarray) -> Image.Image:
        """Converts BGR numpy image to RGB PIL Image."""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb_image)

    async def analyze(self, image: np.ndarray, prompt: str) -> Dict[str, Any]:
        logger.info(f"Sending image to Gemini Vision API ({self.model_name})...")
        pil_image = self._convert_to_pil(image)

        try:
            # The prompt structure for multimodal in the new SDK:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    prompt,
                    pil_image
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            content = response.text
            if not content:
                 raise VisionFailure("Gemini returned empty response")

            # Clean content (remove markdown fences)
            cleaned_content = self._clean_json(content)
            logger.debug(f"Raw Gemini response: {content}")
            logger.debug(f"Cleaned Gemini response: {cleaned_content}")

            return json.loads(cleaned_content)

        except Exception as e:
            logger.error(f"Gemini Vision API failed: {e}")
            if 'content' in locals():
                logger.error(f"Failed content was: {content}")
            raise VisionFailure(str(e))

    def _clean_json(self, text: str) -> str:
        """
        Extracts the first valid JSON object from the text using regex.
        Handles cases where the model adds conversational text before or after the JSON.
        """
        import re
        text = text.strip()
        
        # Try to find JSON block in markdown fences first
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return match.group(1)
            
        # Fallback: Find first opening brace and last matching closing brace
        # This is a simple heuristic; for deeply nested unbalanced text it might fail, 
        # but for this specific failure mode (text after JSON), finding the last '}' that closes the first '{' is hard without a parser.
        # Instead, let's find the FIRST '{' and the LAST '}' and hope they are the boundaries.
        
        start = text.find("{")
        end = text.rfind("}")
        
        if start != -1 and end != -1 and end > start:
            return text[start : end + 1]
            
        return text
