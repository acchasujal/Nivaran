import os
import sys
import asyncio
import json
import random
import uuid
from sqlmodel import Session, select
from datetime import datetime

# Adjust sys.path to run from backend directory
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load settings from .env file
env_path = ".env"
api_keys = []
sendgrid_key = ""
sendgrid_from = ""
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("=", 1)
            if len(parts) == 2:
                key, val = parts[0].strip(), parts[1].strip()
                if key == "GEMINI_API_KEYS":
                    api_keys = [k.strip() for k in val.split(",") if k.strip()]
                elif key == "SENDGRID_API_KEY":
                    sendgrid_key = val
                elif key == "SENDGRID_FROM_EMAIL":
                    sendgrid_from = val

# Set initial keys in env
if api_keys:
    os.environ["GEMINI_API_KEY"] = api_keys[0]
if sendgrid_key:
    os.environ["SENDGRID_API_KEY"] = sendgrid_key
if sendgrid_from:
    os.environ["SENDGRID_FROM_EMAIL"] = sendgrid_from

from app.config import settings
from app.db import engine, init_db
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.models.action_draft import ActionDraft
from app.models.escalation import Escalation
from app.services.agent_1_intake import analyze_issue_photo
from app.services.agent_2_verification import verify_and_cluster_issue
from app.services.agent_3_impact import analyze_cluster_impact
from app.services.agent_4_action_generator import generate_action_drafts
from app.services.agent_5_escalation import escalate_draft

# Use gemini-2.5-flash which is the only model with remaining quota
settings.GEMINI_MODEL = "gemini-2.5-flash"
current_key_idx = 0

def rotate_api_key():
    global current_key_idx
    if not api_keys:
        return
    current_key_idx = (current_key_idx + 1) % len(api_keys)
    new_key = api_keys[current_key_idx]
    settings.GEMINI_API_KEY = new_key
    os.environ["GEMINI_API_KEY"] = new_key
    print(f"\n[Rotation] Key Index={current_key_idx + 1}/{len(api_keys)}: {new_key[:5]}...{new_key[-5:]}")

async def run_with_retry(async_func, *args, **kwargs):
    max_retries = 10
    for attempt in range(max_retries):
        try:
            return await async_func(*args, **kwargs)
        except Exception as e:
            error_str = str(e)
            print(f"Attempt {attempt + 1} failed: {error_str}")
            # If 503 UNAVAILABLE or rate limit, rotate key and sleep
            if any(term in error_str.upper() for term in ["RESOURCE_EXHAUSTED", "UNAVAILABLE", "502", "503", "AI_UNAVAILABLE", "QUOTA", "TIMEOUT"]):
                rotate_api_key()
                # Wait 10 seconds for spikes/rate limits to cool down
                await asyncio.sleep(10)
            else:
                # Other error (DB or model schema validation error)
                raise e
    raise RuntimeError("Max retries exceeded with all available keys on gemini-2.5-flash.")

