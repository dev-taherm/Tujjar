from __future__ import annotations

from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate, sender="templates")
def create_default_templates(sender, **kwargs):
    """Seed system templates on migration."""
    from .data import TEMPLATES_DATA
    from .models import Template

    for template_data in TEMPLATES_DATA:
        data = dict(template_data)
        presets = data.pop("presets", [])
        pages = data.pop("pages", [])
        Template.objects.get_or_create(
            slug=data["slug"],
            defaults={
                **data,
                "is_system": True,
                "presets": presets,
                "pages": pages,
            },
        )
