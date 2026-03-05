"""Search API: GET /search."""
from typing import Optional

from fastapi import APIRouter, Query

from app.config import DB_PATH
from app.db.resource_db import ResourceDB
from app.search.resource_search import ResourceSearch

router = APIRouter(tags=["search"])
resource_db = ResourceDB(DB_PATH)
search_engine = ResourceSearch(DB_PATH)


@router.get("/search")
def search(
    q: str = Query("", description="Search query"),
    tags: Optional[str] = Query(None, description="Comma-separated tags filter"),
    limit: int = Query(50, ge=1, le=100),
):
    """Full-text search over Published resources."""
    tag_list = [t.strip() for t in tags.split(",")] if tags else None
    results = search_engine.search(q, tags=tag_list, limit=limit)
    return {"results": results}
