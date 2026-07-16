# India AI Impact Festival 2026: Judging Q&A Preparation

This document prepares responses for common questions from the hackathon jury and government evaluators.

---

## 1. Core Strategic Q&As

### Q1: Why would government officers use CivicPulse instead of ignoring it?
> **Answer:** "Officers do not need to learn a new application or log into a dashboard. We meet them where they work: via email or WhatsApp. An officer receives an alert with a photo, replies `ACK` to acknowledge, and sends a photo of the repair with `FIXED` to close it. Our system handles the ingestion. This minimizes administrative friction and increases adoption."

### Q2: How does your platform handle false accusations or political spam?
> **Answer:** "We use a multi-tiered validation pipeline. First, Stage-0 hashes the image to reject duplicate photos. Second, we verify EXIF data and strip location metadata to protect privacy. Third, our fraud engine computes user reputation scores based on historical verification rates. High-reputation reports auto-escalate; unverified or flagged users require manual moderation before dispatches are drafted."

### Q3: Why generate RTI applications instead of standard complaints?
> **Answer:** "Standard grievance tickets have no statutory teeth and can sit in queues indefinitely. A Right to Information (RTI) request under Section 6(1) of the Indian RTI Act, 2005, carries legally binding response timelines (30 days). This gives citizens statutory leverage, forcing the municipal department to address the clustered evidence or face administrative penalties."

### Q4: How is this platform sustainable?
> **Answer:** "CivicPulse operates on a B2G SaaS licensing model. Cities pay $50,000 annually. In return, they get structured, deduplicated GIS data feeds that integrate with their existing 311 systems, cutting administrative routing times by 80% and highlighting preventative maintenance hotspots before they become costly emergencies."
