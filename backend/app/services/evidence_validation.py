import os
import io
import time
import threading
from enum import Enum
from typing import Optional, Dict
from pydantic import BaseModel, Field
from PIL import Image, ImageFilter, ImageStat
from app.services.gemini_client import GeminiClient

class ValidationFailure(str, Enum):
    DOCUMENT = "DOCUMENT"
    SCREENSHOT = "SCREENSHOT"
    SELFIE = "SELFIE"
    LOW_QUALITY = "LOW_QUALITY"
    NO_INFRASTRUCTURE = "NO_INFRASTRUCTURE"
    NO_VISIBLE_ISSUE = "NO_VISIBLE_ISSUE"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    UNKNOWN = "UNKNOWN"

class Stage0Checks(BaseModel):
    file: bool
    quality: bool
    scene: bool
    infrastructure: bool
    issue: bool

class Stage0Result(BaseModel):
    accepted: bool
    failure: Optional[ValidationFailure]
    confidence: float
    detected_object: str
    checks: Stage0Checks
    message: str
    suggestion: str

# Thread-safe cache and metrics singleton
STAGE0_HASH_CACHE: Dict[str, Stage0Result] = {}
cache_lock = threading.Lock()

class MetricsTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self.rejected_uploads = 0
        self.accepted_uploads = 0
        self.gemini_calls_saved = 0
        self.validation_latencies = []
        self.cache_hits = 0

    def track_upload(self, accepted: bool, cached: bool, latency_ms: float):
        with self._lock:
            if accepted:
                self.accepted_uploads += 1
            else:
                self.rejected_uploads += 1
            
            if cached:
                self.cache_hits += 1
                self.gemini_calls_saved += 1
                
            self.validation_latencies.append(latency_ms)

    def get_metrics(self):
        with self._lock:
            avg_latency = (
                sum(self.validation_latencies) / len(self.validation_latencies)
                if self.validation_latencies else 0.0
            )
            return {
                "rejected_uploads": self.rejected_uploads,
                "accepted_uploads": self.accepted_uploads,
                "gemini_calls_saved": self.gemini_calls_saved,
                "cache_hits": self.cache_hits,
                "average_validation_latency_ms": round(avg_latency, 2),
                "total_validations": len(self.validation_latencies)
            }

metrics_tracker = MetricsTracker()

def calculate_dhash_from_bytes(photo_bytes: bytes, hash_size: int = 8) -> str:
    try:
        with Image.open(io.BytesIO(photo_bytes)) as img:
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
            return f"{decimal_value:016x}"
    except Exception:
        return ""

def run_cheap_validations(photo_bytes: bytes, mime_type: str) -> tuple[bool, Optional[ValidationFailure], Optional[Stage0Checks], str]:
    # 1. MIME check
    if mime_type not in ["image/jpeg", "image/png"]:
        return (
            False,
            ValidationFailure.LOW_QUALITY,
            Stage0Checks(file=False, quality=False, scene=False, infrastructure=False, issue=False),
            "Only JPEG and PNG images are supported."
        )

    # 2. File size checks
    file_size_kb = len(photo_bytes) / 1024
    if file_size_kb < 5:
        return (
            False,
            ValidationFailure.LOW_QUALITY,
            Stage0Checks(file=False, quality=False, scene=False, infrastructure=False, issue=False),
            "The uploaded file is too small to be a valid photo."
        )
    if file_size_kb > 10 * 1024:
        return (
            False,
            ValidationFailure.LOW_QUALITY,
            Stage0Checks(file=False, quality=False, scene=False, infrastructure=False, issue=False),
            "The uploaded file exceeds the 10MB size limit."
        )

    # 3. Resolution, Brightness & Blur checks
    try:
        with Image.open(io.BytesIO(photo_bytes)) as img:
            width, height = img.size
            if width < 300 or height < 300:
                return (
                    False,
                    ValidationFailure.LOW_QUALITY,
                    Stage0Checks(file=True, quality=False, scene=False, infrastructure=False, issue=False),
                    f"Image resolution is too low ({width}x{height}px). Minimum 300x300px required."
                )
            if width > 4096 or height > 4096:
                return (
                    False,
                    ValidationFailure.LOW_QUALITY,
                    Stage0Checks(file=True, quality=False, scene=False, infrastructure=False, issue=False),
                    f"Image resolution is too high ({width}x{height}px). Maximum 4096x4096px allowed."
                )

            # Brightness check
            gray_img = img.convert('L')
            stat = ImageStat.Stat(gray_img)
            mean_brightness = stat.mean[0]
            if mean_brightness < 15:
                return (
                    False,
                    ValidationFailure.LOW_QUALITY,
                    Stage0Checks(file=True, quality=False, scene=False, infrastructure=False, issue=False),
                    f"Image is too dark (brightness value: {mean_brightness:.1f})."
                )
            if mean_brightness > 245:
                return (
                    False,
                    ValidationFailure.LOW_QUALITY,
                    Stage0Checks(file=True, quality=False, scene=False, infrastructure=False, issue=False),
                    f"Image is overexposed (brightness value: {mean_brightness:.1f})."
                )

            # Blur check
            edge_img = gray_img.filter(ImageFilter.FIND_EDGES)
            edge_stat = ImageStat.Stat(edge_img)
            edge_std_dev = edge_stat.stddev[0]
            if edge_std_dev < 3.0:
                return (
                    False,
                    ValidationFailure.LOW_QUALITY,
                    Stage0Checks(file=True, quality=False, scene=False, infrastructure=False, issue=False),
                    f"Image is too blurry (edge value: {edge_std_dev:.2f})."
                )

    except Exception as e:
        return (
            False,
            ValidationFailure.LOW_QUALITY,
            Stage0Checks(file=False, quality=False, scene=False, infrastructure=False, issue=False),
            f"Failed to parse image file: {str(e)}"
        )

    # If cheap checks pass, quality is True
    return (
        True,
        None,
        Stage0Checks(file=True, quality=True, scene=False, infrastructure=False, issue=False),
        "Cheap validations passed."
    )

