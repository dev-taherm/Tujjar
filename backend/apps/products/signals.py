from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver(post_save, sender="products.Product")
def invalidate_org_storefront_on_product_save(sender, instance, **kwargs):
    """Products are organization-scoped but appear in every store's sitemap."""
    if not instance.organization_id:
        return
    from apps.storefront.cache import invalidate_org_stores

    invalidate_org_stores(instance.organization_id)


@receiver(post_delete, sender="products.Product")
def invalidate_org_storefront_on_product_delete(sender, instance, **kwargs):
    if not instance.organization_id:
        return
    from apps.storefront.cache import invalidate_org_stores

    invalidate_org_stores(instance.organization_id)
