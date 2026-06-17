from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_notification_email_task(self, notification_id: str):
    """Send email for a notification if user has email notifications enabled."""
    from apps.notifications.models import Notification

    try:
        notification = Notification.objects.select_related("user").get(id=notification_id)
    except Notification.DoesNotExist:
        return

    if not notification.user or not notification.user.email:
        return

    from apps.notifications.models import NotificationPreference

    pref, _ = NotificationPreference.objects.get_or_create(user=notification.user)
    if not pref.email_notifications:
        return

    try:
        send_mail(
            subject=notification.title,
            message=notification.message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tujjar.com"),
            recipient_list=[notification.user.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error("Failed to send notification email: %s", e)
        self.retry(countdown=60)


@shared_task(bind=True, max_retries=3)
def send_order_confirmation_email(self, order_id: str):
    """Send order confirmation email to customer."""
    from apps.orders.models import Order

    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return

    try:
        send_mail(
            subject=f"Order Confirmation - {order.order_number}",
            message=(
                f"Hi {order.customer_first_name},\n\n"
                f"Your order {order.order_number} has been confirmed.\n"
                f"Total: ${order.total}\n\n"
                f"Thank you for your purchase!"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tujjar.com"),
            recipient_list=[order.customer_email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error("Failed to send order confirmation: %s", e)
        self.retry(countdown=60)
