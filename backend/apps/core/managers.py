from __future__ import annotations

from django.db import models

from .threadlocals import get_current_org_id


class TenantManager(models.Manager):
    """Manager that filters queries by organization_id from thread-local state."""

    def get_queryset(self):
        org_id = get_current_org_id()
        qs = super().get_queryset()
        if org_id and hasattr(self.model, "organization_id"):
            qs = qs.filter(organization_id=org_id)
        return qs


class UnscopedManager(models.Manager):
    """Manager that returns all objects without tenant filtering."""

    def get_queryset(self):
        return super().get_queryset()
