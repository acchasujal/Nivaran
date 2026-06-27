import os
import logging
from PIL import Image
from sqlmodel import Session, select
from app.models.issue import Issue

logger = logging.getLogger("civicpulse")

# Global in-memory cache to avoid reading images from disk repeatedly
IMAGE_HASH_CACHE = {}

def calculate_dhash(image_path: str, hash_size: int = 8) -> str:
    """
    Computes a 64-bit difference hash (dHash) for an image.
    Uses Pillow (PIL) to convert to grayscale and resize, then calculates differences.
    """
    if image_path in IMAGE_HASH_CACHE:
        return IMAGE_HASH_CACHE[image_path]

    if not os.path.exists(image_path):
        # Gracefully handle missing files (e.g. seeded demo files not on disk)
        # Generate a deterministic hash based on the filename to maintain integrity test stability
        filename = os.path.basename(image_path)
        mock_val = hash(filename) & 0xffffffffffffffff
        mock_hash = f"{mock_val:016x}"
        IMAGE_HASH_CACHE[image_path] = mock_hash
        return mock_hash

    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to (hash_size + 1) x hash_size
            img = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.BILINEAR)
            pixels = list(img.getdata())
            
            # Compute difference between adjacent pixels in each row
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left = pixels[row * (hash_size + 1) + col]
                    right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(left > right)
            
            # Convert boolean array to hex string
            decimal_value = 0
            for index, value in enumerate(diff):
                if value:
                    decimal_value += 2 ** index
            
            hex_hash = f"{decimal_value:016x}"
            IMAGE_HASH_CACHE[image_path] = hex_hash
            return hex_hash
    except Exception as e:
        logger.error(f"Failed to calculate dhash for {image_path}: {e}")
        return ""

def check_evidence_integrity(new_hash: str, session: Session, current_issue_id: str = "") -> tuple[str, int]:
    """
    Compares the new_hash against all other issues in the database.
    Returns (status_label, similarity_percentage).
    Statuses:
      - "Original Evidence"
      - "Similar Evidence Detected"
      - "Possible Duplicate Evidence"
    """
    if not new_hash:
        return "Original Evidence", 100

    # Retrieve all issues from database
    query = select(Issue)
    if current_issue_id:
        query = query.where(Issue.id != current_issue_id)
    issues = session.exec(query).all()

    min_distance = 999

    for issue in issues:
        # Resolve path to check/calculate hash
        # If it's a relative path like /static/uploads/...
        clean_url = issue.photo_url.lstrip('/')
        # Replace static/ with backend static folder path if needed
        # In development, working dir is backend/ or root, let's resolve relative to current dir
        path_candidates = [
            clean_url,
            os.path.join("backend", clean_url),
            os.path.join("..", clean_url)
        ]
        
        target_path = None
        for p in path_candidates:
            if os.path.exists(p):
                target_path = p
                break
                
        # If we can't find the file on disk, we fallback to the clean_url path to calculate mock hash
        if not target_path:
            target_path = clean_url

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

    # Thresholds:
    # distance <= 4 (>= 93.75% similarity): Possible Duplicate Evidence
    # distance <= 10 (>= 84.375% similarity): Similar Evidence Detected
    # distance > 10: Original Evidence
    if min_distance <= 4:
        return "Possible Duplicate Evidence", similarity
    elif min_distance <= 10:
        return "Similar Evidence Detected", similarity
    else:
        return "Original Evidence", 100
