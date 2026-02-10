
import base64
import json
from typing import Dict, Any
import numpy as np
import cv2
from loguru import logger
from openai import AsyncOpenAI
from backend.app.core.config import settings
from backend.app.core.errors import VisionFailure
from backend.app.services.vision.base import VisionProvider

class OpenAIVisionProvider(VisionProvider):
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. OpenAIVisionProvider might fail.")
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    def _encode_image(self, image: np.ndarray) -> str:
        """Encodes numpy image to base64 string."""
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')

    async def analyze(self, image: np.ndarray, prompt: str) -> Dict[str, Any]:
        logger.info("Sending image to OpenAI Vision API...")
        base64_image = self._encode_image(image)

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                response_format={ "type": "json_object" },
                max_tokens=4096,
            )
            
            content = response.choices[0].message.content
            if not content:
                raise VisionFailure("OpenAI returned empty response")
                
            return json.loads(content)

        except Exception as e:
            logger.error(f"OpenAI Vision API failed: {e}")
            raise VisionFailure(str(e))
