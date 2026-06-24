# JUDGING_STRATEGY.md
**Maps every feature to specific judging criteria. If a feature does not improve at least one judging criterion, it is not built. Read before making any scope decisions.**

---

## Judging Criteria Weights (Estimated)

| Criterion | Estimated Weight | How It Is Scored |
|---|---|---|
| Agentic AI Depth | ~25% | Does the AI actually do something, or just display? Is there a real action with real consequence? |
| Innovation / Differentiation | ~20% | Does it reframe the problem? Is it novel vs. other civic-tech submissions? |
| Google Technologies | ~20% | Depth and breadth of Google APIs. Gemini Vision is table stakes. What else? |
| Real-World Impact | ~20% | Does the output produce something usable? Has the problem been meaningfully advanced? |
| Technical Execution | ~15% | Does it work live? Architecture quality? Error handling? Deployment stability? |

---

## Feature-to-Criterion Mapping

### Agent 1 — Issue Understanding (Gemini Vision)

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | High | First reasoning step: transforms unstructured photo into structured evidence. Without this, the system is a form, not an agent. |
| Google Technologies | High | Gemini 2.0 Flash Vision is the primary Google technology claim. Native multimodal input, structured-output mode. |
| Technical Execution | Medium | Validation + retry logic, 502 on failure, no fabricated fallback demonstrate engineering discipline. |
| Innovation | Medium | Photo-to-evidence transformation is not novel, but it grounds all downstream claims in real data. |
| Real-World Impact | Low direct | Classification alone is not impact. Impact comes from what the evidence enables (Agents 3–5). |

**If this agent is broken:** The entire demo fails. P0.

---

### Agent 2 — Issue Verification (Clustering)

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | High | Evidence aggregation is a reasoning step — the agent decides whether a new report is a new problem or a recurring one. |
| Technical Execution | Medium | Haversine + semantic dedup demonstrates real engineering beyond a simple database insert. |
| Real-World Impact | High | Clustering is what converts isolated complaints into a pattern — the foundation of the accountability argument. |
| Innovation | Medium | The confidence-band default-to-new-cluster is a principled anti-corruption measure; worth narrating to judges. |
| Google Technologies | Low | Gemini is used for semantic dedup only. Not a primary Google Technologies moment. |

**If this agent is broken:** Demo shows isolated one-off reports with no pattern. Impact story collapses. P0.

---

### Agent 3 — Impact Intelligence

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | High | Long-context synthesis over multiple reports. Not display — reasoning over accumulated evidence. |
| Innovation | High | Evidence-based risk_level, affected_area_description, and consequence narrative instead of a fabricated score. This is the specific innovation the project makes vs. typical civic dashboards. |
| Real-World Impact | High | The impact summary is what makes the cluster presentable and credible to a ward office or RTI recipient. |
| Technical Execution | Medium | Output validator (rejects fabricated scores, rejects named officials) demonstrates constraint enforcement under pressure. |
| Google Technologies | Medium | Gemini long-context mode used here — worth mentioning. |

**If this agent is broken:** Draft generation has no evidence grounding. Impact story collapses. P0.

---

### Agent 4 — Action Generator (Complaint / RTI / Community Summary)

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | High | Produces three real-world artifacts from evidence. This is the "create" step in the Observe→Reason→Create→Act pipeline. |
| Innovation | High | RTI draft generation from citizen photo evidence is the most memorable and differentiating feature. No competing civic-tech submission at this hackathon likely has this. |
| Real-World Impact | High | A usable RTI draft is a tangible output that citizens could actually file — even if not court-ready. |
| Technical Execution | Medium | Disclaimer hard gate, fact-checking against source data (no invented statistics), three-type generation. |
| Google Technologies | Medium | Gemini Text generation. Worth noting the fact-grounding constraint in the prompt design. |

**If this agent is broken:** The demo has no memorable artifact. The "accountability" claim is abstract. P0.

---

### Agent 5 — Escalation Agent (Real External Action)

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | Critical | This is the single most important moment for this criterion. "Did the AI do something real, or just display?" Agent 5 answers yes with a real email send or PDF export. Without this, the system is analytics, not agentic AI. |
| Real-World Impact | High | A real email sent to a real address is the only demonstrable real-world consequence in a 7-day build. |
| Technical Execution | High | Human-approval gate (403 on unapproved), real provider_response logging, PDF fallback, both methods implemented — all demonstrate execution discipline. |
| Innovation | Low | Email send is not innovative. The innovation is in the pipeline that makes it evidence-grounded. |
| Google Technologies | Low | No Google technology in Agent 5 directly. Justified: Agent 5 is the "Act" step; its value is in the action, not the technology. |

