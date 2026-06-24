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

# Wire routers
app.include_router(issues.router)
app.include_router(clusters.router)
app.include_router(impact.router)
app.include_router(actions.router)
app.include_router(escalations.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CivicPulse API is running"}
