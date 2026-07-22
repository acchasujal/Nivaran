from app.dependencies.auth_deps import (
    get_optional_user,
    get_current_user,
    require_roles,
    require_permission,
    require_admin,
    require_officer,
    require_institution,
    require_evaluation,
)

async def get_evidence_validator():
    from app.services.evidence_validation import validate_evidence_photo
    return validate_evidence_photo

__all__ = [
    "get_optional_user",
    "get_current_user",
    "require_roles",
    "require_permission",
    "require_admin",
    "require_officer",
    "require_institution",
    "require_evaluation",
    "get_evidence_validator",
]
