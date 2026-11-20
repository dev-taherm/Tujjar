"""Cache invalidation helpers for the public storefront.

The storefront app caches store payloads, robots.txt and sitemap.xml with a
short TTL. These helpers let other apps (stores, themes, products, pages,
blog) drop the relevant keys as soon as their data changes, so merchant
updates appear on the public storefront immediately instead of up to five
minutes later.
"""

from __future__ import annotations

from django.core.cache import cache

STORE_CACHE_TTL = 300  # keep in sync with apps/storefront/views.py


def _keys(slug: str) -> list[str]:
    return [
        f"storefront:store:{slug}",
        f"storefront:robots:{slug}",
        f"storefront:sitemap:{slug}",
    ]


def invalidate_store(slug: str) -> None:
    """Drop all cached storefront artifacts for a single store."""
    for key in _keys(slug):
        cache.delete(key)


def invalidate_store_seo(slug: str) -> None:
    """Drop only robots.txt/sitemap.xml caches (content unchanged)."""
    cache.delete(f"storefront:robots:{slug}")
    cache.delete(f"storefront:sitemap:{slug}")


def invalidate_stores(slugs) -> None:
    """Drop cached artifacts for many stores (slugs iterable)."""
    for slug in slugs:
        invalidate_store(slug)


def invalidate_stores_for_theme(theme) -> None:
    """Invalidate every store whose effective theme chain includes `theme`.

    Theme configs inherit from `parent_theme`, so changing a theme also
    affects stores using any of its descendant themes.
    """
    from apps.stores.models import Store
    from apps.themes.models import Theme

    theme_ids = [theme.id]
    frontier = [theme.id]
    while frontier:
        children = list(
            Theme.objects.filter(parent_theme_id__in=frontier).values_list("id", flat=True)
        )
        frontier = children
        theme_ids.extend(children)
    invalidate_stores(
        Store.objects.filter(theme_id__in=theme_ids).values_list("slug", flat=True)
    )


def invalidate_org_stores(organization_id) -> None:
    """Invalidate every store belonging to an organization.

    Used for organization-scoped content (products) that appears in every
    store of the org.
    """
    from apps.stores.models import Store

    invalidate_stores(
        Store.objects.filter(organization_id=organization_id).values_list("slug", flat=True)
    )
