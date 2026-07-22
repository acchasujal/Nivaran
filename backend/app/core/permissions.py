"""
Role and Permission Definitions & Matrix for CivicPulse RBAC/ABAC.
"""
from typing import Dict, List, Set, Optional

# System Roles
ROLE_CITIZEN = "citizen"
ROLE_OFFICER = "officer"
ROLE_AUDITOR = "auditor"
ROLE_ADMIN = "admin"
ROLE_INSTITUTION = "institution"
ROLE_EVALUATION = "evaluation"
ROLE_ANONYMOUS = "anonymous"

ALL_ROLES = [
    ROLE_CITIZEN,
    ROLE_OFFICER,
    ROLE_AUDITOR,
    ROLE_ADMIN,
    ROLE_INSTITUTION,
    ROLE_EVALUATION,
    ROLE_ANONYMOUS,
]

# Permissions
PERM_ISSUES_READ = "issues:read"
PERM_ISSUES_CREATE = "issues:create"
PERM_ISSUES_UPDATE = "issues:update"
PERM_ISSUES_DELETE = "issues:delete"

PERM_ACTIONS_READ = "actions:read"
PERM_ACTIONS_CREATE = "actions:create"
PERM_ACTIONS_APPROVE = "actions:approve"

PERM_ESCALATIONS_READ = "escalations:read"
PERM_ESCALATIONS_CREATE = "escalations:create"
PERM_ESCALATIONS_RESOLVE = "escalations:resolve"

PERM_IMPACT_READ = "impact:read"
PERM_IMPACT_EXPORT = "impact:export"

PERM_WHATSAPP_DISPATCH = "whatsapp:dispatch"

PERM_USERS_READ = "users:read"
PERM_USERS_MANAGE = "users:manage"

PERM_SESSIONS_READ = "sessions:read"
PERM_SESSIONS_REVOKE = "sessions:revoke"

PERM_EVALUATION_ACCESS = "evaluation:access"

# Role -> Permissions Mapping Matrix
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    ROLE_ANONYMOUS: {
        PERM_ISSUES_READ,
        PERM_ISSUES_CREATE,
        PERM_IMPACT_READ,
    },
    ROLE_CITIZEN: {
        PERM_ISSUES_READ,
        PERM_ISSUES_CREATE,
        PERM_ISSUES_UPDATE,
        PERM_IMPACT_READ,
        PERM_SESSIONS_READ,
        PERM_SESSIONS_REVOKE,
    },
    ROLE_OFFICER: {
        PERM_ISSUES_READ,
        PERM_ISSUES_CREATE,
        PERM_ISSUES_UPDATE,
        PERM_ACTIONS_READ,
        PERM_ACTIONS_CREATE,
        PERM_ACTIONS_APPROVE,
        PERM_ESCALATIONS_READ,
        PERM_ESCALATIONS_CREATE,
        PERM_IMPACT_READ,
        PERM_IMPACT_EXPORT,
        PERM_WHATSAPP_DISPATCH,
        PERM_SESSIONS_READ,
        PERM_SESSIONS_REVOKE,
    },
    ROLE_AUDITOR: {
        PERM_ISSUES_READ,
        PERM_ACTIONS_READ,
        PERM_ESCALATIONS_READ,
        PERM_IMPACT_READ,
        PERM_IMPACT_EXPORT,
        PERM_USERS_READ,
        PERM_SESSIONS_READ,
    },
    ROLE_INSTITUTION: {
        PERM_ISSUES_READ,
        PERM_ISSUES_CREATE,
        PERM_ACTIONS_READ,
        PERM_ACTIONS_CREATE,
        PERM_IMPACT_READ,
        PERM_IMPACT_EXPORT,
        PERM_SESSIONS_READ,
        PERM_SESSIONS_REVOKE,
    },
    ROLE_EVALUATION: {
        PERM_ISSUES_READ,
        PERM_ACTIONS_READ,
        PERM_ESCALATIONS_READ,
        PERM_IMPACT_READ,
        PERM_EVALUATION_ACCESS,
    },
    ROLE_ADMIN: {
        PERM_ISSUES_READ,
        PERM_ISSUES_CREATE,
        PERM_ISSUES_UPDATE,
        PERM_ISSUES_DELETE,
        PERM_ACTIONS_READ,
        PERM_ACTIONS_CREATE,
        PERM_ACTIONS_APPROVE,
        PERM_ESCALATIONS_READ,
        PERM_ESCALATIONS_CREATE,
        PERM_ESCALATIONS_RESOLVE,
        PERM_IMPACT_READ,
        PERM_IMPACT_EXPORT,
        PERM_WHATSAPP_DISPATCH,
        PERM_USERS_READ,
        PERM_USERS_MANAGE,
        PERM_SESSIONS_READ,
        PERM_SESSIONS_REVOKE,
        PERM_EVALUATION_ACCESS,
    },
}

# Role Hierarchy (higher includes rights of lower in evaluation)
ROLE_HIERARCHY: Dict[str, int] = {
    ROLE_ANONYMOUS: 0,
    ROLE_CITIZEN: 10,
    ROLE_INSTITUTION: 20,
    ROLE_EVALUATION: 25,
    ROLE_OFFICER: 30,
    ROLE_AUDITOR: 35,
    ROLE_ADMIN: 100,
}

def get_role_permissions(role: str) -> List[str]:
    """Return all permission strings granted to a specific role."""
    return sorted(list(ROLE_PERMISSIONS.get(role, set())))

def has_permission(user_role: str, permission: str) -> bool:
    """Check if a given role has a specific permission."""
    perms = ROLE_PERMISSIONS.get(user_role, set())
    return permission in perms

def is_role_at_least(user_role: str, target_role: str) -> bool:
    """Check role hierarchy level."""
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    return user_level >= target_level
