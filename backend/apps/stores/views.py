from __future__ import annotations

import logging
import subprocess

from django.conf import settings as django_settings
from django.core.cache import cache
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasOrganizationPermission
from apps.core.viewsets import AuditLogMixin, TenantViewSet

from .models import Store, StoreDomain
from .serializers import (
    SlugCheckSerializer,
    StoreDomainSerializer,
    StoreSerializer,
    StoreSettingsSerializer,
    StoreWizardSerializer,
)

logger = logging.getLogger(__name__)


class SlugCheckView(APIView):
    """Check if a store slug is available."""

    permission_classes = [IsAuthenticated]
    throttle_classes = []

    def get(self, request):
        slug = request.query_params.get("slug", "")
        serializer = SlugCheckSerializer(data={"slug": slug})
        serializer.is_valid(raise_exception=True)
        clean_slug = serializer.validated_data["slug"]
        org_id = getattr(request, "org_id", None)
        exists = Store.objects.filter(slug=clean_slug)
        if org_id:
            exists = exists.filter(organization_id=org_id)
        return Response(
            {
                "slug": clean_slug,
                "available": not exists.exists(),
            }
        )


class StoreSlugChangeView(AuditLogMixin, APIView):
    """Change a store's subdomain slug."""

    permission_classes = [IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request, pk):
        store = Store.objects.filter(id=pk, organization_id=request.org_id).first()
        if not store:
            return Response({"error": "Store not found"}, status=404)

        new_slug = request.data.get("slug", "").strip()
        if not new_slug:
            return Response({"error": "Slug is required"}, status=400)

        serializer = SlugCheckSerializer(data={"slug": new_slug})
        serializer.is_valid(raise_exception=True)
        clean_slug = serializer.validated_data["slug"]

        if clean_slug == store.slug:
            return Response({"error": "New slug is the same as current slug"}, status=400)

        if Store.objects.filter(slug=clean_slug).exclude(id=store.id).exists():
            return Response({"error": "This slug is already taken"}, status=400)

        old_slug = store.slug
        store.slug = clean_slug
        store.save(update_fields=["slug", "updated_at"])
        cache.delete(f"storefront:store:{old_slug}")
        cache.delete(f"storefront:store:{clean_slug}")

        self._log_audit(
            action="store.slug_change",
            resource_type="store",
            resource_id=store.id,
            old_value={"slug": old_slug},
            new_value={"slug": clean_slug},
        )

        return Response(
            {
                "slug": clean_slug,
                "domain": store.domain,
                "message": "Store slug updated successfully",
            }
        )


class StoreWizardView(AuditLogMixin, APIView):
    """Multi-step store creation wizard."""

    permission_classes = [IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request):
        serializer = StoreWizardSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        self._log_audit(
            action="store.wizard_create",
            resource_type="store",
            resource_id=store.id,
            new_value=StoreSerializer(store).data,
        )
        return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)


