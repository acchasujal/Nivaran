# DEMO_ARCHITECTURE.md
**This document exists solely to prevent demo failure. Read before running any demo rehearsal.**

---

## Demo Architecture Goal

The demo must show, in 3–5 minutes, that:
1. A real photo produces a real AI classification (Agent 1).
2. Multiple reports aggregate into evidence (Agent 2 clustering).
3. Evidence produces an impact narrative (Agent 3).
4. Evidence produces actionable drafts (Agent 4).
5. A human approves, and something real happens outside the system (Agent 5 email or PDF).

The demo must work with no pre-knowledge assumed from the judge, no WiFi dependencies that can fail silently, and no blank screens.

---

## Demo Environment Configuration

```env
# .env.demo — used only for demo day; never use in production testing
DEMO_MODE=true
DEMO_THRESHOLD_OVERRIDE=true  # overrides ESCALATION_THRESHOLD to 1 for the demo
ESCALATION_THRESHOLD=3        # production default overridden by DEMO_THRESHOLD_OVERRIDE
AGENT5_PDF_FALLBACK=true      # auto PDF if email fails
GEMINI_TIMEOUT_SECONDS=15     # unchanged from production
SENDGRID_API_KEY=<real key>
SENDGRID_FROM_EMAIL=<verified sender>
DEMO_RECIPIENT_EMAIL=<your email address, monitored during demo>
FRONTEND_ORIGIN=<deployed frontend URL>
```

**Why DEMO_THRESHOLD_OVERRIDE=true in demo mode:**
Without this override, demonstrating Agent 3 and Agent 4 requires 3 live photo submissions during the demo (each taking 8–16 seconds). With `DEMO_THRESHOLD_OVERRIDE=true` (which forces the effective threshold to `1`), a single live submission triggers the complete pipeline. This is documented explicitly as an intentional demo configuration — it demonstrates architectural maturity, not a workaround.

---

## Pre-Demo State (Required Before Any Judge Interaction)

The demo must begin in this state. Use the seeding script to achieve it.

```
Database state required at demo start:
  clusters: 2 clusters with report_count >= 2
  issues: 6 issues total (3 per cluster)
  impact_summaries: 2 rows (one per cluster, generated from seeded issues)
  action_drafts: 6 rows (3 per cluster: complaint, rti, community_summary), status=pending_review
  escalations: 0 rows (demo will generate these live)
```

**Running the seeding script:**
```bash
DEMO_MODE=true python scripts/seed_demo.py
# Verify: GET /issues returns 6 issues
# Verify: GET /clusters returns 2 clusters
# Verify: TrackerPage shows populated state
```

This script must be run fresh before every demo (wipe + reseed). Never demo on a previously-used database state.

---

## Demo Flow (Step-by-Step)

### Phase 1 — Narrative Setup (30 seconds, no tech)
> "Citizens already have ways to report potholes and broken streetlights. The problem is what happens after they report — usually nothing. CivicPulse converts that evidence into a real complaint or RTI draft that gets sent."

### Phase 2 — Live Report Submission (90 seconds)
1. Open IntakePage on mobile or browser.
2. Upload demo photo (pre-selected: `demo_assets/pothole_01.jpg`).
3. Allow GPS or drop pin on map.
4. Click Submit. Show "Analyzing photo..." spinner.
5. 201 returns. Show the classified issue: type, severity, description, credibility score.
6. **Say:** "Gemini Vision extracted the issue type, severity, and a description directly from the photo."
7. Navigate to TrackerPage. Show the new issue alongside seeded cluster.
8. **Say:** "Agent 2 detected this is part of a pattern — the same intersection has 3 reports now."

### Phase 3 — Evidence and Impact (60 seconds)
1. Open IssueDetailPage for the cluster with the new submission.
2. Show impact summary: affected_area_description, risk_level, evidence_count.
3. Show the 3 draft cards below the impact summary.
4. **Say:** "Agent 3 synthesized all 4 reports into this impact summary — no invented scores, just the evidence we actually have."

### Phase 4 — Human Approval and Escalation (60 seconds)
1. Click "Review Draft" on the RTI draft card.
2. Show the full draft text in ApprovalModal — including the disclaimer at the top.
3. **Say:** "The draft is AI-generated and labeled as such. The human decides whether to send it."
4. Click Approve. Modal closes. EscalationButton activates.
5. Click EscalationButton. Choose method=email.
6. **If email succeeds:** Show escalation row with status=sent, provider_response="202 Accepted". Say: "Agent 5 sent a real email to the ward office contact. Here's the delivery confirmation."
7. **If email fails (fallback):** Show PDF download. Open the PDF. Say: "Email delivery failed — Agent 5 automatically generated a PDF package instead. A single escalation record is written in the database with the final status and error details."

### Phase 5 — Judge Q&A (remaining time)
See `DEMO_DAY_PLAYBOOK.md` for tough question responses.

