from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver(post_save, sender="products.Product")
def sync_product_search_index(sender, instance, **kwargs):
    from apps.search.tasks import update_search_index_for_product
    update_search_index_for_product.delay(str(instance.id))


@receiver(post_delete, sender="products.Product")
def delete_product_search_index(sender, instance, **kwargs):
    from apps.search.models import SearchIndex
    SearchIndex.objects.filter(
        entity_type="product", entity_id=str(instance.id),
    ).delete()


@receiver(post_save, sender="products.Category")
def sync_category_search_index(sender, instance, **kwargs):
    from apps.search.tasks import update_search_index_for_category
    update_search_index_for_category.delay(str(instance.id))


@receiver(post_delete, sender="products.Category")
def delete_category_search_index(sender, instance, **kwargs):
    from apps.search.models import SearchIndex
    SearchIndex.objects.filter(
        entity_type="category", entity_id=str(instance.id),
    ).delete()


@receiver(post_save, sender="pages.Page")
def sync_page_search_index(sender, instance, **kwargs):
    from apps.search.tasks import update_search_index_for_page
    update_search_index_for_page.delay(str(instance.id))


@receiver(post_delete, sender="pages.Page")
def delete_page_search_index(sender, instance, **kwargs):
    from apps.search.models import SearchIndex
    SearchIndex.objects.filter(
        entity_type="page", entity_id=str(instance.id),
    ).delete()
