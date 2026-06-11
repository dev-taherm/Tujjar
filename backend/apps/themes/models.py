from __future__ import annotations

from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Theme(UUIDModel, TimeStampedModel):
    """Theme model with configuration for colors, typography, spacing, etc."""

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
    is_system = models.BooleanField(
        default=False, help_text="System themes cannot be deleted"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} v{self.version}"

    def get_effective_config(self) -> dict:
        """Get merged config with parent theme inheritance."""
        if self.parent_theme:
            parent_config = self.parent_theme.get_effective_config()
            return {**parent_config, **self.config}
        return self.config

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
