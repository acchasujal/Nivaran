"""
Analytics Calculation Service for Executive, Government, Community, and Department metrics.
"""
from typing import Dict, Any, List
from sqlmodel import Session as DBSession, select, func

from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.case import CaseTransition, RepairVerification, CaseAssignment, Department
from app.models.notification import NotificationDelivery
from app.models.user import User
from app.core.workflow_engine import calculate_case_sla

class AnalyticsService:

    @staticmethod
    def get_platform_analytics(db: DBSession) -> Dict[str, Any]:
        """Executive overview analytics."""
        issues = db.exec(select(Issue)).all()
        clusters = db.exec(select(Cluster)).all()
        verifications = db.exec(select(RepairVerification)).all()

        total_issues = len(issues)
        resolved_issues = len([i for i in issues if i.status in ["resolved", "closed", "verified"]])
        resolution_rate = round((resolved_issues / total_issues * 100), 1) if total_issues > 0 else 0.0

        # Calculate SLA performance
        overdue_count = 0
        sla_hours_list = []
        for i in issues:
            sla = calculate_case_sla(i.created_at, i.severity)
            if sla["is_overdue"] and i.status not in ["resolved", "closed"]:
                overdue_count += 1
            sla_hours_list.append(sla["time_remaining_hours"])

        avg_sla_remaining = round(sum(sla_hours_list) / len(sla_hours_list), 1) if sla_hours_list else 0.0

        # Verification accuracy rate
        passed_verifications = len([v for v in verifications if v.verification_status == "verified_passed"])
        verification_accuracy = round((passed_verifications / len(verifications) * 100), 1) if verifications else 95.0

        return {
            "total_issues_logged": total_issues,
            "resolved_issues_count": resolved_issues,
            "resolution_rate_percent": resolution_rate,
            "active_clusters_count": len(clusters),
            "overdue_cases_count": overdue_count,
            "average_sla_remaining_hours": avg_sla_remaining,
            "verification_accuracy_percent": verification_accuracy,
            "total_verifications_conducted": len(verifications)
        }

    @staticmethod
    def get_government_analytics(db: DBSession) -> Dict[str, Any]:
        """Government and department performance analytics."""
        assignments = db.exec(select(CaseAssignment)).all()
        transitions = db.exec(select(CaseTransition)).all()
        officers = db.exec(select(User).where(User.role == "officer")).all()

        total_assignments = len(assignments)
        escalations_count = len([t for t in transitions if t.action == "escalate"])

        officer_stats = []
        for off in officers:
            off_cases = [a for a in assignments if a.assigned_officer_id == off.id]
            officer_stats.append({
                "officer_id": off.id,
                "officer_name": off.name,
                "department": off.department,
                "assigned_cases_count": len(off_cases)
            })

        return {
            "total_assignments_count": total_assignments,
            "total_escalations_count": escalations_count,
            "active_officers_count": len(officers),
            "officer_productivity": officer_stats
        }

    @staticmethod
    def get_community_analytics(db: DBSession) -> Dict[str, Any]:
        """Community engagement and physical verification analytics."""
        verifications = db.exec(select(RepairVerification)).all()
        citizens = db.exec(select(User).where(User.role == "citizen")).all()

        total_votes_passed = sum([v.community_votes_passed for v in verifications])
        total_votes_failed = sum([v.community_votes_failed for v in verifications])
        total_votes = total_votes_passed + total_votes_failed

        consensus_rate = round((total_votes_passed / total_votes * 100), 1) if total_votes > 0 else 100.0

        return {
            "registered_citizens_count": len(citizens),
            "total_verification_votes_cast": total_votes,
            "votes_passed_count": total_votes_passed,
            "votes_failed_count": total_votes_failed,
            "community_consensus_rate_percent": consensus_rate
        }

    @staticmethod
    def get_notification_analytics(db: DBSession) -> Dict[str, Any]:
        """Notification delivery throughput analytics."""
        deliveries = db.exec(select(NotificationDelivery)).all()
        
        in_app_count = len([d for d in deliveries if d.channel == "in_app"])
        email_count = len([d for d in deliveries if d.channel == "email"])
        whatsapp_count = len([d for d in deliveries if d.channel == "whatsapp"])

        successful_deliveries = len([d for d in deliveries if d.status == "delivered"])
        delivery_success_rate = round((successful_deliveries / len(deliveries) * 100), 1) if deliveries else 100.0

        return {
            "total_deliveries_processed": len(deliveries),
            "in_app_deliveries_count": in_app_count,
            "email_deliveries_count": email_count,
            "whatsapp_deliveries_count": whatsapp_count,
            "delivery_success_rate_percent": delivery_success_rate
        }
