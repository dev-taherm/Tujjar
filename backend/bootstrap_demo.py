"""One-off bootstrap: demo org + owner membership + store for local dev."""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.authentication.models import User  # noqa: E402
from apps.billing.models import Plan  # noqa: E402
from apps.organizations.models import Organization, OrganizationMembership, Role  # noqa: E402
from apps.stores.models import Store  # noqa: E402

user = User.objects.filter(email="admin@tujjar.com").first()
if not user:
    raise SystemExit("admin@tujjar.com not found - create superuser first")
if not user.is_verified:
    user.is_verified = True
    user.save(update_fields=["is_verified"])

org, created = Organization.objects.get_or_create(
    slug="demo",
    defaults={"name": "Demo Organization"},
)
print(f"Organization: {org.slug} (created={created})")

if not org.plan_id:
    plan = Plan.objects.first()
    if plan:
        org.plan = plan
        org.save(update_fields=["plan"])
        print(f"Assigned plan: {plan.name}")

role, created = Role.objects.get_or_create(
    organization=org,
    slug="owner",
    defaults={"name": "Owner", "description": "Organization owner"},
)
print(f"Role: {role.slug} (created={created})")

membership, created = OrganizationMembership.objects.get_or_create(
    user=user,
    organization=org,
    defaults={"role": role, "is_accepted": True},
)
if not membership.is_accepted:
    membership.is_accepted = True
    membership.role = role
    membership.save(update_fields=["is_accepted", "role"])
print(f"Membership: {membership} (created={created})")

store, created = Store.objects.get_or_create(
    organization=org,
    slug="fashion-store",
    defaults={"name": "Fashion Store", "description": "Demo storefront for local development"},
)
print(f"Store: {store.slug} (created={created})")
print("Bootstrap complete.")
