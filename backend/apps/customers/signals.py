from __future__ import annotations

from decimal import Decimal

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.orders.models import Order


@receiver(post_save, sender=Order)
def update_customer_stats_on_save(sender, instance, created, **kwargs):
    """Update customer stats when an order is created or its total changes."""
    _update_customer_stats(instance)


@receiver(post_delete, sender=Order)
def update_customer_stats_on_delete(sender, instance, **kwargs):
    """Update customer stats when an order is deleted."""
    _update_customer_stats(instance)


def _update_customer_stats(order):
    """Recalculate customer stats from all their orders."""
    if not order.customer_id:
        return
    from django.db.models import Count, Sum
    from apps.customers.models import Customer

    stats = Order.objects.filter(
        customer_id=order.customer_id,
    ).aggregate(
        orders_count=Count("id"),
        total_spent=Sum("total"),
    )
    Customer.objects.filter(id=order.customer_id).update(
        orders_count=stats["orders_count"] or 0,
        total_spent=stats["total_spent"] or Decimal("0"),
        last_order_date=order.created_at,
    )
