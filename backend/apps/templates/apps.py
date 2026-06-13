from __future__ import annotations

from django.apps import AppConfig


class TemplatesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.templates"
    verbose_name = "Templates"

    def ready(self):
        import apps.templates.signals  # noqa: F401
