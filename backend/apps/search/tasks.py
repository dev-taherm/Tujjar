from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def update_search_index_for_product(self, product_id: str):
    """Create or update SearchIndex when a product changes."""
    from apps.products.models import Product
    from apps.search.models import SearchIndex

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return

    tags = " ".join(product.tags) if isinstance(product.tags, list) else ""
    SearchIndex.objects.update_or_create(
        organization_id=product.organization_id,
        store_id=product.store_id,
        entity_type="product",
        entity_id=str(product.id),
        defaults={
            "title": product.title,
            "description": product.description or "",
            "tags": tags,
            "boost": 1.0 if product.status == "active" else 0.5,
        },
    )


@shared_task(bind=True, max_retries=3)
def update_search_index_for_category(self, category_id: str):
    """Create or update SearchIndex when a category changes."""
    from apps.products.models import Category
    from apps.search.models import SearchIndex

    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return

    SearchIndex.objects.update_or_create(
        organization_id=category.organization_id,
        store_id=category.store_id,
        entity_type="category",
        entity_id=str(category.id),
        defaults={
            "title": category.name,
            "description": category.description or "",
            "tags": "",
            "boost": 0.8,
        },
    )


@shared_task(bind=True, max_retries=3)
def update_search_index_for_page(self, page_id: str):
    """Create or update SearchIndex when a page changes."""
    from apps.pages.models import Page
    from apps.search.models import SearchIndex

    try:
        page = Page.objects.get(id=page_id)
    except Page.DoesNotExist:
        return

    SearchIndex.objects.update_or_create(
        organization_id=page.organization_id,
        store_id=page.store_id,
        entity_type="page",
        entity_id=str(page.id),
        defaults={
            "title": page.title,
            "description": page.seo_description or "",
            "tags": "",
            "boost": 0.6,
        },
    )
