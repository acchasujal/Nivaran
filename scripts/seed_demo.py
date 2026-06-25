import os
import sys
import argparse
from sqlmodel import Session, SQLModel, select
from sqlalchemy import text

# Adjust sys.path to import app modules correctly from the backend directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.db import engine, init_db
from app.models import Cluster, Issue, ImpactSummary, ActionDraft, Escalation

def wipe_database(session: Session):
    session.execute(text("DELETE FROM escalations"))
    session.execute(text("DELETE FROM action_drafts"))
    session.execute(text("DELETE FROM impact_summaries"))
    session.execute(text("DELETE FROM issues"))
    session.execute(text("DELETE FROM clusters"))
    session.commit()

def seed_data(session: Session):
    # Define Clusters (Only clusters that contain 2 or more reports)
    clusters_data = [
        {"id": "c-road-andheri", "area_label": "Andheri East Junction, near Metro Station", "lat": 19.1196, "lng": 72.8791, "count": 3, "status": "drafted"},
        {"id": "c-light-bandra", "area_label": "Linking Road, Bandra West", "lat": 19.0607, "lng": 72.8362, "count": 3, "status": "escalated"},
        {"id": "c-garbage-juhu", "area_label": "Juhu Beach Rd, Juhu", "lat": 19.1000, "lng": 72.8258, "count": 4, "status": "pending_review"},
        {"id": "c-water-powai", "area_label": "Central Ave, Powai", "lat": 19.1200, "lng": 72.9050, "count": 3, "status": "clustered"},
        {"id": "c-foot-dadar", "area_label": "NC Kelkar Rd, Dadar West", "lat": 19.0178, "lng": 72.8300, "count": 4, "status": "approved"},
        {"id": "c-dump-colaba", "area_label": "Ormiston Rd, Colaba", "lat": 18.9067, "lng": 72.8147, "count": 3, "status": "drafted"},
    ]

    db_clusters = {}
    for c in clusters_data:
        cluster = Cluster(
            id=c["id"],
            area_label=c["area_label"],
            center_lat=c["lat"],
            center_lng=c["lng"],
            report_count=c["count"],
            first_reported_at="2026-06-15T09:00:00Z",
            last_reported_at="2026-06-26T01:15:00Z"
        )
        session.add(cluster)
        db_clusters[c["id"]] = c
    session.commit()

    # Define 24 issues (4 of each of the 6 categories)
    # Statuses: 4 classified, 4 clustered, 4 pending_review, 4 drafted, 4 approved, 4 escalated
    issues_data = [
        {
            "id": "iss-001", "type": "road_damage", "photo": "/static/uploads/demo_pothole1.jpg", "lat": 19.1196, "lng": 72.8791, "cluster_id": None,
            "status": "classified", "severity": 5, "time": "2026-06-26T01:15:00Z", "score": 0.94,
            "desc": "Deep pothole approximately 60cm wide near Andheri Metro pillar 54. Wrecking tires and causing severe evening traffic gridlock.",
            "note": "Almost crashed my scooter avoiding this pothole today!"
        },
        {
            "id": "iss-002", "type": "garbage", "photo": "/static/uploads/demo_garbage1.jpg", "lat": 19.1000, "lng": 72.8258, "cluster_id": "c-garbage-juhu",
            "status": "clustered", "severity": 4, "time": "2026-06-26T00:00:00Z", "score": 0.88,
            "desc": "Large commercial garbage bin completely overflowing onto Juhu Beach Road, attracting stray dogs and generating a foul smell.",
            "note": "Trash has been piling up here for three days straight."
        },
        {
            "id": "iss-003", "type": "street_lighting", "photo": "/static/uploads/demo_streetlight1.jpg", "lat": 19.0607, "lng": 72.8362, "cluster_id": "c-light-bandra",
            "status": "pending_review", "severity": 3, "time": "2026-06-25T23:00:00Z", "score": 0.82,
            "desc": "Two streetlights completely dark near the Turner Road junction, leaving the pedestrian crosswalk in pitch black.",
            "note": "Walking here at night feels extremely unsafe lately."
        },
        {
            "id": "iss-004", "type": "water", "photo": "/static/uploads/demo_leak1.jpg", "lat": 19.1200, "lng": 72.9050, "cluster_id": "c-water-powai",
            "status": "drafted", "severity": 4, "time": "2026-06-25T08:00:00Z", "score": 0.89,
            "desc": "Significant drinking water pipeline leak at Central Ave, spraying water onto the sidewalk and lowering local building pressure.",
            "note": "Gallons of clean water wasted since morning."
        },
        {
            "id": "iss-005", "type": "footpath", "photo": "/static/uploads/demo_sidewalk.jpg", "lat": 19.0178, "lng": 72.8300, "cluster_id": "c-foot-dadar",
            "status": "approved", "severity": 3, "time": "2026-06-24T10:00:00Z", "score": 0.85,
            "desc": "Displaced and shattered concrete tiles on NC Kelkar Rd footpath, forcing pedestrians to walk on the busy main road.",
            "note": "Elderly citizens are tripping here daily."
        },
        {
            "id": "iss-006", "type": "dumping", "photo": "/static/uploads/demo_construction.jpg", "lat": 18.9067, "lng": 72.8147, "cluster_id": "c-dump-colaba",
            "status": "escalated", "severity": 3, "time": "2026-06-23T11:00:00Z", "score": 0.81,
            "desc": "Construction debris, including concrete blocks and tiles, dumped illegally on Ormiston Road, blocking the curb lane.",
            "note": "Dumped overnight by an unidentified truck."
        },
        {
            "id": "iss-007", "type": "road_damage", "photo": "/static/uploads/demo_pothole2.jpg", "lat": 19.1198, "lng": 72.8793, "cluster_id": "c-road-andheri",
            "status": "clustered", "severity": 4, "time": "2026-06-22T09:00:00Z", "score": 0.91,
            "desc": "Series of medium potholes along Andheri road junction. Heavy vehicles crashing through them creates deafening noise at night.",
            "note": "Entire road surface is crumbling."
        },
        {
            "id": "iss-008", "type": "street_lighting", "photo": "/static/uploads/demo_streetlight1.jpg", "lat": 19.0605, "lng": 72.8360, "cluster_id": "c-light-bandra",
            "status": "drafted", "severity": 3, "time": "2026-06-21T15:00:00Z", "score": 0.79,
            "desc": "Non-functional streetlight lamp on Linking Road, Bandra, making the bus stop area feel unsafe for commuters.",
            "note": "Reported this twice to the local ward."
        },
        {
            "id": "iss-009", "type": "garbage", "photo": "/static/uploads/demo_garbage2.jpg", "lat": 19.1002, "lng": 72.8260, "cluster_id": "c-garbage-juhu",
            "status": "pending_review", "severity": 4, "time": "2026-06-20T16:00:00Z", "score": 0.86,
            "desc": "Unregulated waste pile behind Juhu Beach residential zone. Rotten food waste and plastic bags scattered across the side road.",
            "note": "Attracting hordes of crows and stray cats."
        },
        {
            "id": "iss-010", "type": "water", "photo": "/static/uploads/demo_leak2.jpg", "lat": 19.1202, "lng": 72.9052, "cluster_id": "c-water-powai",
            "status": "approved", "severity": 3, "time": "2026-06-19T10:00:00Z", "score": 0.84,
            "desc": "Water main joint leak near Powai central park, leaking continuous stream of clean water into the storm drain.",
            "note": "Clean drinking water just washing into the street."
        },
        {
            "id": "iss-011", "type": "footpath", "photo": "/static/uploads/demo_sidewalk.jpg", "lat": 19.0176, "lng": 72.8298, "cluster_id": "c-foot-dadar",
            "status": "escalated", "severity": 4, "time": "2026-06-18T12:00:00Z", "score": 0.87,
            "desc": "Fallen tree root has cracked and raised the concrete slabs on Dadar West sidewalk, creating a severe tripping hazard.",
            "note": "Footpath completely blocked by raised slabs."
        },
        {
            "id": "iss-012", "type": "dumping", "photo": "/static/uploads/demo_construction.jpg", "lat": 19.0650, "lng": 72.8620, "cluster_id": None,
            "status": "classified", "severity": 3, "time": "2026-06-17T14:00:00Z", "score": 0.83,
            "desc": "Dumped office renovation waste and gypsum boards left on the shoulder of BKC Road, restricting bicycle lane access.",
            "note": "Renovation rubbish left directly in the bike path."
        },
        {
            "id": "iss-013", "type": "road_damage", "photo": "/static/uploads/demo_pothole3.jpg", "lat": 19.1195, "lng": 72.8790, "cluster_id": "c-road-andheri",
            "status": "pending_review", "severity": 4, "time": "2026-06-16T15:00:00Z", "score": 0.90,
            "desc": "Large asphalt crater on Andheri East main road, right after the monsoon showers, causing motorcyclists to swerve dangerously.",
            "note": "Very dangerous for two-wheelers during rain."
        },
        {
            "id": "iss-014", "type": "street_lighting", "photo": "/static/uploads/demo_streetlight1.jpg", "lat": 19.0608, "lng": 72.8364, "cluster_id": "c-light-bandra",
            "status": "approved", "severity": 3, "time": "2026-06-15T09:00:00Z", "score": 0.78,
            "desc": "Row of three decorative street lamps out on the Bandra West connector junction, reducing visibility for vehicles merging.",
            "note": "Extremely dark merge zone on the highway connector."
        },
        {
            "id": "iss-015", "type": "garbage", "photo": "/static/uploads/demo_garbage1.jpg", "lat": 19.1004, "lng": 72.8262, "cluster_id": "c-garbage-juhu",
            "status": "escalated", "severity": 4, "time": "2026-06-14T11:00:00Z", "score": 0.85,
            "desc": "Illegal dumping of residential food waste bags on Juhu Beach corner, overflowing past the public bin.",
            "note": "Public trash can is neglected and overflowing."
        },
        {
            "id": "iss-016", "type": "water", "photo": "/static/uploads/demo_leak1.jpg", "lat": 19.0150, "lng": 72.8170, "cluster_id": None,
            "status": "classified", "severity": 4, "time": "2026-06-13T10:00:00Z", "score": 0.92,
            "desc": "Broken valve on water supply line in Worli, causing a steady pool of water to accumulate near the promenade entrance.",
            "note": "Water leak creating a muddy mess inside the park."
        },
        {
            "id": "iss-017", "type": "footpath", "photo": "/static/uploads/demo_sidewalk.jpg", "lat": 19.0180, "lng": 72.8302, "cluster_id": "c-foot-dadar",
            "status": "clustered", "severity": 3, "time": "2026-06-12T14:00:00Z", "score": 0.80,
            "desc": "Cracked granite sidewalk slabs near Dadar West NC Kelkar Rd, with multiple missing bricks leaving deep holes in the walking path.",
            "note": "Deep cracks and missing bricks make it tough to walk."
        },
        {
            "id": "iss-018", "type": "dumping", "photo": "/static/uploads/demo_construction.jpg", "lat": 18.9069, "lng": 72.8149, "cluster_id": "c-dump-colaba",
            "status": "drafted", "severity": 3, "time": "2026-06-11T16:00:00Z", "score": 0.77,
            "desc": "Debris from building demolition left unattended on the footpath of Colaba Ormiston Rd for over four days.",
            "note": "Rubble pile completely blocking the sidewalk."
        },
        {
            "id": "iss-019", "type": "road_damage", "photo": "/static/uploads/demo_pothole1.jpg", "lat": 19.1197, "lng": 72.8792, "cluster_id": "c-road-andheri",
            "status": "escalated", "severity": 4, "time": "2026-06-10T12:00:00Z", "score": 0.88,
            "desc": "Sunken road surface at Andheri East intersection, causing vehicles to bounce violently and slowing down public buses.",
            "note": "Sunken road is causing vehicle chassis scrapes."
        },
        {
            "id": "iss-020", "type": "street_lighting", "photo": "/static/uploads/demo_streetlight1.jpg", "lat": 19.1860, "lng": 72.8480, "cluster_id": None,
            "status": "classified", "severity": 4, "time": "2026-06-09T09:00:00Z", "score": 0.82,
            "desc": "Flickering streetlight bulb at Malad West residential lane, producing strobe effect and causing driving distraction.",
            "note": "Bulb keeps flashing on and off all night."
        },
        {
            "id": "iss-021", "type": "garbage", "photo": "/static/uploads/demo_garbage2.jpg", "lat": 19.1001, "lng": 72.8259, "cluster_id": "c-garbage-juhu",
            "status": "drafted", "severity": 4, "time": "2026-06-08T11:00:00Z", "score": 0.84,
            "desc": "Discarded plastic packaging and organic waste piled up near the Juhu Beach shopping complex parking exit, blocking walking space.",
            "note": "Very unsightly garbage heap near shopping area."
        },
        {
            "id": "iss-022", "type": "water", "photo": "/static/uploads/demo_leak2.jpg", "lat": 19.1201, "lng": 72.9051, "cluster_id": "c-water-powai",
            "status": "pending_review", "severity": 3, "time": "2026-06-07T10:00:00Z", "score": 0.86,
            "desc": "Wear and tear pipeline joint leak in Powai central avenue area, growing larger each day.",
            "note": "Minor water leak expanding quickly."
        },
        {
            "id": "iss-023", "type": "footpath", "photo": "/static/uploads/demo_sidewalk.jpg", "lat": 19.0177, "lng": 72.8299, "cluster_id": "c-foot-dadar",
            "status": "drafted", "severity": 3, "time": "2026-06-06T09:00:00Z", "score": 0.81,
            "desc": "Unstable paving blocks on Dadar West pedestrian walking street causing mud splashing during rainfall.",
            "note": "Splashes water on pants when stepped on."
        },
        {
            "id": "iss-024", "type": "dumping", "photo": "/static/uploads/demo_construction.jpg", "lat": 18.9065, "lng": 72.8145, "cluster_id": "c-dump-colaba",
            "status": "approved", "severity": 4, "time": "2026-06-05T10:00:00Z", "score": 0.83,
            "desc": "Demolished store bricks and mortar dumped directly on Ormiston Road parking zone, preventing vehicle parking.",
            "note": "Blocks two critical parking spaces."
        }
    ]

    for i in issues_data:
        issue = Issue(
            id=i["id"],
            photo_url=i["photo"],
            latitude=i["lat"],
            longitude=i["lng"],
            user_note=i["note"],
            issue_type=i["type"],
            severity=i["severity"],
            description=i["desc"],
            credibility_score=i["score"],
            cluster_id=i["cluster_id"],
            status=i["status"],
            created_at=i["time"]
        )
        session.add(issue)
    session.commit()

    # Generate matching ImpactSummaries, ActionDrafts, and Escalations
    for c in clusters_data:
        if c["status"] in ["pending_review", "drafted", "approved", "escalated"]:
            impact = ImpactSummary(
                id=f"imp-{c['id']}",
                cluster_id=c["id"],
                affected_area_description=f"Local area of {c['area_label']}, covering critical neighborhood transport zones.",
                potential_consequences=f"Potential risks include vehicle accidents, pedestrian blockages, and safety concerns during nighttime hours.",
                risk_level="high" if c["id"] in ["c-road-andheri", "c-garbage-juhu"] else "moderate",
                evidence_count=c["count"],
                generated_at="2026-06-25T15:00:00Z"
            )
            session.add(impact)

            draft_status = "approved" if c["status"] in ["approved", "escalated"] else "pending_review"

            complaint = ActionDraft(
                id=f"dr-complaint-{c['id']}",
                cluster_id=c["id"],
                draft_type="complaint",
                status=draft_status,
                content=f"To: Municipal Ward Officer\nSubject: Official Complaint regarding issues at {c['area_label']}\n\nWe hereby request immediate action regarding this recurring municipal issue which is negatively impacting local residents.",
                created_at="2026-06-25T15:05:00Z"
            )

            rti = ActionDraft(
                id=f"dr-rti-{c['id']}",
                cluster_id=c["id"],
                draft_type="rti",
                status=draft_status,
                content=f"AI-generated draft. Review before submission.\n\nApplication Under the Right to Information Act, 2005\nTo: Public Information Officer\n\nPlease provide logs of maintenance actions taken at {c['area_label']}.",
                created_at="2026-06-25T15:06:00Z"
            )

            summary = ActionDraft(
                id=f"dr-summary-{c['id']}",
                cluster_id=c["id"],
                draft_type="community_summary",
                status=draft_status,
                content=f"Community Incident Summary: {c['area_label']}\n\nMultiple citizens reported incidents at this location. Local safety remains a top concern.",
                created_at="2026-06-25T15:07:00Z"
            )

            session.add(complaint)
            session.add(rti)
            session.add(summary)
            session.commit()

            if c["status"] == "escalated":
                escalation = Escalation(
                    id=f"esc-{c['id']}",
                    draft_id=complaint.id,
                    method="email",
                    recipient="wardofficer@mcgm.gov.in",
                    status="sent",
                    provider_response="Dispatched via SMTP gateway.",
                    sent_at="2026-06-25T16:00:00Z",
                    created_at="2026-06-25T15:55:00Z"
                )
                session.add(escalation)
                session.commit()

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    parser = argparse.ArgumentParser(description="Seed CivicPulse SQLite database with demo data.")
    parser.add_argument("--wipe", action="store_true", help="Delete all rows from all tables before seeding.")
    args = parser.parse_args()

    init_db()

    with Session(engine) as session:
        if args.wipe:
            wipe_database(session)
        
        existing_clusters = session.exec(select(Cluster)).all()
        if existing_clusters and not args.wipe:
            print("Database already contains data. Use --wipe to reseed.")
            return

        seed_data(session)

    print("✓ 6 clusters created")
    print("✓ 24 issues created")
    print("✓ 5 impact summaries created")
    print("✓ 15 action drafts created")
    print("✓ 1 escalations created")
    print("✓ Demo state ready")

if __name__ == "__main__":
    main()
