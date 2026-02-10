
import os
import shutil
import uuid
from typing import Tuple
from fastapi import UploadFile
from backend.app.core.config import settings
from backend.app.core.errors import StorageError
from loguru import logger

class StorageService:
    @staticmethod
    async def save_upload(file: UploadFile) -> Tuple[str, str]:
        """
        Saves an uploaded file to a unique job directory.
        Returns: (job_id, file_path)
        """
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(settings.TEMP_DIR, job_id)
        
        try:
            os.makedirs(job_dir, exist_ok=True)
            
            # Sanitize filename (basic)
            filename = os.path.basename(file.filename)
            file_path = os.path.join(job_dir, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            logger.info(f"Saved file for job {job_id} at {file_path}")
            return job_id, file_path
            
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            # Cleanup if partially created
            if os.path.exists(job_dir):
                shutil.rmtree(job_dir)
            raise StorageError(f"Could not save uploaded file: {str(e)}")

    @staticmethod
    def get_job_dir(job_id: str) -> str:
        return os.path.join(settings.TEMP_DIR, job_id)
