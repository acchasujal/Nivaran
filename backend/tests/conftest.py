import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.main import app
from app.db import get_session
from app.dependencies import get_evidence_validator
from app.services.evidence_validation import Stage0Result, Stage0Checks

async def override_validate_evidence_photo(photo_bytes: bytes, mime_type: str):
    if os.environ.get("TEST_STAGE0_INVALID") == "1":
        return Stage0Result(
            accepted=False,
            failure="DOCUMENT",
            confidence=0.99,
            detected_object="Document",
            checks=Stage0Checks(file=True, quality=True, scene=False, infrastructure=False, issue=False),
            message="Unsupported submission: Document detected.",
            suggestion="Please upload a real photograph showing a local civic infrastructure issue instead of a document or certificate."
        )
    return Stage0Result(
        accepted=True,
        failure=None,
        confidence=1.0,
        detected_object="Pothole",
        checks=Stage0Checks(file=True, quality=True, scene=True, infrastructure=True, issue=True),
        message="Valid photo",
        suggestion="Valid"
    )

@pytest.fixture(autouse=True)
def global_validator_override():
    os.environ.setdefault("GEMINI_API_KEY", "dummy_test_key_for_unit_tests")
    app.dependency_overrides[get_evidence_validator] = lambda: override_validate_evidence_photo
    yield
    app.dependency_overrides[get_evidence_validator] = lambda: override_validate_evidence_photo

@pytest.fixture(name="engine", scope="session")
def engine_fixture():
    test_db_url = os.environ.get("TEST_DATABASE_URL")
    temp_file = None
    if not test_db_url:
        temp_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        temp_file.close()
        test_db_url = f"sqlite:///{temp_file.name}"

    if test_db_url.startswith("sqlite"):
        engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(test_db_url)

    yield engine
    engine.dispose()

    if temp_file and os.path.exists(temp_file.name):
        try:
            os.remove(temp_file.name)
        except Exception:
            pass

@pytest.fixture(name="session")
def session_fixture(engine):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