**If this agent is broken:** The demo loses its most compelling proof point. Agentic AI Depth score drops significantly. P0.

---

### Human Approval Gate (ApprovalModal + PATCH /action-drafts/{id})

| Criterion | Impact | Justification |
|---|---|---|
| Agentic AI Depth | High | Paradoxically, the human gate *demonstrates* agentic design maturity. It shows the system knows the difference between "AI can reason" and "AI should autonomously send official documents." Judges who know agentic AI will appreciate this distinction. |
| Real-World Impact | High | Without a human gate, the product is a liability. The gate is what makes it deployable. |
| Technical Execution | Medium | 403 on unapproved draft is a concrete enforcement mechanism, not a UI-only gate. |

**If this is missing:** Agent 5 would act without human approval, which violates ARCHITECTURAL_TRUTHS.md Truth 4 and creates a demo where AI sends real emails without consent — a judge red flag.

---

### Public Issue Tracker (TrackerPage)

| Criterion | Impact | Justification |
|---|---|---|
| Real-World Impact | High | Makes the evidence public and visible. Demonstrates that accountability is community-level, not individual complaint-level. |
| Technical Execution | Medium | Self-reported labeling, evidence counts, escalation status — all correct, honest data presentation. |
| Agentic AI Depth | Low | Display only. Not an agent. But it is the proof of work from Agents 1–5. |
| Innovation | Low | Public trackers exist. The innovation here is the evidence quality behind the pins. |
| Google Technologies | Medium | Google Maps JS integration is a visible, concrete Google Technologies demonstration. Worth having. |

**If list-only (no map):** Real-World Impact and Technical Execution scores unchanged. Google Technologies score drops slightly. Acceptable tradeoff if behind on Day 3.

---

### credibility_score Display with UI Label

| Criterion | Impact | Justification |
|---|---|---|
| Technical Execution | High (defensive) | A judge who asks "where did 0.87 come from?" and gets "Gemini's confidence in its own classification" without any label will dock credibility. The label ("Image quality and classification confidence (AI-assessed)") preempts the attack. |
| Innovation | Low | The label is not innovative. The absence of a label is a risk. |

**This is P1 but high-ROI:** 30 minutes of work, defuses a specific high-probability judge attack.

---

### Features That Do NOT Improve Judging Outcomes

| Feature | Assessment |
|---|---|
| Voice input | No judging criterion is improved. Tier 3 only. |
| Community verification votes | Minor Real-World Impact gain. Not worth the build cost. Tier 3 only. |
| Gamification | No judging criterion is improved. Permanently cut. |
| Auth / user accounts | No judging criterion is improved. Cut. |
| Celery / RQ background queue | Technical Execution gain is marginal vs. BackgroundTasks. Not worth the Redis dependency. Cut. |
| Fabricated ward scores | **Active judging harm.** A judge who probes these destroys the demo. Permanently cut. |

---

## Scoring Model (If P0 Ships Clean)

| Criterion | Score | Reasoning |
|---|---|---|
| Agentic AI Depth | 8/10 | 5-agent chain, real external action, human-in-the-loop gate. Loses 2 points because Agent 5 requires explicit human trigger (not fully autonomous). |
| Innovation | 7/10 | Evidence-based accountability reframe is differentiated. RTI draft generation is memorable. Loses 3 points because civic-tech is a crowded category. |
| Google Technologies | 7.5/10 | Gemini 2.0 Flash Vision (depth) + Maps JS + Cloud deployment = solid breadth. Loses 2.5 for no Firebase/Vertex AI. |
| Real-World Impact | 7/10 | Real send + real draft = real consequence. Loses 3 because no resolved issues exist (7-day build). |
| Technical Execution | 8/10 | Clean architecture, error handling, no fabricated fallbacks, WAL mode, rate limiting, deployed stable. |
| **Estimated Total** | **~75%** | Competitive for top 3. |

**With Google Maps (P1-1) added:** Google Technologies → 8/10. Total → ~77%.
**With all P1 items:** Total → ~79%.
**If Agent 5 fails (email AND PDF):** Agentic AI Depth → 5/10. Total → ~63%.

---

## Narrative the Demo Must Convey

The demo narrative must communicate these three things, in this order, without the judge having to read the docs:

1. **"Reports become evidence."** The clustering and impact summary transform isolated complaints into a documented pattern.
2. **"Evidence becomes action."** The RTI draft, complaint, and community summary are real artifacts that could be filed or published.
3. **"Action is real."** Agent 5 sent a real email. Here is the delivery confirmation. Or: here is the PDF you could print and hand-deliver.

Every feature must serve one of these three sentences. Features that don't are cut.