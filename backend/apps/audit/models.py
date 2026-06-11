import uuid
from typing import Any

from django.db import models


class AuditLogManager(models.Manager):
    def get_for_org(self, organization_id: str, **kwargs):
        return self.filter(organization_id=organization_id, **kwargs)


class AuditLog(models.Model):
    """Audit log for tracking all important actions."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    user = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=255, db_index=True)
    resource_type = models.CharField(max_length=255, db_index=True)
    resource_id = models.CharField(max_length=255)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = AuditLogManager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "action"]),
            models.Index(fields=["organization", "resource_type"]),
            models.Index(fields=["user", "action"]),
        ]

    def __str__(self) -> str:
        return f"{self.action} {self.resource_type}:{self.resource_id} by {self.user}"


def log_action(
    action: str,
    resource_type: str,
    resource_id: str,
    *,
    organization=None,
    user=None,
    old_value: dict[str, Any] | None = None,
    new_value: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str = "",
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """Helper function to create an audit log entry."""
    return AuditLog.objects.create(
        organization=organization,
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {},
    )