async def validate_evidence_photo(
    photo_bytes: bytes,
    mime_type: str,
    gemini_client: Optional[GeminiClient] = None
) -> Stage0Result:
    start_time = time.time()
    
    # 1. Run cheap validations
    success, failure_type, checks, message = run_cheap_validations(photo_bytes, mime_type)
    if not success:
        result = Stage0Result(
            accepted=False,
            failure=failure_type,
            confidence=1.0,
            detected_object="Invalid File / Low Quality",
            checks=checks,
            message=message,
            suggestion="Please upload a high-quality, clear image in JPEG or PNG format."
        )
        latency = (time.time() - start_time) * 1000
        metrics_tracker.track_upload(accepted=False, cached=False, latency_ms=latency)
        return result

    # 2. Compute perceptual dhash & check cache
    dhash = calculate_dhash_from_bytes(photo_bytes)
    if dhash:
        with cache_lock:
            if dhash in STAGE0_HASH_CACHE:
                cached_result = STAGE0_HASH_CACHE[dhash]
                latency = (time.time() - start_time) * 1000
                metrics_tracker.track_upload(accepted=cached_result.accepted, cached=True, latency_ms=latency)
                return cached_result

    # 3. Stage-0 AI Validation via Gemini Vision
    if gemini_client is None:
        gemini_client = GeminiClient()

    prompt = "Perform Stage 0 evidence validation check on this uploaded media."
    system_instruction = (
        "You are the Stage 0 Evidence Validation Gate for CivicPulse. "
        "Strictly evaluate the image contents and determine if it represents a valid outdoor civic infrastructure issue report.\n"
        "1. Is it a real photograph (and NOT a document, certificate, screenshot, graphic, design, animal, selfie, or random indoor item)?\n"
        "2. Is it outdoor (and NOT indoor)?\n"
        "3. Does it contain civic/public infrastructure (e.g., roads, footpaths, utility poles, municipal garbage bins, streetlights)?\n"
        "4. Is a civic infrastructure issue or hazard visible (e.g., potholes, broken streetlight, open garbage pile, water leakage, blocked drainage)?\n\n"
        "CRITICAL RULES:\n"
        "- If uncertain, reject. Never guess. Never infer damage not visible.\n"
        "- If the image is a certificate, document, selfie, animal, random indoor object, or screenshot, accepted must be False.\n"
        "- Set failure to DOCUMENT if it is a document/certificate, SCREENSHOT if it is a screenshot, SELFIE if it is a selfie, "
        "NO_INFRASTRUCTURE if it lacks civic infrastructure, NO_VISIBLE_ISSUE if it contains infrastructure but no visible hazard, "
        "and LOW_QUALITY if unusable. Otherwise None."
    )

    class GeminiStage0Output(BaseModel):
        accepted: bool = Field(..., description="True if it is a real photo, outdoor, contains civic infrastructure, and shows a visible issue.")
        failure: Optional[ValidationFailure] = Field(..., description="The failure category, or null if accepted is True.")
        confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the decision.")
        detected_object: str = Field(..., description="The main object detected (e.g. Document, Selfie, Pothole, Trash, Streetlight).")
        checks: Stage0Checks = Field(..., description="Booleans for each check category.")
        message: str = Field(..., description="Friendly user message explaining why it was accepted or rejected.")

    try:
        ai_res = await gemini_client.generate_structured_output(
            prompt=prompt,
            response_schema=GeminiStage0Output,
            system_instruction=system_instruction,
            image_data=photo_bytes,
            image_mime_type=mime_type
        )
        
        # Enforce confidence thresholds:
        # >= 0.90 Accept
        # 0.75-0.89 Manual Review (Treat as rejected in backend to avoid pipeline pollution)
        # < 0.75 Reject
        accepted_status = ai_res.accepted
        failure_cat = ai_res.failure
        checks_obj = ai_res.checks
        message_text = ai_res.message

        if accepted_status:
            if ai_res.confidence < 0.75:
                accepted_status = False
                failure_cat = ValidationFailure.LOW_QUALITY
                message_text = f"Confidence {ai_res.confidence:.2f} is too low. Rejected."
                checks_obj = Stage0Checks(file=True, quality=True, scene=checks_obj.scene, infrastructure=checks_obj.infrastructure, issue=False)
            elif ai_res.confidence < 0.90:
                accepted_status = False
                failure_cat = ValidationFailure.MANUAL_REVIEW
                message_text = f"Confidence {ai_res.confidence:.2f} is in manual review range. Rejected."
                checks_obj = Stage0Checks(file=True, quality=True, scene=checks_obj.scene, infrastructure=checks_obj.infrastructure, issue=False)

        # Enforce that cheap checks (file and quality) are kept as True in final output since they passed
        final_checks = Stage0Checks(
            file=True,
            quality=True,
            scene=checks_obj.scene,
            infrastructure=checks_obj.infrastructure,
            issue=checks_obj.issue
        )

        # Suggestion mapping
        suggestions = {
            ValidationFailure.DOCUMENT: "Please upload a real photograph showing a local civic infrastructure issue instead of a document or certificate.",
            ValidationFailure.SCREENSHOT: "Please capture a live photo of the civic issue directly rather than submitting a screenshot.",
            ValidationFailure.SELFIE: "Please submit a photo focusing strictly on the public utility issue, avoiding selfies or personal portraits.",
            ValidationFailure.LOW_QUALITY: "Try retaking the photo in daylight with better lighting, focus, or from a closer distance.",
            ValidationFailure.NO_INFRASTRUCTURE: "Ensure the photo clearly features civic assets like municipal roads, utility poles, streetlights, or footpaths.",
            ValidationFailure.NO_VISIBLE_ISSUE: "Focus your camera directly on the specific damaged area or hazard (e.g. pothole or garbage pile).",
            ValidationFailure.MANUAL_REVIEW: "Our verification engine is uncertain about this submission. Please submit a clearer, more direct photo of the hazard.",
            ValidationFailure.UNKNOWN: "Please try uploading a different photo showing the civic issue clearly."
        }
        suggestion_text = suggestions.get(failure_cat, "Please upload a clear, outdoor photo showing a pothole, streetlight, or garbage issue.")

        result = Stage0Result(
            accepted=accepted_status,
            failure=failure_cat,
            confidence=ai_res.confidence,
            detected_object=ai_res.detected_object,
            checks=final_checks,
            message=message_text,
            suggestion=suggestion_text
        )
    except Exception as e:
        # Fallback to an error result
        result = Stage0Result(
            accepted=False,
            failure=ValidationFailure.UNKNOWN,
            confidence=0.0,
            detected_object="Error",
            checks=Stage0Checks(file=True, quality=True, scene=False, infrastructure=False, issue=False),
            message=f"AI Validation currently unavailable: {str(e)}",
            suggestion="Please try again in a few moments."
        )

    # 4. Cache & track metrics
    if dhash and result.failure != ValidationFailure.UNKNOWN:
        with cache_lock:
            STAGE0_HASH_CACHE[dhash] = result

    latency = (time.time() - start_time) * 1000
    metrics_tracker.track_upload(accepted=result.accepted, cached=False, latency_ms=latency)
    return result
