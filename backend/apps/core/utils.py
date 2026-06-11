from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.organizations.models import Organization


def resolve_organization(org_id: str | None) -> Organization | None:
    """Resolve an organization ID to an Organization instance."""
    if not org_id:
        return None
    from apps.organizations.models import Organization

    return Organization.objects.filter(id=org_id).first()
