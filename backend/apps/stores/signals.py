from __future__ import annotations

from django.db.models.signals import post_delete, post_save
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


@receiver(post_save, sender="stores.Store")
def invalidate_storefront_cache_on_store_save(sender, instance, **kwargs):
    """Drop storefront caches when a store (theme, SEO, settings...) changes."""
    from apps.storefront.cache import invalidate_store

    invalidate_store(instance.slug)


@receiver(post_delete, sender="stores.Store")
def invalidate_storefront_cache_on_store_delete(sender, instance, **kwargs):
    from apps.storefront.cache import invalidate_store

    invalidate_store(instance.slug)
