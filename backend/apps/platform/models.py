from __future__ import annotations

from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class SystemConfig(UUIDModel, TimeStampedModel):
    """Platform-wide configuration settings."""

    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "System Config"
        verbose_name_plural = "System Config"

    def __str__(self) -> str:
        return self.key

    @classmethod
    def get(cls, key: str, default=None):
        try:
            config = cls.objects.get(key=key)
            return config.value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set(cls, key: str, value, description: str = ""):
        config, _ = cls.objects.update_or_create(
            key=key, defaults={"value": value, "description": description}
        )
        return config
