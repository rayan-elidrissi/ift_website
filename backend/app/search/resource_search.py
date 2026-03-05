"""Whoosh full-text search over Published resources."""
import json
from pathlib import Path
from typing import Optional

from whoosh import index
from whoosh.fields import ID, KEYWORD, Schema, TEXT
from whoosh.qparser import MultifieldParser, QueryParser
from whoosh.query import And, Or, Term

SEARCH_INDEX_DIR = "search_index"


def _flatten_content(content: list) -> str:
    """Extract searchable text from content blocks."""
    parts = []
    for block in content or []:
        if isinstance(block, dict):
            for k, v in block.items():
                if k in ("content", "title", "description", "alt") and isinstance(v, str):
                    parts.append(v)
        elif isinstance(block, str):
            parts.append(block)
    return " ".join(parts)


class ResourceSearch:
    """Whoosh index for Published resources."""

    schema = Schema(
        slug=ID(stored=True, unique=True),
        title=TEXT(stored=True),
        subtitle=TEXT(stored=True),
        abstract=TEXT(stored=True),
        content=TEXT(stored=True),
        tags=KEYWORD(stored=True, commas=True),
    )

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.index_dir = self.db_path / SEARCH_INDEX_DIR
        self._ix: Optional[index.FileIndex] = None

    def _get_index(self):
        if self._ix is None:
            self.index_dir.mkdir(parents=True, exist_ok=True)
            if index.exists_in(str(self.index_dir)):
                self._ix = index.open_dir(str(self.index_dir))
            else:
                self._ix = index.create_in(str(self.index_dir), self.schema)
        return self._ix

    def rebuild(self, resource_db) -> int:
        """Rebuild index from Published resources. Returns count indexed."""
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self._ix = index.create_in(str(self.index_dir), self.schema)
        writer = self._ix.writer()
        count = 0
        for slug in resource_db.list_all_slugs():
            r = resource_db.get(slug, "Published")
            if not r:
                continue
            content_text = _flatten_content(r.content)
            writer.add_document(
                slug=slug,
                title=r.title or "",
                subtitle=r.subtitle or "",
                abstract=r.abstract or "",
                content=content_text,
                tags=",".join(r.tags or []),
            )
            count += 1
        writer.commit()
        return count

    def search(
        self, q: str, tags: Optional[list[str]] = None, limit: int = 50
    ) -> list[dict]:
        """Search resources. Returns list of {slug, title, ...}."""
        if not q.strip() and not tags:
            return []
        ix = self._get_index()
        with ix.searcher() as s:
            clauses = []
            if q.strip():
                parser = MultifieldParser(
                    ["title", "subtitle", "abstract", "content"],
                    schema=self.schema,
                )
                clauses.append(parser.parse(q))
            if tags:
                tag_queries = [Term("tags", t) for t in tags]
                clauses.append(Or(tag_queries))
            if not clauses:
                return []
            query = And(clauses) if len(clauses) > 1 else clauses[0]
            results = s.search(query, limit=limit)
            return [
                {
                    "slug": hit["slug"],
                    "title": hit.get("title", ""),
                    "subtitle": hit.get("subtitle", ""),
                }
                for hit in results
            ]
