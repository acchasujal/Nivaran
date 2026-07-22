from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy import event
import logging

logger = logging.getLogger("civicpulse")

from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_sqlite = db_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine = create_engine(db_url, connect_args=connect_args)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()
        logger.info("SQLite connection initialized with PRAGMA journal_mode=WAL")

def init_db():
    # Import all models to ensure they are registered with SQLModel.metadata before creation
    from app.models import (
        Cluster, Issue, ImpactSummary, ActionDraft, Escalation,
        User, Role, Permission, RefreshToken, Session, LoginHistory,
        IdempotencyKey, UploadSession, MediaAsset, OfflineSyncJob, SyncConflict,
        Department, OfficerProfile, CaseAssignment, CaseTransition, RepairVerification, ResolutionRecord,
        Notification, NotificationPreference, NotificationDelivery, Announcement
    )
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables initialized successfully.")




    
    # Auto-seed database if empty (ensures production never appears empty)
    with Session(engine) as session:
        has_issues = session.exec(select(Issue)).first()
        if not has_issues:
            logger.info("Database is empty. Auto-seeding production demo records...")
            try:
                from app.utils.seeder import seed_data
                seed_data(session)
                logger.info("Database auto-seeded successfully.")
            except Exception as e:
                logger.error(f"Failed to auto-seed database: {e}")

def get_session():
    with Session(engine) as session:
        yield session
