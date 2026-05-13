
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging
from backend.app.api.endpoints import upload, process, results, reimagine

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

static_dir = os.path.join(os.getcwd(), "backend/static")
os.makedirs(static_dir, exist_ok=True)

app.include_router(upload.router, prefix=settings.API_V1_STR, tags=["upload"])
app.include_router(process.router, prefix=settings.API_V1_STR, tags=["process"])
app.include_router(results.router, prefix=settings.API_V1_STR, tags=["results"])
app.include_router(reimagine.router, prefix=settings.API_V1_STR, tags=["reimagine"])


assets_dir = os.path.join(static_dir, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/vite.svg")
async def vite_icon():
    path = os.path.join(static_dir, "vite.svg")
    if os.path.isfile(path):
        return FileResponse(path)
    return JSONResponse({}, status_code=404)


@app.get("/")
async def read_index():
    index_path = os.path.join(static_dir, "index.html")
    if not os.path.isfile(index_path):
        return JSONResponse(
            {
                "detail": "UI not built. From repo root: cd frontend && npm install && npm run build",
            },
            status_code=503,
        )
    return FileResponse(index_path)


@app.get("/health")
def health_check():
    return {"status": "ok"}
