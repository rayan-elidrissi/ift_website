#!/usr/bin/env python
"""Run the FastAPI backend. Usage: python run.py (from backend dir) or python backend/run.py"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
