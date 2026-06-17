from __future__ import annotations

from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Permission, Role, RolePermission


@receiver(post_migrate, sender="organizations")
def create_default_roles_and_permissions(sender, **kwargs):
    """Create system roles and permissions on migration."""
    # Create permissions for each module
    permissions_data = [
        # Products
        ("View products", "products.view", "products"),
        ("Create products", "products.create", "products"),
        ("Edit products", "products.update", "products"),
        ("Delete products", "products.delete", "products"),
        # Orders
        ("View orders", "orders.view", "orders"),
        ("Manage orders", "orders.manage", "orders"),
        ("Refund orders", "orders.refund", "orders"),
        # Customers
        ("View customers", "customers.view", "customers"),
        ("Manage customers", "customers.manage", "customers"),
        # Pages
        ("View pages", "pages.view", "pages"),
        ("Create pages", "pages.create", "pages"),
        ("Edit pages", "pages.update", "pages"),
        ("Delete pages", "pages.delete", "pages"),
        ("Publish pages", "pages.publish", "pages"),
        # Themes
        ("View themes", "themes.view", "themes"),
        ("Manage themes", "themes.manage", "themes"),
        # Media
        ("Upload media", "media.upload", "media"),
        ("Delete media", "media.delete", "media"),
        # Analytics
        ("View analytics", "analytics.view", "analytics"),
        # Billing
        ("Manage billing", "billing.manage", "billing"),
        ("View invoices", "billing.view_invoices", "billing"),
        # Settings
        ("Manage settings", "settings.manage", "settings"),
        # AI
        ("Use AI features", "ai.use", "ai"),
        # Members
        ("Invite members", "members.invite", "members"),
        ("Remove members", "members.remove", "members"),
        ("View members", "members.view", "members"),
    ]

    for name, codename, module in permissions_data:
        Permission.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "module": module},
        )

    # Create system roles
    roles_data = [
        (
            "Owner",
            "owner",
            True,
            [
                "products.view",
                "products.create",
                "products.update",
                "products.delete",
                "orders.view",
                "orders.manage",
                "orders.refund",
                "customers.view",
                "customers.manage",
                "pages.view",
                "pages.create",
                "pages.update",
                "pages.delete",
                "pages.publish",
                "themes.view",
                "themes.manage",
                "media.upload",
                "media.delete",
                "analytics.view",
                "billing.manage",
                "billing.view_invoices",
                "settings.manage",
                "ai.use",
                "members.invite",
                "members.remove",
                "members.view",
            ],
        ),
        (
            "Admin",
            "admin",
            True,
            [
                "products.view",
                "products.create",
                "products.update",
                "products.delete",
                "orders.view",
                "orders.manage",
                "orders.refund",
                "customers.view",
                "customers.manage",
                "pages.view",
                "pages.create",
                "pages.update",
                "pages.delete",
                "pages.publish",
                "themes.view",
                "themes.manage",
                "media.upload",
                "media.delete",
                "analytics.view",
                "members.invite",
                "members.view",
            ],
        ),
        (
            "Manager",
            "manager",
            True,
            [
                "products.view",
                "products.create",
                "products.update",
                "orders.view",
                "orders.manage",
                "customers.view",
                "customers.manage",
                "pages.view",
                "pages.update",
                "media.upload",
                "analytics.view",
            ],
        ),
        (
            "Editor",
            "editor",
            True,
            [
                "products.view",
                "products.update",
                "pages.view",
                "pages.create",
                "pages.update",
                "pages.publish",
                "media.upload",
            ],
        ),
        (
            "Customer Support",
            "customer_support",
            True,
            [
                "orders.view",
                "orders.manage",
                "customers.view",
                "customers.manage",
                "pages.view",
            ],
        ),
        (
            "Staff",
            "staff",
            True,
            [
                "products.view",
                "orders.view",
                "customers.view",
            ],
        ),
    ]

    for name, slug, is_system, perm_codenames in roles_data:
        role, _ = Role.objects.get_or_create(
            slug=slug,
            organization=None,
            defaults={"name": name, "is_system": is_system},
        )
        permissions = Permission.objects.filter(codename__in=perm_codenames)
        for perm in permissions:
            RolePermission.objects.get_or_create(role=role, permission=perm)
