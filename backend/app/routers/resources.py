"""Resource API: GET, POST, PUT, PATCH, DELETE, OPTIONS, publish, move."""
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user_optional, has_access
from app.config import DB_PATH
from app.db import ResourceDB, ResourceIn, ResourceStored
from app.db.schemas import PermissionsOut

router = APIRouter(prefix="/resources", tags=["resources"])
db = ResourceDB(DB_PATH)


@router.get("/{slug}", response_model=ResourceStored)
def get_resource(
    slug: str,
    version: Annotated[
        Literal["Draft", "Published"],
        Query(description="Which version to read"),
    ] = "Published",
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Read resource by slug. Published is public; Draft requires UPDATE."""
    resource = db.get(slug, version)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if version == "Draft":
        if not has_access(user, slug, "Draft", "READ", resource.authors, resource.tags):
            raise HTTPException(status_code=403, detail="No access to Draft")
    return resource


@router.post("/{slug}", status_code=status.HTTP_201_CREATED, response_model=ResourceStored)
def create_resource(
    slug: str,
    data: ResourceIn,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Create resource. User becomes Owner. Requires auth in Phase 3."""
    # Phase 1: allow unauthenticated for dev; Phase 3 will require auth
    author_id = (user or {}).get("user_id", "anonymous")
    try:
        return db.create(slug, data, author_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{slug}", response_model=ResourceStored)
def update_resource(
    slug: str,
    data: ResourceIn,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Update Draft only."""
    resource = db.get(slug, "Draft")
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not has_access(user, slug, "Draft", "UPDATE", resource.authors, resource.tags):
        raise HTTPException(status_code=403, detail="No update access")
    try:
        return db.update(slug, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.options("/{slug}", response_model=PermissionsOut)
def get_permissions(
    slug: str,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Get permissions for a resource. Stub: auth = can do anything."""
    resource = db.get(slug, "Draft") or db.get(slug, "Published")
    if not resource:
        return PermissionsOut()
    read = has_access(user, slug, "Published", "READ") or has_access(
        user, slug, "Draft", "READ", resource.authors, resource.tags
    )
    update = has_access(user, slug, "Draft", "UPDATE", resource.authors, resource.tags)
    delete = has_access(user, slug, "Draft", "DELETE", resource.authors, resource.tags)
    publish = user and user.get("is_admin", False)
    return PermissionsOut(
        read=read,
        update=update,
        delete=delete,
        publish=publish,
    )


@router.patch("/{slug}")
def mark_for_publication(
    slug: str,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Mark resource for publication (add to MARKS)."""
    resource = db.get(slug, "Draft")
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not has_access(user, slug, "Draft", "UPDATE", resource.authors, resource.tags):
        raise HTTPException(status_code=403, detail="No update access")
    try:
        db.mark_for_publication(slug)
        return {"status": "marked", "slug": slug}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{slug}")
def delete_resource(
    slug: str,
    soft: Annotated[bool, Query(description="Soft delete (unpublish)")] = True,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Unpublish or soft-delete resource."""
    resource = db.get(slug, "Draft") or db.get(slug, "Published")
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not has_access(user, slug, "Draft", "DELETE", resource.authors, resource.tags):
        raise HTTPException(status_code=403, detail="No delete access")
    try:
        db.delete(slug, soft=soft)
        return {"status": "deleted", "slug": slug}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Publish and move - separate path structure per spec
publish_router = APIRouter(prefix="/publish_resources", tags=["publish"])
move_router = APIRouter(tags=["resources"])


@publish_router.get("/{slug}", response_model=ResourceStored)
def publish_resource(
    slug: str,
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Publish resource (copy Draft -> Published)."""
    resource = db.get(slug, "Draft")
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not has_access(user, slug, "Draft", "UPDATE", resource.authors, resource.tags):
        raise HTTPException(status_code=403, detail="No publish access")
    try:
        return db.publish(slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@move_router.put("/resource_move")
def move_resource(
    slug: Annotated[str, Query()],
    new_slug: Annotated[str, Query()],
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """Move resource to new slug."""
    resource = db.get(slug, "Draft") or db.get(slug, "Published")
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not has_access(user, slug, "Draft", "UPDATE", resource.authors, resource.tags):
        raise HTTPException(status_code=403, detail="No update access")
    try:
        db.move(slug, new_slug)
        return {"status": "moved", "slug": slug, "new_slug": new_slug}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
