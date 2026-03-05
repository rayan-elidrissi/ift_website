"""Pydantic schemas for resources and content blocks."""
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# Content block types
class AuthorRef(BaseModel):
    """Author reference in resource."""

    user_id: str
    authorship: Literal["Owner", "Author", "Contributor"] = "Author"


class BlockBase(BaseModel):
    """Base content block."""

    uuid: str = ""
    type: str = ""


class MarkdownBlock(BlockBase):
    """Markdown content block."""

    type: Literal["markdown"] = "markdown"
    content: str = ""


class YoutubeBlock(BlockBase):
    """YouTube embed block."""

    type: Literal["youtube"] = "youtube"
    video_id: str = ""


class PortalBlock(BlockBase):
    """Portal/link block."""

    type: Literal["portal"] = "portal"
    title: str = ""
    url: str = ""
    description: str = ""


class ImageBlock(BlockBase):
    """Image block."""

    type: Literal["image"] = "image"
    url: str = ""
    alt: str = ""


# Content is a list of blocks; each block has uuid, type, and type-specific fields
# Block types: markdown, youtube, portal, image, etc.


class ResourceIn(BaseModel):
    """Input payload for creating/updating a resource."""

    authors: list[AuthorRef] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    title: str = ""
    subtitle: str = ""
    abstract: str = ""
    logo: str = ""
    banner: str = ""
    content: list[dict[str, Any]] = Field(default_factory=list)
    bibliography: str = ""


class ResourceOut(ResourceIn):
    """Output resource with metadata."""

    slug: str = ""
    last_updated: str = ""
    version: Literal["Draft", "Published", "Deleted"] = "Draft"


class ResourceStored(ResourceOut):
    """Resource as stored on disk (includes uid)."""

    uid: str = ""


class PermissionsOut(BaseModel):
    """Permissions for a resource."""

    read: bool = False
    update: bool = False
    delete: bool = False
    publish: bool = False
