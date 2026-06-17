from __future__ import annotations

import copy

from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


def _deep_merge(base: dict, override: dict) -> dict:
    """Deep merge two dicts. Override values win, but nested dicts are merged recursively."""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


class Theme(UUIDModel, TimeStampedModel):
    """Theme model with configuration for colors, typography, spacing, etc."""

    CATEGORY_CHOICES = [
        ("", "General"),
        ("fashion", "Fashion"),
        ("electronics", "Electronics"),
        ("restaurant", "Restaurant"),
        ("pharmacy", "Pharmacy"),
        ("beauty", "Beauty & Wellness"),
        ("sports", "Sports & Fitness"),
        ("home", "Home & Garden"),
    ]

    objects = TenantManager()
    unscoped = UnscopedManager()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="themes",
        help_text="Null means system theme",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    version = models.CharField(max_length=50, default="1.0.0")
    parent_theme = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="child_themes",
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Theme configuration: colors, typography, spacing, borderRadius, animations, darkMode",
    )
    sections_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="Available section definitions for this theme",
    )
    assets = models.JSONField(
        default=dict,
        blank=True,
        help_text="CSS variables, JS hooks",
    )
    preview_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="theme_previews",
    )
    is_system = models.BooleanField(default=False, help_text="System themes cannot be deleted")
    is_active = models.BooleanField(default=True)
    category = models.CharField(max_length=50, blank=True, default="", choices=CATEGORY_CHOICES)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} v{self.version}"

    @property
    def effective_config(self) -> dict:
        """Property alias for get_effective_config()."""
        return self.get_effective_config()

    def get_effective_config(self) -> dict:
        """Get merged config with parent theme inheritance (deep merge)."""
        if self.parent_theme:
            parent_config = self.parent_theme.get_effective_config()
            return _deep_merge(parent_config, self.config)
        return copy.deepcopy(self.config)

    def get_color(self, color_name: str) -> str | None:
        """Get a specific color from the theme config."""
        config = self.get_effective_config()
        return config.get("colors", {}).get(color_name)

    def get_typography(self, key: str):
        """Get a specific typography setting."""
        config = self.get_effective_config()
        return config.get("typography", {}).get(key)


class ThemePreset(UUIDModel, TimeStampedModel):
    """Preset for a theme (e.g., dark mode, colorful, minimal)."""

    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name="presets")
    name = models.CharField(max_length=255)
    config = models.JSONField(
        default=dict, blank=True, help_text="Color/font overrides for this preset"
    )
    preview_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="theme_preset_previews",
    )

    class Meta:
        unique_together = ["theme", "name"]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.theme.name} - {self.name}"


class ThemeVersion(UUIDModel, TimeStampedModel):
    """Snapshot of a theme's state at a point in time for version history and rollback."""

    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name="versions")
    version = models.CharField(max_length=50)
    config = models.JSONField(default=dict, blank=True)
    sections_schema = models.JSONField(default=dict, blank=True)
    assets = models.JSONField(default=dict, blank=True)
    note = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="theme_versions",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.theme.name} v{self.version}"
