from __future__ import annotations

import uuid

from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class MediaFolder(UUIDModel, TimeStampedModel):
    """Folder for organizing media assets."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="media_folders",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_folders",
    )
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    path = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        unique_together = ["store", "name", "parent"]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if self.parent:
            self.path = f"{self.parent.path}/{self.name}"
        else:
            self.path = self.name
        super().save(*args, **kwargs)


def media_upload_path(instance, filename) -> str:
    """Generate upload path: org_id/store_id/filename"""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    parts = [str(instance.organization_id)]
    if instance.store_id:
        parts.append(str(instance.store_id))
    if instance.folder_id:
        parts.append(str(instance.folder_id))
    parts.append(unique_name)
    return "/".join(parts)


class MediaAsset(UUIDModel, TimeStampedModel):
    """Uploaded media file (image, video, document)."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    FILE_TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
        ("document", "Document"),
        ("other", "Other"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="media_assets",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_assets",
    )
    folder = models.ForeignKey(
        MediaFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
    )

    # File info
    title = models.CharField(max_length=255, blank=True, default="")
    filename = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255, blank=True, default="")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default="other")
    mime_type = models.CharField(max_length=100, blank=True, default="")
    file_size = models.PositiveIntegerField(default=0)  # bytes

    # URLs
    file_url = models.URLField()
    thumbnail_url = models.URLField(blank=True, default="")
    cdn_url = models.URLField(blank=True, default="")

    # Storage
    storage_backend = models.CharField(max_length=20, default="local")  # local, s3, minio
    storage_path = models.CharField(max_length=500, blank=True, default="")

    # Image metadata
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)

    # Alt text / SEO
    alt_text = models.CharField(max_length=255, blank=True, default="")
    title_attr = models.CharField(max_length=255, blank=True, default="")

    # Usage tracking
    used_in_products = models.PositiveIntegerField(default=0)
    used_in_pages = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store"]),
            models.Index(fields=["organization", "store", "file_type"]),
        ]

    def __str__(self) -> str:
        return self.title or self.filename

    @property
    def is_image(self) -> bool:
        return self.file_type == "image"

    @property
    def file_size_display(self) -> str:
        size = self.file_size
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