class StoreViewSet(TenantViewSet):
    """Store CRUD scoped to the current organization."""

    serializer_class = StoreSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        return Store.objects.filter(organization_id=self.request.org_id).select_related(
            "theme", "template", "logo", "favicon"
        )

    def perform_create(self, serializer):
        store = serializer.save()
        self._log_audit(
            action="store.create",
            resource_type="store",
            resource_id=store.id,
            new_value=StoreSerializer(store).data,
        )

    def perform_update(self, serializer):
        old_data = StoreSerializer(serializer.instance).data
        old_slug = serializer.instance.slug
        store = serializer.save()
        self._log_audit(
            action="store.update",
            resource_type="store",
            resource_id=store.id,
            old_value=old_data,
            new_value=StoreSerializer(store).data,
        )
        cache.delete(f"storefront:store:{old_slug}")
        if store.slug != old_slug:
            cache.delete(f"storefront:store:{store.slug}")

    def perform_destroy(self, instance):
        self._log_audit(
            action="store.delete",
            resource_type="store",
            resource_id=instance.id,
            old_value=StoreSerializer(instance).data,
        )
        cache.delete(f"storefront:store:{instance.slug}")
        instance.delete()

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get the first active store for the current organization."""
        store = Store.objects.filter(organization_id=request.org_id, is_active=True).first()
        if not store:
            return Response(
                {"detail": "No active store found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StoreSerializer(store).data)

    @action(detail=True, methods=["post"], url_path="set-theme")
    def set_theme(self, request, pk=None):
        """Set the active theme for a store."""
        store = self.get_object()
        theme_id = request.data.get("theme_id")
        if not theme_id:
            return Response(
                {"error": "theme_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.themes.models import Theme

        theme = Theme.objects.filter(id=theme_id).first()
        if not theme:
            return Response(
                {"error": "Theme not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if theme.organization_id and str(theme.organization_id) != str(request.org_id):
            return Response(
                {"error": "Theme does not belong to your organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

        store.theme = theme
        store.save(update_fields=["theme", "updated_at"])
        cache.delete(f"storefront:store:{store.slug}")

        self._log_audit(
            action="store.set_theme",
            resource_type="store",
            resource_id=store.id,
            new_value={"theme_id": str(theme.id), "theme_name": theme.name},
        )

        return Response(StoreSerializer(store).data)

    @action(detail=True, methods=["patch"], url_path="update-settings")
    def update_settings(self, request, pk=None):
        store = self.get_object()
        old_settings = store.settings
        serializer = StoreSettingsSerializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete(f"storefront:store:{store.slug}")
        self._log_audit(
            action="store.update_settings",
            resource_type="store",
            resource_id=store.id,
            old_value={"settings": old_settings},
            new_value={"settings": store.settings},
        )
        return Response(StoreSerializer(store).data)


class StoreDomainViewSet(TenantViewSet):
    """Domain management for a store."""

    serializer_class = StoreDomainSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        return StoreDomain.objects.filter(store_id=self.kwargs["pk"])

    def get_object(self):
        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            from rest_framework.exceptions import NotFound

            raise NotFound("Store not found.")
        domain = StoreDomain.objects.filter(
            id=self.kwargs["domain_pk"],
            store_id=self.kwargs["pk"],
        ).first()
        if not domain:
            from rest_framework.exceptions import NotFound

            raise NotFound("Domain not found.")
        return domain

    def perform_create(self, serializer):
        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Store not found or access denied.")
        domain = serializer.save(store_id=self.kwargs["pk"])
        self._log_audit(
            action="store.domain.create",
            resource_type="store_domain",
            resource_id=domain.id,
            new_value={"domain": domain.domain, "store_id": str(store.id)},
        )

    def perform_update(self, serializer):
        domain = serializer.save()
        self._log_audit(
            action="store.domain.update",
            resource_type="store_domain",
            resource_id=domain.id,
            new_value={"domain": domain.domain, "is_primary": domain.is_primary},
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="store.domain.delete",
            resource_type="store_domain",
            resource_id=instance.id,
            old_value={"domain": instance.domain},
        )
        was_primary = instance.is_primary
        instance.delete()
        if was_primary:
            store = Store.objects.filter(id=self.kwargs["pk"]).first()
            if store:
                remaining = StoreDomain.objects.filter(store_id=store.id).first()
                if remaining:
                    store.custom_domain = remaining.domain
                else:
                    store.custom_domain = None
                store.save(update_fields=["custom_domain", "updated_at"])
                cache.delete(f"storefront:store:{store.slug}")


class StoreDomainVerifyView(AuditLogMixin, generics.GenericAPIView):
    """Verify a domain by checking DNS records (CNAME/A + TXT verification token)."""

    permission_classes = [permissions.IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request, pk, domain_pk):
        store = Store.objects.filter(id=pk, organization_id=request.org_id).first()
        if not store:
            return Response({"error": "Store not found"}, status=404)

        domain = StoreDomain.objects.filter(id=domain_pk, store_id=pk).first()
        if not domain:
            return Response({"error": "Domain not found"}, status=404)

        cname_ok = self._check_cname_a(domain.domain)
        txt_ok = self._check_txt(domain.domain, domain.verification_token)

        if cname_ok and txt_ok:
            domain.verified = True
            domain.save(update_fields=["verified", "updated_at"])
            self._log_audit(
                action="store.domain.verify",
                resource_type="store_domain",
                resource_id=domain.id,
                new_value={"domain": domain.domain, "verified": True},
            )
            return Response({"verified": True, "domain": domain.domain})

        errors = []
        if not cname_ok:
            errors.append("CNAME or A record not found. Point your domain to the target CNAME.")
        if not txt_ok:
            errors.append(
                "TXT verification record not found. Add the verification token as a TXT record."
            )
        return Response(
            {
                "verified": False,
                "domain": domain.domain,
                "message": " ".join(errors),
                "details": {"cname": cname_ok, "txt": txt_ok},
            }
        )

    def _check_cname_a(self, domain_name: str) -> bool:
        try:
            socket_result = subprocess.run(
                ["dig", "+short", domain_name, "A"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if socket_result.stdout.strip():
                return True
            socket_result = subprocess.run(
                ["dig", "+short", domain_name, "CNAME"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return bool(socket_result.stdout.strip())
        except (subprocess.TimeoutExpired, FileNotFoundError):
            import socket

            try:
                socket.getaddrinfo(domain_name, 80, socket.AF_INET)
                return True
            except (socket.gaierror, OSError):
                return False

    def _check_txt(self, domain_name: str, expected_token: str) -> bool:
        try:
            result = subprocess.run(
                ["dig", "+short", f"_tujjar-verify.{domain_name}", "TXT"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            output = result.stdout.strip()
            if not output:
                return False
            for line in output.splitlines():
                cleaned = line.strip('"').strip("'")
                if expected_token in cleaned:
                    return True
            return False
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False


class StoreDomainInstructionsView(generics.GenericAPIView):
    """Get DNS setup instructions for a domain."""

    permission_classes = [permissions.IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def get(self, request, pk, domain_pk):
        store = Store.objects.filter(id=pk, organization_id=request.org_id).first()
        if not store:
            return Response({"error": "Store not found"}, status=404)

        domain = StoreDomain.objects.filter(id=domain_pk, store_id=pk).first()
        if not domain:
            return Response({"error": "Domain not found"}, status=404)

        target_cname = f"{store.slug}.{django_settings.STORE_DOMAIN}"

        return Response(
            {
                "domain": domain.domain,
                "verification_token": domain.verification_token,
                "instructions": {
                    "cname": {
                        "type": "CNAME",
                        "host": domain.domain,
                        "value": target_cname,
                        "description": "Point your domain to your Tujjar store",
                    },
                    "verification": {
                        "type": "TXT",
                        "host": f"_tujjar-verify.{domain.domain}",
                        "value": domain.verification_token,
                        "description": "Verify domain ownership",
                    },
                },
                "verified": domain.verified,
            }
        )


class StoreDomainPrimaryView(AuditLogMixin, generics.GenericAPIView):
    """Set a domain as the primary domain for a store."""

    permission_classes = [permissions.IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request, pk, domain_pk):
        store = Store.objects.filter(id=pk, organization_id=request.org_id).first()
        if not store:
            return Response({"error": "Store not found"}, status=404)

        domain = StoreDomain.objects.filter(id=domain_pk, store_id=pk).first()
        if not domain:
            return Response({"error": "Domain not found"}, status=404)

        StoreDomain.objects.filter(store_id=pk, is_primary=True).update(is_primary=False)
        domain.is_primary = True
        domain.save(update_fields=["is_primary", "updated_at"])

        store.custom_domain = domain.domain
        store.save(update_fields=["custom_domain", "updated_at"])
        cache.delete(f"storefront:store:{store.slug}")

        self._log_audit(
            action="store.domain.set_primary",
            resource_type="store_domain",
            resource_id=domain.id,
            new_value={"domain": domain.domain, "is_primary": True},
        )

        return Response({"domain": domain.domain, "is_primary": True})
