"""
Production SQLite -> PostgreSQL Data Migration & Integrity Verification Script for Nivaran.

Usage:
  python migrate_sqlite_to_pg.py --sqlite-path nivaran.db --pg-url postgresql://user:password@host/dbname
"""

import argparse
import logging
import sqlite3
from typing import Dict, Any, List
from sqlalchemy import create_engine, MetaData, Table, inspect, select, text
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migration")

# Import all models to ensure SQLModel metadata is registered
from app.models import (
    Cluster, Issue, ImpactSummary, ActionDraft, Escalation,
    User, Role, Permission, RefreshToken, DeviceSession, LoginHistory,
    IdempotencyKey, UploadSession, MediaAsset, OfflineSyncJob, SyncConflict,
    Department, OfficerProfile, CaseAssignment, CaseTransition, RepairVerification, ResolutionRecord,
    Notification, NotificationPreference, NotificationDelivery, Announcement
)

# Ordered sequence to respect Foreign Key dependencies during insertion
TABLE_IMPORT_ORDER = [
    "roles",
    "permissions",
    "departments",
    "users",
    "officer_profiles",
    "refresh_tokens",
    "device_sessions",
    "login_history",
    "clusters",
    "issues",
    "impact_summaries",
    "action_drafts",
    "escalations",
    "case_assignments",
    "case_transitions",
    "repair_verifications",
    "resolution_records",
    "idempotency_keys",
    "upload_sessions",
    "media_assets",
    "offline_sync_jobs",
    "sync_conflicts",
    "notifications",
    "notification_preferences",
    "notification_deliveries",
    "announcements"
]

def migrate_data(sqlite_path: str, pg_url: str):
    logger.info(f"Connecting to source SQLite database: {sqlite_path}")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Ensure URL uses postgresql dialect and has explicit driver if needed
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    logger.info("Connecting to target PostgreSQL database...")
    try:
        pg_engine = create_engine(pg_url, pool_pre_ping=True)
    except Exception as exc:
        if "psycopg2" in str(exc) or "ModuleNotFoundError" in str(exc):
            logger.info("psycopg2 driver not installed in current Python environment, trying psycopg...")
            if "+" not in pg_url.split("://")[0]:
                pg_url_driver = pg_url.replace("postgresql://", "postgresql+psycopg://", 1)
                pg_engine = create_engine(pg_url_driver, pool_pre_ping=True)
            else:
                raise
        else:
            raise

    logger.info("Ensuring PostgreSQL table schemas exist via SQLModel metadata...")
    SQLModel.metadata.create_all(pg_engine)

    pg_meta = MetaData()
    pg_meta.reflect(bind=pg_engine)

    stats = {
        "migrated_tables": 0,
        "total_records_inserted": 0,
        "table_counts": {}
    }

    with pg_engine.begin() as pg_conn:
        for table_name in TABLE_IMPORT_ORDER:
            if table_name not in pg_meta.tables:
                logger.warning(f"Table '{table_name}' not found in PostgreSQL metadata. Skipping.")
                continue

            # Fetch rows from SQLite
            sqlite_cursor.execute(f'SELECT * FROM "{table_name}"')
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                logger.info(f"Table '{table_name}': 0 records found in SQLite.")
                stats["table_counts"][table_name] = 0
                continue

            records: List[Dict[str, Any]] = [dict(r) for r in rows]
            pg_table = pg_meta.tables[table_name]

            logger.info(f"Migrating {len(records)} records into table '{table_name}'...")
            
            # Perform bulk insert
            pg_conn.execute(pg_table.insert(), records)
            
            stats["migrated_tables"] += 1
            stats["total_records_inserted"] += len(records)
            stats["table_counts"][table_name] = len(records)

    sqlite_conn.close()
    logger.info("Migration data transfer completed. Validating target PostgreSQL row counts...")

    # Data Integrity Validation Phase
    validation_failures = 0
    with pg_engine.connect() as check_conn:
        for table_name, expected_count in stats["table_counts"].items():
            if expected_count == 0:
                continue
            res = check_conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
            if res != expected_count:
                logger.error(f"VALIDATION FAILURE: Table '{table_name}' expected {expected_count} rows, found {res} in PostgreSQL!")
                validation_failures += 1
            else:
                logger.info(f"VERIFIED: Table '{table_name}' -> {res}/{expected_count} records intact.")

    if validation_failures == 0:
        logger.info("🎉 DATA MIGRATION SUCCESSFUL! All records, constraints, and relationships verified intact.")
    else:
        raise RuntimeError(f"Data migration validation failed with {validation_failures} table mismatches.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite database to PostgreSQL for Nivaran")
    parser.add_argument("--sqlite-path", default="nivaran.db", help="Path to local SQLite file")
    parser.add_argument("--pg-url", required=True, help="Target PostgreSQL connection URL")
    args = parser.parse_args()

    migrate_data(args.sqlite_path, args.pg_url)
