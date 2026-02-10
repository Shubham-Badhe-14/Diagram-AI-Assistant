
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.services.storage import StorageService
from backend.app.core.errors import AppError
from loguru import logger

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image to start a new processing job.
    """
    # Validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        job_id, file_path = await StorageService.save_upload(file)
        return {
            "job_id": job_id,
            "filename": file.filename,
            "message": "Upload successful",
            "next_step": f"/api/v1/process/{job_id}"
        }
    except AppError as e:
        logger.error(f"Upload failed: {e.message}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected upload error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