async def run_e2e():
    print("=================== CivicPulse E2E Execution ===================")
    
    # 1. Load a real photo
    photo_path = "../scripts/demo_assets/pothole1.jpg"
    if not os.path.exists(photo_path):
        print(f"Error: Photo not found at {photo_path}")
        return
        
    with open(photo_path, "rb") as f:
        photo_bytes = f.read()
    print(f"Loaded photo: {photo_path} ({len(photo_bytes)} bytes)")
    
    # Ensure tables exist
    init_db()
    
    # Create database session
    session = Session(engine)
    
    # Coordinates (using a unique coordinate in Mumbai to create a fresh cluster)
    lat = 19.0765 + random.uniform(-0.005, 0.005)
    lng = 72.8785 + random.uniform(-0.005, 0.005)
    user_note = "Large pothole in the middle of the street near the intersection, causing traffic delays."
    
    print(f"Using coordinates: {lat}, {lng}")
    print(f"Model used: {settings.GEMINI_MODEL}")
    
    print("\n--- 1. Running Agent 1 (Intake Analysis) ---")
    try:
        agent1_result = await run_with_retry(
            analyze_issue_photo,
            photo_bytes=photo_bytes,
            mime_type="image/jpeg",
            user_note=user_note
        )
        print("Agent 1 Result:")
        print(json.dumps(agent1_result.model_dump(), indent=2))
    except Exception as e:
        print(f"Agent 1 Failed: {e}")
        return

    # Create and save DB record
    unique_filename = f"e2e_{uuid.uuid4()}.jpg"
    
    # Save the photo under static/uploads
    os.makedirs("static/uploads", exist_ok=True)
    with open(f"static/uploads/{unique_filename}", "wb") as f:
        f.write(photo_bytes)
        
    db_issue = Issue(
        photo_url=f"/static/uploads/{unique_filename}",
        latitude=lat,
        longitude=lng,
        user_note=user_note,
        issue_type=agent1_result.issue_type,
        severity=agent1_result.severity,
        description=agent1_result.description,
        credibility_score=agent1_result.credibility_score,
        status="classified"
    )
    session.add(db_issue)
    session.commit()
    session.refresh(db_issue)
    
    print(f"\nSaved Issue to Database: ID={db_issue.id}, Status={db_issue.status}")
    
    print("\n--- 2. Running Agent 2 (Verification / Clustering) ---")
    try:
        await run_with_retry(
            verify_and_cluster_issue,
            issue=db_issue,
            session=session
        )
        session.refresh(db_issue)
        print(f"Clustered Issue: ID={db_issue.id}, Cluster ID={db_issue.cluster_id}, Status={db_issue.status}")
        
        cluster = session.get(Cluster, db_issue.cluster_id)
        print("Associated Cluster Info:")
        print(json.dumps(cluster.model_dump(), indent=2, default=str))
    except Exception as e:
        print(f"Agent 2 Failed: {e}")
        return

    print("\n--- 3. Running Agent 3 (Impact Intelligence) ---")
    try:
        await run_with_retry(
            analyze_cluster_impact,
            cluster_id=cluster.id,
            session=session
        )
        
        impact = session.exec(
            select(ImpactSummary).where(ImpactSummary.cluster_id == cluster.id)
        ).first()
        print("Created Impact Summary:")
        if impact:
            print(json.dumps(impact.model_dump(), indent=2, default=str))
        else:
            print("No impact summary found in database!")
    except Exception as e:
        print(f"Agent 3 Failed: {e}")
        return

    print("\n--- 4. Running Agent 4 (Action Draft Generator) ---")
    try:
        await run_with_retry(
            generate_action_drafts,
            cluster_id=cluster.id,
            session=session
        )
        
        drafts = session.exec(
            select(ActionDraft).where(ActionDraft.cluster_id == cluster.id)
        ).all()
        print(f"Generated {len(drafts)} drafts:")
        for d in drafts:
            print(f"- Type: {d.draft_type}, Status: {d.status}, ID: {d.id}")
            print(f"  Content Preview: {d.content[:150]}...\n")
    except Exception as e:
        print(f"Agent 4 Failed: {e}")
        return

    print("\n--- 5. Approving Draft and Running Agent 5 (Escalation) ---")
    # Find the complaint draft
    complaint_draft = next((d for d in drafts if d.draft_type == "complaint"), None)
    if not complaint_draft:
        print("Error: No complaint draft found.")
        return
        
    # Approve it
    complaint_draft.status = "approved"
    session.add(complaint_draft)
    session.commit()
    session.refresh(complaint_draft)
    print(f"Approved draft {complaint_draft.id} (type: complaint)")
    
    recipient_email = "guptapriyanka1117@gmail.com"
    print(f"Sending real escalation email to: {recipient_email}")
    
    try:
        escalation = await escalate_draft(
            draft_id=complaint_draft.id,
            method="email",
            recipient=recipient_email,
            session=session
        )
        print("Escalation Result:")
        print(json.dumps(escalation.model_dump(), indent=2, default=str))
    except Exception as e:
        print(f"Agent 5 Failed: {e}")
        
    print("\n--- 6. Final Database State ---")
    session.refresh(db_issue)
    session.refresh(cluster)
    
    print("Final Issue Status:", db_issue.status)
    print("Final Cluster Report Count:", cluster.report_count)
    
    # Query all escalations for this draft
    escalations = session.exec(
        select(Escalation).where(Escalation.draft_id == complaint_draft.id)
    ).all()
    print(f"Total escalations in DB for this draft: {len(escalations)}")
    for esc in escalations:
        print(f"- Escalation ID: {esc.id}, Status: {esc.status}, Method: {esc.method}, Provider Response: {esc.provider_response}")

    session.close()
    print("\n=================== E2E Run Finished ===================")

if __name__ == "__main__":
    asyncio.run(run_e2e())
