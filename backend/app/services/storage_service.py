"""
StorageService — Production Media Asset Storage Abstraction.
Delegates to StorageProvider (LocalStorageProvider or S3StorageProvider for Cloudflare R2 / AWS S3).
Enforces image magic bytes validation, resizing, quality compression, and EXIF stripping.
"""
import os
import logging
from typing import Optional, Tuple
from app.services.storage_provider import get_storage_provider, process_and_optimize_image

logger = logging.getLogger("nivaran")

class StorageService:
    def __init__(self):
        self.provider = get_storage_provider()
        self.local_dir = os.path.abspath("static/uploads")
        os.makedirs(self.local_dir, exist_ok=True)

    def save_bytes(self, content: bytes, filename: str, mime_type: str = "image/jpeg") -> Tuple[str, Optional[Tuple[float, float]]]:
        """
        Validates, optimizes, and persists media bytes.
        Returns (canonical_public_url, extracted_gps_coords_or_none).
        """
        optimized_bytes, opt_mime, gps_coords = process_and_optimize_image(content)
        public_url = self.provider.save_bytes(optimized_bytes, filename, opt_mime)
        return public_url, gps_coords

    def delete_file(self, filename: str) -> bool:
        """Deletes file from storage provider."""
        return self.provider.delete_file(filename)

    def get_local_path(self, photo_url: str) -> Optional[str]:
        """Resolves public photo URL to local filesystem path if available."""
        if not photo_url:
            return None
        fname = os.path.basename(photo_url)
        p = os.path.join(self.local_dir, fname)
        if os.path.exists(p) and os.path.isfile(p):
            return p
        return None

storage_service = StorageService()

