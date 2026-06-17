from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class Organization(UUIDModel, TimeStampedModel):
    """Organization/tenant model. Each store belongs to an organization."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    plan = models.ForeignKey(
        "billing.Plan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organizations",
    )
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    logo = models.ImageField(upload_to="org-logos/", blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def owner(self):
        membership = self.memberships.filter(role__slug="owner", is_accepted=True).first()
        return membership.user if membership and membership.user else None


class Role(UUIDModel, TimeStampedModel):
    """Role for RBAC within an organization."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, default="")
    is_system = models.BooleanField(default=False, help_text="System roles cannot be deleted")
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="roles",
    )

    class Meta:
        unique_together = ["slug", "organization"]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Permission(UUIDModel):
    """Granular permission for RBAC."""

    name = models.CharField(max_length=255)
    codename = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=100, help_text="e.g. products, orders")
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["module", "codename"]

    def __str__(self) -> str:
        return f"{self.module}.{self.codename}"


class RolePermission(UUIDModel):
    """Many-to-many through model for role permissions."""

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name="role_permissions"
    )

    class Meta:
        unique_together = ["role", "permission"]


class OrganizationMembership(UUIDModel, TimeStampedModel):
    """User membership in an organization."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="memberships")
    is_accepted = models.BooleanField(default=False)
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["user", "organization"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_accepted"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.organization.name} ({self.role.slug})"
