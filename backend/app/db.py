from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
import logging

logger = logging.getLogger("civicpulse")

sqlite_file_name = "civicpulse.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()
    logger.info("SQLite connection initialized with PRAGMA journal_mode=WAL")

def init_db():
    # Import all models to ensure they are registered with SQLModel.metadata before creation
    from app.models import Cluster, Issue, ImpactSummary, ActionDraft, Escalation
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables initialized successfully.")

def get_session():
    with Session(engine) as session:
        yield session
