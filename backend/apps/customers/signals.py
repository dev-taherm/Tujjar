from __future__ import annotations

from decimal import Decimal

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.orders.models import Order


@receiver(post_save, sender=Order)
def update_customer_stats_on_save(sender, instance, created, **kwargs):
    """Update customer stats when an order is created or its total changes."""
    _update_customer_stats(instance)
    _earn_loyalty_points(instance)


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


def _earn_loyalty_points(order):
    """When an order is delivered, award loyalty points (1 point per unit of total)."""
    if order.status != "delivered" or not order.customer_id:
        return
    from apps.customers.models import Customer, LoyaltyTransaction

    # Check if points were already earned for this order
    existing = LoyaltyTransaction.objects.filter(
        reference_id=order.id,
        type="earned",
    ).exists()
    if existing:
        return

    points = int(order.total)
    if points <= 0:
        return

    customer = Customer.objects.filter(id=order.customer_id).first()
    if not customer:
        return

    new_balance = customer.loyalty_points + points
    LoyaltyTransaction.objects.create(
        organization_id=order.organization_id,
        store_id=order.store_id,
        customer_id=customer.id,
        type="earned",
        points=points,
        balance=new_balance,
        description=f"Earned from order #{order.order_number}",
        reference_id=order.id,
    )
    Customer.objects.filter(id=customer.id).update(loyalty_points=new_balance)
