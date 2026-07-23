import os
import shutil

def sync_demo_assets():
    os.makedirs("static/uploads", exist_ok=True)
    public_dirs = [
        os.path.abspath("frontend/public"),
        os.path.abspath(os.path.join("..", "frontend", "public")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public"))
    ]
    for pdir in public_dirs:
        if os.path.exists(pdir) and os.path.isdir(pdir):
            for fname in os.listdir(pdir):
                if fname.startswith("demo_") and (fname.endswith(".jpg") or fname.endswith(".png")):
                    src = os.path.join(pdir, fname)
                    dst = os.path.join("static", "uploads", fname)
                    if not os.path.exists(dst):
                        try:
                            shutil.copy2(src, dst)
                        except Exception:
                            pass
            break

def seed_data(session: Session):
    sync_demo_assets()
    # 0. Seed Default Roles and Seed Accounts
    roles_data = [
        {"id": "role-citizen", "name": "citizen", "description": "Standard citizen user"},
        {"id": "role-officer", "name": "officer", "description": "Government municipal ward officer"},
        {"id": "role-auditor", "name": "auditor", "description": "Independent compliance auditor"},
        {"id": "role-admin", "name": "admin", "description": "System administrator"},
        {"id": "role-institution", "name": "institution", "description": "Institutional partner (NGO/Media/Legal)"},
        {"id": "role-evaluation", "name": "evaluation", "description": "Internal evaluation framework user"},
        {"id": "role-anonymous", "name": "anonymous", "description": "Unauthenticated guest citizen"},
    ]
    for r in roles_data:
        if not session.get(Role, r["id"]):
            session.add(Role(id=r["id"], name=r["name"], description=r["description"]))
    session.commit()

    users_data = [
        {
            "id": "USR-ADMIN001",
            "email": "admin@nivaran.org",
            "name": "System Admin",
            "role": "admin",
            "department": "IT & Governance",
            "phone": "+919876543210",
        },
        {
            "id": "USR-OFFICER01",
            "email": "officer@mcgm.gov.in",
            "name": "Rajesh Kumar",
            "role": "officer",
            "department": "K-East Ward Municipal Office",
            "phone": "+919820012345",
        },
        {
            "id": "USR-AUDITOR01",
            "email": "auditor@nivaran.org",
            "name": "Priya Sharma",
            "role": "auditor",
            "department": "Public Audit Bureau",
            "phone": "+919830054321",
        },
        {
            "id": "USR-CITIZEN01",
            "email": "citizen@nivaran.org",
            "name": "Aarav Patel",
            "role": "citizen",
            "department": None,
            "phone": "+919810098765",
        },
    ]

    default_pw = hash_password("nivaran2026!")

    for u in users_data:
        existing = session.exec(select(User).where(User.email == u["email"])).first()
        if not existing:
            user = User(
                id=u["id"],
                email=u["email"],
                hashed_password=default_pw,
                name=u["name"],
                role=u["role"],
                department=u["department"],
                phone=u["phone"],
                is_active=True,
                is_verified=True
            )
            session.add(user)
    session.commit()

    # 1. Define Clusters (Only clusters that contain 2 or more reports)
    clusters_data = [
        {
            "id": "c-road-andheri",
            "area_label": "Andheri East Junction, near Metro Station",
            "lat": 19.1196,
            "lng": 72.8791,
            "count": 4,
            "status": "drafted",
            "first_reported": "2026-06-10T11:15:00Z",
            "last_reported": "2026-06-28T09:30:00Z"
        },
        {
            "id": "c-garbage-bandra",
            "area_label": "Linking Road, Bandra West",
            "lat": 19.0607,
            "lng": 72.8362,
            "count": 2,
            "status": "pending_review",
            "first_reported": "2026-06-26T15:45:00Z",
            "last_reported": "2026-06-28T10:45:00Z"
        },
        {
            "id": "c-dumping-bandra",
            "area_label": "Carter Road Promenade, Bandra West",
            "lat": 19.0610,
            "lng": 72.8366,
            "count": 3,
            "status": "escalated",
            "first_reported": "2026-06-13T10:00:00Z",
            "last_reported": "2026-06-27T17:00:00Z"
        },
        {
            "id": "c-water-powai",
            "area_label": "Central Ave, Powai",
            "lat": 19.1200,
            "lng": 72.9050,
            "count": 2,
            "status": "clustered",
            "first_reported": "2026-06-24T10:00:00Z",
            "last_reported": "2026-06-27T08:15:00Z"
        },
        {
            "id": "c-drain-kurla",
            "area_label": "LBS Marg, Kurla West",
            "lat": 19.0726,
            "lng": 72.8844,
            "count": 2,
            "status": "drafted",
            "first_reported": "2026-06-16T12:00:00Z",
            "last_reported": "2026-06-16T14:00:00Z"
        },
        {
            "id": "c-footpath-dadar",
            "area_label": "NC Kelkar Rd, Dadar West",
            "lat": 19.0178,
            "lng": 72.8300,
            "count": 2,
            "status": "approved",
            "first_reported": "2026-06-19T11:00:00Z",
            "last_reported": "2026-06-27T14:30:00Z"
        },
        {
            "id": "c-manhole-ghatkopar",
            "area_label": "Arterial Road, Ghatkopar East",
            "lat": 19.0864,
            "lng": 72.9082,
            "count": 2,
            "status": "classified",
            "first_reported": "2026-06-08T11:00:00Z",
            "last_reported": "2026-06-26T11:20:00Z"
        },
        {
            "id": "c-tree-powai",
            "area_label": "Powai Vihar Road, Powai",
            "lat": 19.1206,
            "lng": 72.9056,
            "count": 2,
            "status": "escalated",
            "first_reported": "2026-06-19T18:00:00Z",
            "last_reported": "2026-06-24T12:30:00Z"
        },
    ]

    for c in clusters_data:
        existing = session.get(Cluster, c["id"])
        if not existing:
            cluster = Cluster(
                id=c["id"],
                area_label=c["area_label"],
                center_lat=c["lat"],
                center_lng=c["lng"],
                report_count=c["count"],
                first_reported_at=c["first_reported"],
                last_reported_at=c["last_reported"]
            )
            session.add(cluster)
    session.commit()

    # 2. Define 26 issues spanning every asset in scripts/demo_assets/
    issues_data = [
        {
            "id": "iss-001", "type": "road_damage", "photo": "/static/uploads/demo_pothole1.jpg", "lat": 19.1196, "lng": 72.8791, "cluster_id": "c-road-andheri",
            "status": "classified", "severity": 5, "time": "2026-06-28T09:30:00Z", "score": 0.94,
            "desc": "Deep pothole approximately 60cm wide near Andheri Metro pillar 54. Wrecking tires and causing severe evening traffic gridlock.",
            "note": "Almost crashed my scooter avoiding this pothole today!"
        },
        {
            "id": "iss-002", "type": "garbage", "photo": "/static/uploads/demo_garbage1.jpg", "lat": 19.0607, "lng": 72.8362, "cluster_id": "c-garbage-bandra",
            "status": "clustered", "severity": 4, "time": "2026-06-28T10:45:00Z", "score": 0.88,
            "desc": "Large commercial garbage bin completely overflowing onto Juhu Beach Road, attracting stray dogs and generating a foul smell.",
            "note": "Trash has been piling up here for three days straight."
        },
        {
            "id": "iss-003", "type": "street_lighting", "photo": "/static/uploads/demo_streetlight1.jpg", "lat": 19.0373, "lng": 72.8634, "cluster_id": None,
            "status": "classified", "severity": 3, "time": "2026-06-28T11:15:00Z", "score": 0.82,
            "desc": "Two streetlights completely dark near the Turner Road junction, leaving the pedestrian crosswalk in pitch black.",
            "note": "Walking here at night feels extremely unsafe lately."
        },
        {
            "id": "iss-004", "type": "water", "photo": "/static/uploads/demo_leak1.jpg", "lat": 19.1200, "lng": 72.9050, "cluster_id": "c-water-powai",
            "status": "clustered", "severity": 4, "time": "2026-06-27T08:15:00Z", "score": 0.89,
            "desc": "Significant drinking water pipeline leak at Central Ave, spraying water onto the sidewalk and lowering local building pressure.",
            "note": "Gallons of clean water wasted since morning."
        },
        {
            "id": "iss-005", "type": "footpath", "photo": "/static/uploads/demo_sidewalk.jpg", "lat": 19.0178, "lng": 72.8300, "cluster_id": "c-footpath-dadar",
            "status": "approved", "severity": 3, "time": "2026-06-27T14:30:00Z", "score": 0.85,
            "desc": "Displaced and shattered concrete tiles on NC Kelkar Rd footpath, forcing pedestrians to walk on the busy main road.",
            "note": "Elderly citizens are tripping here daily."
        },
        {
            "id": "iss-006", "type": "dumping", "photo": "/static/uploads/demo_dumping1.jpg", "lat": 19.0609, "lng": 72.8365, "cluster_id": "c-dumping-bandra",
            "status": "escalated", "severity": 4, "time": "2026-06-27T17:00:00Z", "score": 0.81,
            "desc": "Construction debris, including concrete blocks and tiles, dumped illegally on Ormiston Road, blocking the curb lane.",
            "note": "Dumped overnight by an unidentified truck."
        },
        {
            "id": "iss-007", "type": "road_damage", "photo": "/static/uploads/demo_pothole2.jpg", "lat": 19.1198, "lng": 72.8793, "cluster_id": "c-road-andheri",
            "status": "drafted", "severity": 4, "time": "2026-06-26T09:00:00Z", "score": 0.91,
            "desc": "Series of medium potholes along Andheri road junction. Heavy vehicles crashing through them creates deafening noise at night.",
            "note": "Entire road surface is crumbling."
        },
        {
            "id": "iss-008", "type": "road_damage", "photo": "/static/uploads/demo_manhole1.jpg", "lat": 19.0864, "lng": 72.9082, "cluster_id": "c-manhole-ghatkopar",
            "status": "classified", "severity": 5, "time": "2026-06-26T11:20:00Z", "score": 0.83,
            "desc": "Open sewer manhole on LBS Road in Ghatkopar, highly dangerous for motorists and pedestrians during monsoon rains.",
            "note": "Dangerous open hole, someone could fall in."
        },
        {
            "id": "iss-009", "type": "garbage", "photo": "/static/uploads/demo_garbage2.jpg", "lat": 19.0605, "lng": 72.8360, "cluster_id": "c-garbage-bandra",
            "status": "pending_review", "severity": 4, "time": "2026-06-26T15:45:00Z", "score": 0.86,
            "desc": "Unregulated waste pile behind Juhu Beach residential zone. Rotten food waste and plastic bags scattered across the side road.",
            "note": "Attracting hordes of crows and stray cats."
        },
        {
            "id": "iss-010", "type": "water", "photo": "/static/uploads/demo_leak2.jpg", "lat": 19.1202, "lng": 72.9052, "cluster_id": "c-water-powai",
            "status": "clustered", "severity": 3, "time": "2026-06-24T10:00:00Z", "score": 0.84,
            "desc": "Water main joint leak near Powai central park, leaking continuous stream of clean water into the storm drain.",
            "note": "Clean drinking water just washing into the street."
        },
        {
            "id": "iss-011", "type": "road_damage", "photo": "/static/uploads/demo_tree1.jpg", "lat": 19.1205, "lng": 72.9055, "cluster_id": "c-tree-powai",
            "status": "escalated", "severity": 4, "time": "2026-06-24T12:30:00Z", "score": 0.87,
            "desc": "Large fallen tree blocking the main lane of Powai Vihar Road, causing traffic diversions and safety hazards.",
            "note": "Tree collapsed after a storm, blocking vehicles."
        },
        {
            "id": "iss-012", "type": "dumping", "photo": "/static/uploads/demo_construction.jpg", "lat": 19.1112, "lng": 72.9276, "cluster_id": None,
            "status": "classified", "severity": 3, "time": "2026-06-24T16:15:00Z", "score": 0.83,
            "desc": "Dumped office renovation waste and gypsum boards left on the shoulder of BKC Road, restricting bicycle lane access.",
            "note": "Renovation rubbish left directly in the bike path."
        },
        {
            "id": "iss-013", "type": "road_damage", "photo": "/static/uploads/demo_pothole3.jpg", "lat": 19.1195, "lng": 72.8790, "cluster_id": "c-road-andheri",
            "status": "drafted", "severity": 4, "time": "2026-06-22T08:00:00Z", "score": 0.90,
            "desc": "Large asphalt crater on Andheri East main road, right after the monsoon showers, causing motorcyclists to swerve dangerously.",
            "note": "Very dangerous for two-wheelers during rain."
        },
        {
            "id": "iss-014", "type": "street_lighting", "photo": "/static/uploads/demo_signal1.jpg", "lat": 19.2307, "lng": 72.8567, "cluster_id": None,
            "status": "approved", "severity": 3, "time": "2026-06-22T14:15:00Z", "score": 0.78,
            "desc": "Row of three decorative street lamps out on the Bandra West connector junction, reducing visibility for vehicles merging.",
            "note": "Extremely dark merge zone on the highway connector."
        },
        {
            "id": "iss-015", "type": "road_damage", "photo": "/static/uploads/demo_pothole4.jpg", "lat": 19.0182, "lng": 72.8305, "cluster_id": None,
            "status": "classified", "severity": 4, "time": "2026-06-22T19:00:00Z", "score": 0.92,
            "desc": "Deep potholes on Dadar flyover entrance, forcing buses and cars to decelerate suddenly, risking pileup collisions.",
            "note": "Pothole at the base of the flyover is extremely risky."
        },
        {
            "id": "iss-016", "type": "footpath", "photo": "/static/uploads/demo_footpath2.jpg", "lat": 19.0622, "lng": 72.8974, "cluster_id": None,
            "status": "classified", "severity": 3, "time": "2026-06-19T07:30:00Z", "score": 0.80,
            "desc": "Broken footpath pavement on Chembur Naka, with exposed rebar and missing tiles posing trip hazards to commuters.",
            "note": "Footpath is completely broken, forced to walk on road."
        },
        {
            "id": "iss-017", "type": "footpath", "photo": "/static/uploads/demo_footpath1.jpg", "lat": 19.0176, "lng": 72.8298, "cluster_id": "c-footpath-dadar",
            "status": "approved", "severity": 3, "time": "2026-06-19T11:00:00Z", "score": 0.81,
            "desc": "Fallen tree root has cracked and raised the concrete slabs on Dadar West sidewalk, creating a severe tripping hazard.",
            "note": "Footpath completely blocked by raised slabs."
        },
        {
            "id": "iss-018", "type": "dumping", "photo": "/static/uploads/demo_dumping2.jpg", "lat": 19.0611, "lng": 72.8367, "cluster_id": "c-dumping-bandra",
            "status": "escalated", "severity": 3, "time": "2026-06-19T15:30:00Z", "score": 0.77,
            "desc": "Debris from building demolition left unattended on the footpath of Colaba Ormiston Rd for over four days.",
            "note": "Rubble pile completely blocking the sidewalk."
        },
        {
            "id": "iss-019", "type": "road_damage", "photo": "/static/uploads/demo_tree2.jpg", "lat": 19.1207, "lng": 72.9057, "cluster_id": "c-tree-powai",
            "status": "escalated", "severity": 4, "time": "2026-06-19T18:00:00Z", "score": 0.85,
            "desc": "Fallen branches and tree limbs blocking access to secondary lanes in Powai, hindering trash collection trucks.",
            "note": "Debris has been sitting on the road shoulder since the storm."
        },
        {
            "id": "iss-020", "type": "street_lighting", "photo": "/static/uploads/demo_signal3.jpg", "lat": 19.2309, "lng": 72.8569, "cluster_id": None,
            "status": "approved", "severity": 4, "time": "2026-06-16T09:00:00Z", "score": 0.84,
            "desc": "Flickering traffic signal light bulb at Borivali intersection, causing safety concerns and visual confusion.",
            "note": "Signal lamp turns off randomly."
        },
        {
            "id": "iss-021", "type": "water", "photo": "/static/uploads/demo_drain1.jpg", "lat": 19.0726, "lng": 72.8844, "cluster_id": "c-drain-kurla",
            "status": "drafted", "severity": 4, "time": "2026-06-16T12:00:00Z", "score": 0.86,
            "desc": "Overflowing storm drain spilling wastewater and sewage onto the street, generating toxic sludge and foul smells.",
            "note": "Drain has been overflowing since yesterday evening."
        },
        {
            "id": "iss-022", "type": "water", "photo": "/static/uploads/demo_drain2.jpg", "lat": 19.0728, "lng": 72.8846, "cluster_id": "c-drain-kurla",
            "status": "drafted", "severity": 3, "time": "2026-06-16T14:00:00Z", "score": 0.81,
            "desc": "Blocked roadside gutter drain in Kurla causing localized ponding of stagnant water on the road margin.",
            "note": "Water is breeding mosquitoes."
        },
        {
            "id": "iss-023", "type": "road_damage", "photo": "/static/uploads/demo_pothole5.jpg", "lat": 19.0175, "lng": 72.8295, "cluster_id": None,
            "status": "classified", "severity": 4, "time": "2026-06-16T16:30:00Z", "score": 0.93,
            "desc": "Deep pavement pothole on Dadar West lane, causing vehicles to dodge and scrape undercarriages.",
            "note": "Scooters constantly trip here."
        },
        {
            "id": "iss-024", "type": "dumping", "photo": "/static/uploads/demo_dumping3.jpg", "lat": 19.0610, "lng": 72.8366, "cluster_id": "c-dumping-bandra",
            "status": "escalated", "severity": 3, "time": "2026-06-13T10:00:00Z", "score": 0.80,
            "desc": "Demolished store bricks and mortar dumped directly on Ormiston Road parking zone, preventing vehicle parking.",
            "note": "Blocks two critical parking spaces."
        },
        {
            "id": "iss-025", "type": "road_damage", "photo": "/static/uploads/demo_pothole4.jpg", "lat": 19.1197, "lng": 72.8792, "cluster_id": "c-road-andheri",
            "status": "drafted", "severity": 4, "time": "2026-06-10T11:15:00Z", "score": 0.89,
            "desc": "Deep road depression on Andheri main corridor, creating a severe drop for transit buses.",
            "note": "Huge bump on the road."
        },
        {
            "id": "iss-026", "type": "road_damage", "photo": "/static/uploads/demo_manhole2.jpg", "lat": 19.0866, "lng": 72.9084, "cluster_id": "c-manhole-ghatkopar",
            "status": "classified", "severity": 5, "time": "2026-06-08T11:00:00Z", "score": 0.82,
            "desc": "Sunken manhole frame on Ghatkopar arterial road, creating a sharp 15cm metal lip hazard for passing tires.",
            "note": "Very dangerous for two-wheelers."
        }
    ]

    for i in issues_data:
        existing = session.get(Issue, i["id"])
        if not existing:
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

    # 3. Generate matching ImpactSummaries, ActionDrafts, and Escalations
    for c in clusters_data:
        if c["status"] in ["pending_review", "drafted", "approved", "escalated"]:
            existing_impact = session.get(ImpactSummary, f"imp-{c['id']}")
            if not existing_impact:
                impact = ImpactSummary(
                    id=f"imp-{c['id']}",
                    cluster_id=c["id"],
                    affected_area_description=f"Local area of {c['area_label']}, covering critical neighborhood transport zones.",
                    potential_consequences=f"Potential risks include vehicle accidents, pedestrian blockages, and safety concerns during nighttime hours.",
                    risk_level="high" if c["id"] in ["c-road-andheri", "c-garbage-bandra", "c-dumping-bandra"] else "moderate",
                    evidence_count=c["count"],
                    generated_at="2026-06-25T15:00:00Z"
                )
                session.add(impact)
            
            draft_status = "approved" if c["status"] in ["approved", "escalated"] else "pending_review"

            # Seed drafts
            draft_types = [
                ("complaint", f"To: Municipal Ward Officer\nSubject: Official Complaint regarding issues at {c['area_label']}\n\nWe hereby request immediate action regarding this recurring municipal issue which is negatively impacting local residents."),
                ("rti", f"AI-generated draft. Review before submission.\n\nApplication Under the Right to Information Act, 2005\nTo: Public Information Officer\n\nPlease provide logs of maintenance actions taken at {c['area_label']}."),
                ("community_summary", f"Community Incident Summary: {c['area_label']}\n\nMultiple citizens reported incidents at this location. Local safety remains a top concern.")
            ]

            for d_type, content in draft_types:
                d_id = f"dr-{d_type}-{c['id']}"
                existing_draft = session.get(ActionDraft, d_id)
                if not existing_draft:
                    draft = ActionDraft(
                        id=d_id,
                        cluster_id=c["id"],
                        draft_type=d_type,
                        status=draft_status,
                        content=content,
                        created_at="2026-06-25T15:05:00Z"
                    )
                    session.add(draft)
            session.commit()

            # Seed Escalations
            if c["status"] == "escalated":
                esc_id = f"esc-{c['id']}"
                existing_escalation = session.get(Escalation, esc_id)
                if not existing_escalation:
                    escalation = Escalation(
                        id=esc_id,
                        draft_id=f"dr-complaint-{c['id']}",
                        method="email",
                        recipient="wardofficer@mcgm.gov.in",
                        status="sent",
                        provider_response="Dispatched via SMTP gateway.",
                        sent_at="2026-06-25T16:00:00Z",
                        created_at="2026-06-25T15:55:00Z"
                    )
                    session.add(escalation)
                    session.commit()
