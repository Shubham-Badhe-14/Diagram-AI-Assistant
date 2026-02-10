
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging import setup_logging
from backend.app.api.endpoints import upload, process, results

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Mount static files
static_dir = os.path.join(os.getcwd(), "backend/static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(static_dir, "index.html"))

# Include routers
app.include_router(upload.router, prefix=settings.API_V1_STR, tags=["upload"])
app.include_router(process.router, prefix=settings.API_V1_STR, tags=["process"])
app.include_router(results.router, prefix=settings.API_V1_STR, tags=["results"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
