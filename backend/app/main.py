"""FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, DB_PATH, DB_UPLOAD_BASE_PATH
from app.db.resource_db import ResourceDB
from app.routers import auth, resources
from app.routers.search_router import router as search_router
from app.routers.upload import router as upload_router
from app.search.resource_search import ResourceSearch


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: rebuild Whoosh index from Published resources."""
    db = ResourceDB(DB_PATH)
    search_engine = ResourceSearch(DB_PATH)
    try:
        count = search_engine.rebuild(db)
        print(f"[Search] Index rebuilt: {count} resources")
    except Exception as e:
        print(f"[Search] Index rebuild skipped: {e}")
    yield


app = FastAPI(
    title="IFT CMS API",
    description="Resource-based CMS with file storage",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resources.router)
app.include_router(resources.publish_router)
app.include_router(resources.move_router)
app.include_router(search_router)
app.include_router(upload_router)
app.include_router(auth.router)

# Serve uploaded files
DB_UPLOAD_BASE_PATH.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(DB_UPLOAD_BASE_PATH)), name="uploads")


@app.get("/")
def root():
    """Health check."""
    return {"status": "ok", "service": "IFT CMS API"}
