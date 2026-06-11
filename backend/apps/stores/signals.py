from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="organizations.Organization")
def create_default_store(sender, instance, created, **kwargs):
    """Create a default store when an organization is created."""
    if created:
        from apps.themes.models import Theme

        from .models import Store

        # Assign the first active system theme if available
        theme = Theme.objects.filter(is_system=True, is_active=True).first()
        Store.objects.create(
            organization=instance,
            name=f"{instance.name} Store",
            slug=instance.slug,
            theme=theme,
        )
