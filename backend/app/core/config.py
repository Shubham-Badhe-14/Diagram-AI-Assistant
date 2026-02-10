
import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Handwritten Diagram to Flowchart"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Storage
    TEMP_DIR: str = os.path.join(os.getcwd(), "temp")
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # AI Providers
    VISION_PROVIDER: str = "stub" # stub, openai, gemini
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Feature Toggles
    ENABLE_PREPROCESSING: bool = True
    ENABLE_OCR_FALLBACK: bool = False

    # Server
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)
