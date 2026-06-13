from __future__ import annotations

import mimetypes
import uuid
from pathlib import Path
from typing import Any

from django.core.files.storage import default_storage


class StorageService:
    """Unified storage service for local and S3/MinIO."""

    def __init__(self):
        self.backend = "local"

    def get_file_type(self, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        image_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"}
        video_exts = {".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"}
        doc_exts = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"}
        if ext in image_exts:
            return "image"
        elif ext in video_exts:
            return "video"
        elif ext in doc_exts:
            return "document"
        return "other"

    def get_mime_type(self, filename: str) -> str:
        mime, _ = mimetypes.guess_type(filename)
        return mime or "application/octet-stream"

    def generate_path(self, organization_id, store_id, folder_id, filename) -> str:
        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
        parts = [str(organization_id)]
        if store_id:
            parts.append(str(store_id))
        if folder_id:
            parts.append(str(folder_id))
        parts.append(unique_name)
        return "/".join(parts)

    def save_file(self, file_obj, storage_path: str) -> dict[str, Any]:
        """Save a file and return its URL."""
        saved_path = default_storage.save(storage_path, file_obj)
        url = default_storage.url(saved_path)
        return {
            "url": url,
            "path": saved_path,
            "size": file_obj.size if hasattr(file_obj, "size") else 0,
        }

    def delete_file(self, storage_path: str) -> bool:
        try:
            if default_storage.exists(storage_path):
                default_storage.delete(storage_path)
                return True
        except Exception:
            pass
        return False

    def get_upload_info(self, filename: str) -> dict:
        return {
            "file_type": self.get_file_type(filename),
            "mime_type": self.get_mime_type(filename),
            "original_filename": filename,
        }


storage_service = StorageService()
