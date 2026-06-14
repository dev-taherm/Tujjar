from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


class Page(UUIDModel, TimeStampedModel):
    """Page model. content_schema JSONB is the source of truth for the page builder."""

    objects = TenantManager()
    unscoped = UnscopedManager()

    PAGE_TYPE_CHOICES = [
        ("homepage", "Homepage"),
        ("product", "Product"),
        ("collection", "Collection"),
        ("blog", "Blog"),
        ("custom", "Custom"),
        ("legal", "Legal"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="pages",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="pages",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    page_type = models.CharField(max_length=50, choices=PAGE_TYPE_CHOICES, default="custom")
    content_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="Page content as JSON. Source of truth for section builder.",
    )
    theme_override = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="Per-page theme overrides",
    )
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    translations = models.JSONField(
        default=dict, blank=True,
        help_text='Per-locale translations, e.g. {"ar": {"title": "...", "content_schema": {...}}}',
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_pages",
    )
    version = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ["organization", "store", "slug"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "store", "is_published"]),
            models.Index(fields=["organization", "store", "page_type"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.store.name})"

    def publish(self, user=None):
        """Publish the page and create a version snapshot."""
        self.is_published = True
        self.published_at = timezone.now()
        self.version += 1
        self.save(update_fields=["is_published", "published_at", "version", "updated_at"])
        PageVersion.objects.create(
            page=self,
            version=self.version,
            content_schema=self.content_schema,
            created_by=user,
            change_summary=f"Published v{self.version}",
        )

    def unpublish(self):
        """Unpublish the page."""
        self.is_published = False
        self.save(update_fields=["is_published", "updated_at"])

    def restore_version(self, version_number: int, user=None):
        """Restore page to a specific version."""
        version = PageVersion.objects.get(page=self, version=version_number)
        self.content_schema = version.content_schema
        self.version += 1
        self.save(update_fields=["content_schema", "version", "updated_at"])
        PageVersion.objects.create(
            page=self,
            version=self.version,
            content_schema=self.content_schema,
            created_by=user,
            change_summary=f"Restored to v{version_number}",
        )

    def get_sections(self) -> list[dict]:
        """Get sections from content_schema."""
        return self.content_schema.get("sections", [])

    def add_section(self, section: dict, position: int | None = None):
        """Add a section to content_schema."""
        sections = self.get_sections()
        if position is not None:
            sections.insert(position, section)
        else:
            sections.append(section)
        self.content_schema["sections"] = sections
        self.save(update_fields=["content_schema", "updated_at"])

    def update_section(self, section_id: str, settings: dict):
        """Update a section's settings."""
        sections = self.get_sections()
        for section in sections:
            if section["id"] == section_id:
                section["settings"] = settings
                break
        self.content_schema["sections"] = sections
        self.save(update_fields=["content_schema", "updated_at"])

    def remove_section(self, section_id: str):
        """Remove a section from content_schema."""
        sections = [s for s in self.get_sections() if s["id"] != section_id]
        self.content_schema["sections"] = sections
        self.save(update_fields=["content_schema", "updated_at"])

    def reorder_sections(self, section_ids: list[str]):
        """Reorder sections by providing ordered list of IDs."""
        sections_map = {s["id"]: s for s in self.get_sections()}
        ordered = [sections_map[sid] for sid in section_ids if sid in sections_map]
        self.content_schema["sections"] = ordered
        self.save(update_fields=["content_schema", "updated_at"])

    def toggle_section_visibility(self, section_id: str, device: str):
        """Toggle section visibility for a device (desktop, tablet, mobile)."""
        sections = self.get_sections()
        for section in sections:
            if section["id"] == section_id:
                vis = section.get("visibility", {"desktop": True, "tablet": True, "mobile": True})
                vis[device] = not vis.get(device, True)
                section["visibility"] = vis
                break
        self.content_schema["sections"] = sections
        self.save(update_fields=["content_schema", "updated_at"])

    def duplicate_section(self, section_id: str):
        """Duplicate a section."""
        sections = self.get_sections()
        for section in sections:
            if section["id"] == section_id:
                import copy
                new_section = copy.deepcopy(section)
                new_section["id"] = str(uuid.uuid4())
                idx = sections.index(section)
                sections.insert(idx + 1, new_section)
                break
        self.content_schema["sections"] = sections
        self.save(update_fields=["content_schema", "updated_at"])


class PageVersion(UUIDModel, TimeStampedModel):
    """Snapshot of a page's content_schema at a point in time."""

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="versions")
    version = models.PositiveIntegerField()
    content_schema = models.JSONField(default=dict)
    created_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    change_summary = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        unique_together = ["page", "version"]
        ordering = ["-version"]

    def __str__(self) -> str:
        return f"{self.page.title} v{self.version}"
