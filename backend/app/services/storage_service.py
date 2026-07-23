"""
StorageService — Production Media Asset Storage Abstraction.

Supports:
  1. Local disk storage (default for local dev & demo builds)
  2. Amazon S3 / Cloudflare R2 / S3-compatible Object Storage (optional for production durability)
"""
import os
import shutil
import logging
from typing import Optional

logger = logging.getLogger("nivaran")

class StorageService:
    def __init__(self):
        self.provider = os.getenv("STORAGE_PROVIDER", "local").lower()
        self.bucket = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
        self.region = os.getenv("AWS_S3_REGION_NAME", "ap-south-1")
        self.local_dir = os.path.abspath("static/uploads")
        os.makedirs(self.local_dir, exist_ok=True)

    def save_bytes(self, content: bytes, filename: str, mime_type: str = "image/jpeg") -> str:
        """
        Saves media bytes to local disk or S3 object store.
        Returns canonical public URL.
        """
        local_path = os.path.join(self.local_dir, filename)
        with open(local_path, "wb") as f:
            f.write(content)

        if self.provider == "s3" and self.bucket:
            try:
                import boto3
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                    region_name=self.region,
                )
                s3_key = f"uploads/{filename}"
                s3_client.put_object(
                    Bucket=self.bucket,
                    Key=s3_key,
                    Body=content,
                    ContentType=mime_type,
                )
                s3_url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{s3_key}"
                logger.info(f"storage_service | uploaded to s3: {s3_url}")
                return s3_url
            except Exception as err:
                logger.warning(f"storage_service | s3 upload failed, falling back to local: {err}")

        return f"/static/uploads/{filename}"

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
