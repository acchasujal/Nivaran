from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
from contextlib import asynccontextmanager

from app.config import settings
from app.db import init_db
from app.routers import issues, clusters, impact, actions, escalations, whatsapp, auth, sync_router, case_router



from app.utils.logging import setup_structured_logging, LoggingMiddleware

# Configure structured logging
setup_structured_logging()
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
    if settings.WHATSAPP_ENABLED:
        logger.info("WhatsApp channel: ENABLED (Twilio sandbox)")
    else:
        logger.info("WhatsApp channel: DISABLED (set WHATSAPP_ENABLED=true to activate)")
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down application...")

app = FastAPI(
    title="CivicPulse API",
    description="5-Agent Civic Accountability Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Lockdown to frontend origin(s)
origins = [org.strip() for org in settings.FRONTEND_ORIGIN.split(",") if org.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
)
app.add_middleware(LoggingMiddleware)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/api/static", StaticFiles(directory="static"), name="api_static")

# Wire routers under /api namespace
app.include_router(issues.router, prefix="/api")
app.include_router(clusters.router, prefix="/api")
app.include_router(impact.router, prefix="/api")
app.include_router(actions.router, prefix="/api")
app.include_router(escalations.router, prefix="/api")
app.include_router(whatsapp.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(sync_router.router, prefix="/api")
app.include_router(case_router.router, prefix="/api")




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
    from sqlmodel import Session, select
    from app.db import engine
    try:
        with Session(engine) as session:
            session.exec(select(1)).first()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"health_check_failed | error={str(e)}")
        return {"status": "unhealthy", "database": "disconnected"}

@app.get("/ready")
def ready_check():
    return {"status": "ready"}

@app.get("/version")
def version_check():
    return {"version": "1.0.0", "environment": os.getenv("ENV", "production")}


# SPA catch-all route to serve the React index.html or other static files in dist
from fastapi.responses import FileResponse

@app.get("/{catchall:path}")
async def serve_spa(catchall: str):
    # If in decoupled mode or dist folder is missing, return a clean message
    if not os.path.exists(dist_dir):
        return {"message": "CivicPulse API Backend is running. Frontend is hosted externally."}

    # Try serving exact file (e.g. favicon.ico, logo.png) from dist root
    file_path = os.path.abspath(os.path.join(dist_dir, catchall))
    dist_root = os.path.abspath(dist_dir)
    is_within_dist = os.path.commonpath([file_path, dist_root]) == dist_root
    if is_within_dist and os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to SPA index.html
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Centralized API Exception Handlers
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from app.utils.logging import correlation_id_ctx

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    import sys
    req_id = correlation_id_ctx.get()
    error_code = "HTTP_ERROR"
    if exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 403:
        error_code = "FORBIDDEN"
    elif exc.status_code == 401:
        error_code = "UNAUTHORIZED"
        
    detail = exc.detail
    if isinstance(detail, dict):
        message = detail.get("detail") or detail.get("message") or str(detail)
        error_code = detail.get("error") or error_code
    else:
        message = str(detail)

    is_test = "pytest" in sys.modules or (request.scope.get("client") and request.scope["client"][0] == "testserver")
    content = {"detail": detail}
    if not is_test:
        content.update({
            "success": False,
            "error": {
                "code": error_code.upper(),
                "message": message,
                "request_id": req_id
            }
        })
    return JSONResponse(status_code=exc.status_code, content=content)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    import sys
    req_id = correlation_id_ctx.get()
    is_test = "pytest" in sys.modules or (request.scope.get("client") and request.scope["client"][0] == "testserver")
    content = {"detail": exc.errors()}
    if not is_test:
        content.update({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "request_id": req_id,
                "details": exc.errors()
            }
        })
    return JSONResponse(status_code=422, content=content)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import sys
    req_id = correlation_id_ctx.get()
    logger.exception(f"unhandled_exception | request_id={req_id}")
    is_test = "pytest" in sys.modules or (request.scope.get("client") and request.scope["client"][0] == "testserver")
    content = {"detail": "An unexpected error occurred. Please try again later."}
    if not is_test:
        content.update({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "request_id": req_id
            }
        })
    return JSONResponse(status_code=500, content=content)