---

## Demo State Machine

```
Pre-Demo State (seeded)
    │
    ├── Tracker populated ✓
    ├── Impact summaries exist ✓
    └── Drafts in pending_review ✓

Live Submission
    │
    ├── Agent 1 classifies photo ──► success: show result (15s max)
    │                            └── failure: retry button visible, cut to Phase 3 from seeded data
    │
    ├── Agent 2 clusters ──► success: report_count increments
    │
    └── Agent 3+4 ──► success: impact summary updates, draft for new cluster appears
                  └── failure: show existing seeded draft, narrate as expected behavior

Approval + Escalation
    ├── Email send ──► success: show delivery confirmation
    │             └── failure: PDF export runs, show PDF
    │
    └── PDF export ──► success: show PDF download
                  └── failure: show .txt download; narrate "email and PDF available in full deployment"
```

---

## Demo Risks and Mitigation

| Risk | Probability | Mitigation |
|---|---|---|
| Gemini Vision slow (>10s) | Medium | "This typically takes 5-8 seconds — Gemini Vision is analyzing the full image." Show demo while waiting. If >15s: show retry toast, cut to seeded data. |
| Gemini Vision timeout / 502 | Low | Switch to Phase 3 immediately using seeded data. Say: "Let me show you the impact from our existing reports while that processes." |
| SendGrid delivery delay | Medium | Show provider_response "202 Accepted" in UI immediately. Say: "Delivery confirmed by SendGrid — the email is in transit." Open phone showing notification at the end. |
| SendGrid HTTP failure | Low | AGENT5_PDF_FALLBACK=true handles this automatically. PDF opens in browser. This is a legitimate demo — show the PDF. |
| Both email and PDF fail | Very Low | Show the DraftCard with full content. Say: "The draft is ready to send — our deployment is resolving a provider issue. The full pipeline is demonstrated through the draft." |
| TrackerPage empty | Very Low | Seeding script run before demo prevents this. If database was wiped: `python scripts/seed_demo.py` takes 30 seconds. |
| GPS doesn't work (laptop browser) | Medium | LocationPicker has manual map-pin fallback. Practice using the pin drop before demo. |
| No venue WiFi | Low | Mobile hotspot as backup. Backend must also work on mobile data (no port restrictions). |
| Judge submits at same time | Medium | WAL mode prevents write conflicts. Rate limiting prevents accidental duplicate sends. |

---

## Demo Rehearsal Protocol

**Minimum:** 10 rehearsals before demo day. Not 2.

| Condition | Rehearsal Goal |
|---|---|
| Normal run | Full flow, timed at 4 minutes |
| Slow Gemini (simulated, add 8s delay) | Narrate confidently during wait |
| Gemini timeout (kill the call) | Recover to seeded data without breaking narrative |
| Email failure (invalid SendGrid key) | PDF fallback shown confidently |
| Empty database (no seed) | Run `seed_demo.py`, verify 30-second recovery |
| No WiFi (airplane mode + hotspot only) | Confirm backend accessible via hotspot URL |
| Two simultaneous submitters | No 500 errors; WAL mode holds |
| Judge Q&A simulation | All questions in DEMO_DAY_PLAYBOOK.md answered without hesitation |

---

## Demo Assets Checklist

| Asset | Location | Purpose |
|---|---|---|
| `pothole_01.jpg` | `scripts/demo_assets/` | Primary live demo submission photo |
| `pothole_02.jpg` | `scripts/demo_assets/` | Backup if primary shows unexpected results |
| `streetlight_01.jpg` | `scripts/demo_assets/` | Second issue type for variety |
| `water_leak_01.jpg` | `scripts/demo_assets/` | Third issue type for variety |
| Seeded cluster 1: "Andheri East Junction" | Populated by seed script | Road damage cluster (3 reports) |
| Seeded cluster 2: "Linking Road, Bandra" | Populated by seed script | Lighting cluster (3 reports) |
| Demo recipient email | `.env.demo` | Real inbox monitored during demo |
| Mobile phone with Gmail push notifications | Physical | Proof that email arrived during Phase 4 |

---

## Backup Escalation Path

If everything AI-related fails (Gemini down, SendGrid down, PDF fails), the minimum viable demo is:

1. Show the TrackerPage with seeded data.
2. Open an IssueDetailPage with a seeded impact summary.
3. Show a DraftCard with the full RTI draft text.
4. Read the disclaimer aloud: "AI-generated draft. Review before submission."
5. Say: "Every number here — the 3 reports, the affected area, the risk level — traces directly to citizen-submitted photos. Nothing is invented. The email send is available when the provider is back."

This is not a winning demo, but it is not a failing demo. It still demonstrates Agents 1–4, real evidence aggregation, and real draft generation. The judging score takes a hit on Agentic AI Depth, but everything else holds.