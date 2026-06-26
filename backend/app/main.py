from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
from contextlib import asynccontextmanager

from app.config import settings
from app.db import init_db
from app.routers import issues, clusters, impact, actions, escalations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("civicpulse")

# Ensure static directories exist at import time
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/downloads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database tables
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down application...")

app = FastAPI(
    title="CivicPulse API",
    description="5-Agent Civic Accountability Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Lockdown to frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/api/static", StaticFiles(directory="static"), name="api_static")

# Wire routers under /api namespace
app.include_router(issues.router, prefix="/api")
app.include_router(clusters.router, prefix="/api")
app.include_router(impact.router, prefix="/api")
app.include_router(actions.router, prefix="/api")
app.include_router(escalations.router, prefix="/api")

# Dynamic frontend dist directory resolution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sibling_dist = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
local_dist = os.path.abspath(os.path.join(BASE_DIR, "frontend", "dist"))

if os.path.exists(local_dist):
    dist_dir = local_dist
elif os.path.exists(sibling_dist):
    dist_dir = sibling_dist
else:
    dist_dir = os.path.join(BASE_DIR, "frontend", "dist")

assets_dir = os.path.join(dist_dir, "assets")

# Mount assets directory if it exists
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CivicPulse API is running"}

# SPA catch-all route to serve the React index.html or other static files in dist
from fastapi.responses import FileResponse

@app.get("/{catchall:path}")
async def serve_spa(catchall: str):
    # Try serving exact file (e.g. favicon.ico, logo.png) from dist root
    file_path = os.path.join(dist_dir, catchall)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to SPA index.html
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {"message": "Frontend build assets not found. Run npm run build."}
