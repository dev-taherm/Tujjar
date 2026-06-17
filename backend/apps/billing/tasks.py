from __future__ import annotations

import logging

from django.utils import timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def check_trial_expiry(self):
    """Check for expired trials and update subscription status."""
    from apps.billing.models import Subscription

    expired = Subscription.objects.filter(
        status=Subscription.Status.TRIALING,
        trial_end__lt=timezone.now(),
    )
    count = 0
    for sub in expired:
        sub.status = Subscription.Status.PAST_DUE
        sub.save(update_fields=["status", "updated_at"])
        count += 1

    logger.info("Checked trial expiry: %d subscriptions expired", count)
    return f"Updated {count} expired trials"
