import os
import logging
from typing import Optional
from PIL import Image
from sqlmodel import Session, select
from app.models.issue import Issue

logger = logging.getLogger("nivaran")

# Global in-memory cache to avoid reading images from disk repeatedly
IMAGE_HASH_CACHE: dict[str, str] = {}


def resolve_image_path(photo_url: str) -> Optional[str]:
    """
    Resolves relative photo_url to an actual file on disk across static/uploads
    and frontend/public asset directories.
    """
    if not photo_url:
        return None

    clean_url = photo_url.lstrip("/")
    filename = os.path.basename(clean_url)

    candidates = [
        clean_url,
        os.path.join("static", "uploads", filename),
        os.path.join("backend", "static", "uploads", filename),
        os.path.join("frontend", "public", filename),
        os.path.join("..", "frontend", "public", filename),
        os.path.join("..", clean_url),
        os.path.join("backend", clean_url),
    ]

    for p in candidates:
        if os.path.exists(p) and os.path.isfile(p):
            return p
    return None


def calculate_dhash(image_path: str, hash_size: int = 8) -> str:
    """
    Computes a 64-bit difference hash (dHash) for an image.
    Uses Pillow (PIL) to convert to grayscale and resize, then calculates differences.
    """
    resolved_path = resolve_image_path(image_path) or image_path

    if resolved_path in IMAGE_HASH_CACHE:
        return IMAGE_HASH_CACHE[resolved_path]

    if not os.path.exists(resolved_path):
        logger.warning("Cannot calculate image hash; file does not exist: %s", image_path)
        return ""

    try:
        with Image.open(resolved_path) as img:
            img = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.BILINEAR)
            pixels = list(img.getdata())

            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left = pixels[row * (hash_size + 1) + col]
                    right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(left > right)

            decimal_value = 0
            for index, value in enumerate(diff):
                if value:
                    decimal_value += 2 ** index

            hex_hash = f"{decimal_value:016x}"
            IMAGE_HASH_CACHE[resolved_path] = hex_hash
            IMAGE_HASH_CACHE[image_path] = hex_hash
            return hex_hash
    except Exception as e:
        logger.error(f"Failed to calculate dhash for {image_path}: {e}")
        return ""


def check_evidence_integrity(new_hash: str, session: Session, current_issue_id: str = "") -> tuple[str, int]:
    """
    Compares the new_hash against all other issues in the database.
    Returns (status_label, similarity_percentage).
    """
    if not new_hash:
        return "Original Evidence", 100

    query = select(Issue)
    if current_issue_id:
        query = query.where(Issue.id != current_issue_id)
    issues = session.exec(query).all()

    min_distance = 999

    for issue in issues:
        target_path = resolve_image_path(issue.photo_url)
        if not target_path:
            continue

        other_hash = calculate_dhash(target_path)
        if not other_hash:
            continue

        try:
            val1 = int(new_hash, 16)
            val2 = int(other_hash, 16)
            xor_val = val1 ^ val2
            dist = bin(xor_val).count('1')
            if dist < min_distance:
                min_distance = dist
        except Exception:
            continue

    if min_distance == 999:
        return "Original Evidence", 100

    similarity = int(((64 - min_distance) / 64) * 100)

    if min_distance <= 4:
        return "Possible Duplicate Evidence", similarity
    elif min_distance <= 10:
        return "Similar Evidence Detected", similarity
    else:
        return "Original Evidence", 100
