"""
Sync all CMS resources from a source API to a target API.

Usage:
    python sync.py                                          # local -> Railway (uses defaults)
    python sync.py --source http://localhost:8000 --target https://your-app.up.railway.app

What it does:
    1. Reads Draft of every resource from the source API
    2. Creates or updates Draft on the target API (PUT always writes to Draft)
    3. For slugs that also have a Published version on source, publishes them on target
"""

import argparse
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote

PAGE_SLUGS = [
    "page-home",
    "page-about",
    "page-research",
    "page-education",
    "page-arts",
    "page-events",
    "page-collaborate",
    "page-footer",
]


def api_get(base: str, path: str) -> dict | None:
    url = f"{base.rstrip('/')}{path}"
    req = Request(url, method="GET")
    req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        if e.code in (404, 403):
            return None
        raise


def api_put(base: str, path: str, body: dict) -> dict:
    url = f"{base.rstrip('/')}{path}"
    data = json.dumps(body).encode()
    req = Request(url, data=data, method="PUT")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def api_post(base: str, path: str, body: dict) -> dict:
    url = f"{base.rstrip('/')}{path}"
    data = json.dumps(body).encode()
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def resource_to_payload(resource: dict) -> dict:
    """Extract the writable fields from a resource response."""
    authors = resource.get("authors", [])
    if isinstance(authors, list):
        authors = [
            {"user_id": a.get("user_id", "anonymous"), "authorship": a.get("authorship", "Owner")}
            for a in authors
        ]
    return {
        "authors": authors,
        "tags": resource.get("tags", []),
        "title": resource.get("title", ""),
        "subtitle": resource.get("subtitle", ""),
        "abstract": resource.get("abstract", ""),
        "logo": resource.get("logo", ""),
        "banner": resource.get("banner", ""),
        "content": resource.get("content", []),
        "bibliography": resource.get("bibliography", ""),
    }


def sync(source: str, target: str, dry_run: bool = False):
    print(f"Source : {source}")
    print(f"Target : {target}")
    if dry_run:
        print("Mode   : DRY RUN (no writes)")
    print()

    for label, base in [("Source", source), ("Target", target)]:
        try:
            health = api_get(base, "/")
            if not health:
                print(f"  [WARN] {label} returned empty response")
            else:
                print(f"  {label} OK: {health.get('service', '?')} - {health.get('status', '?')}")
        except Exception as e:
            print(f"  [ERROR] {label} unreachable: {e}")
            sys.exit(1)
    print()

    synced = 0
    skipped = 0
    errors = 0
    to_publish = []

    # Step 1: Sync Drafts (the latest content, source of truth)
    for slug in PAGE_SLUGS:
        # Read Draft from source (try Draft first, fall back to Published)
        resource = api_get(source, f"/resources/{quote(slug, safe='')}?version=Draft")
        if not resource:
            resource = api_get(source, f"/resources/{quote(slug, safe='')}?version=Published")
        if not resource:
            print(f"  SKIP  {slug:<40} not found on source")
            skipped += 1
            continue

        payload = resource_to_payload(resource)

        if dry_run:
            print(f"  WOULD {slug:<40} -> target Draft")
            synced += 1
        else:
            try:
                # Check if slug exists on target (any version)
                target_existing = (
                    api_get(target, f"/resources/{quote(slug, safe='')}?version=Draft")
                    or api_get(target, f"/resources/{quote(slug, safe='')}?version=Published")
                )
                if target_existing:
                    api_put(target, f"/resources/{quote(slug, safe='')}", payload)
                    print(f"  PUT   {slug:<40} Draft updated on target")
                else:
                    try:
                        api_post(target, f"/resources/{quote(slug, safe='')}", payload)
                        print(f"  POST  {slug:<40} Draft created on target")
                    except HTTPError as e:
                        if e.code == 400:
                            api_put(target, f"/resources/{quote(slug, safe='')}", payload)
                            print(f"  PUT   {slug:<40} Draft updated on target (existed)")
                        else:
                            raise
                synced += 1
            except Exception as e:
                print(f"  ERROR {slug:<40} {e}")
                errors += 1

        # Check if source also had a Published version
        source_pub = api_get(source, f"/resources/{quote(slug, safe='')}?version=Published")
        if source_pub:
            to_publish.append(slug)

    # Step 2: Publish slugs that were Published on source (copies Draft -> Published)
    if to_publish:
        print()
        print("Publishing (copies Draft -> Published on target)...")
        for slug in to_publish:
            if dry_run:
                print(f"  WOULD publish {slug}")
                continue
            try:
                api_get(target, f"/publish_resources/{quote(slug, safe='')}")
                print(f"  PUB   {slug:<40} published on target")
            except Exception as e:
                print(f"  WARN  {slug:<40} publish failed: {e}")

    print()
    print(f"Done: {synced} synced, {skipped} skipped, {errors} errors")


def main():
    parser = argparse.ArgumentParser(
        description="Sync CMS resources from one API to another"
    )
    parser.add_argument(
        "--source",
        default="http://localhost:8000",
        help="Source API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--target",
        default="https://iftwebsite-production.up.railway.app",
        help="Target API base URL (default: Railway production)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be synced without writing",
    )
    args = parser.parse_args()

    if args.source.rstrip("/") == args.target.rstrip("/"):
        print("ERROR: source and target are the same URL")
        sys.exit(1)

    sync(args.source, args.target, args.dry_run)


if __name__ == "__main__":
    main()
