from __future__ import annotations

import logging

from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasOrganizationPermission
from apps.core.viewsets import AuditLogMixin, TenantViewSet

from .models import Store, StoreDomain
from .serializers import SlugCheckSerializer, StoreDomainSerializer, StoreSerializer, StoreSettingsSerializer, StoreWizardSerializer

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
        return Response({
            "slug": clean_slug,
            "available": not exists.exists(),
        })


class StoreSlugChangeView(AuditLogMixin, APIView):
    """Change a store's subdomain slug."""

    permission_classes = [IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request, pk):
        store = Store.objects.filter(
            id=pk, organization_id=request.org_id
        ).first()
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

        self._log_audit(
            action="store.slug_change",
            resource_type="store",
            resource_id=store.id,
            old_value={"slug": old_slug},
            new_value={"slug": clean_slug},
        )

        return Response({
            "slug": clean_slug,
            "domain": store.domain,
            "message": "Store slug updated successfully",
        })


class StoreWizardView(APIView):
    """Multi-step store creation wizard."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StoreWizardSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        from apps.audit.models import log_action
        log_action(
            action="store.wizard_create",
            resource_type="store",
            resource_id=store.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            new_value=StoreSerializer(store).data,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)


class StoreViewSet(TenantViewSet):
    """Store CRUD scoped to the current organization."""

    serializer_class = StoreSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        return Store.objects.filter(
            organization_id=self.request.org_id
        ).select_related("theme", "template", "logo", "favicon")

    def perform_create(self, serializer):
        store = serializer.save()
        self._log_audit(action="store.create", resource_type="store", resource_id=store.id, new_value=StoreSerializer(store).data)

    def perform_update(self, serializer):
        old_data = StoreSerializer(serializer.instance).data
        store = serializer.save()
        self._log_audit(action="store.update", resource_type="store", resource_id=store.id, old_value=old_data, new_value=StoreSerializer(store).data)

    def perform_destroy(self, instance):
        self._log_audit(action="store.delete", resource_type="store", resource_id=instance.id, old_value=StoreSerializer(instance).data)
        instance.delete()

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get the first active store for the current organization."""
        store = Store.objects.filter(
            organization_id=request.org_id, is_active=True
        ).first()
        if not store:
            return Response(
                {"detail": "No active store found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StoreSerializer(store).data)

    @action(detail=True, methods=["patch"], url_path="update-settings")
    def update_settings(self, request, pk=None):
        store = self.get_object()
        serializer = StoreSettingsSerializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StoreSerializer(store).data)


class StoreDomainViewSet(TenantViewSet):
    """Domain management for a store."""

    serializer_class = StoreDomainSerializer
    required_permission = "settings.manage"

    def get_queryset(self):
        from rest_framework.exceptions import PermissionDenied

        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            raise PermissionDenied("Store not found or access denied.")
        return StoreDomain.objects.filter(store_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        store = Store.objects.filter(
            id=self.kwargs["pk"],
            organization_id=self.request.org_id,
        ).first()
        if not store:
            raise PermissionDenied("Store not found or access denied.")
        domain = serializer.save(store_id=self.kwargs["pk"])
        self._log_audit(action="store.domain.create", resource_type="store_domain", resource_id=domain.id, new_value={"domain": domain.domain, "store_id": str(store.id)})

    def perform_destroy(self, instance):
        self._log_audit(action="store.domain.delete", resource_type="store_domain", resource_id=instance.id, old_value={"domain": instance.domain})
        instance.delete()


class StoreDomainVerifyView(AuditLogMixin, generics.GenericAPIView):
    """Verify a domain by checking DNS records."""

    permission_classes = [permissions.IsAuthenticated, HasOrganizationPermission]
    required_permission = "settings.manage"

    def post(self, request, pk, domain_pk):
        store = Store.objects.filter(id=pk, organization_id=request.org_id).first()
        if not store:
            return Response({"error": "Store not found"}, status=404)

        domain = StoreDomain.objects.filter(id=domain_pk, store_id=pk).first()
        if not domain:
            return Response({"error": "Domain not found"}, status=404)

        import socket
        try:
            socket.getaddrinfo(domain.domain, 80, socket.AF_INET)
            domain.verified = True
            domain.save(update_fields=["verified", "updated_at"])
            self._log_audit(action="store.domain.verify", resource_type="store_domain", resource_id=domain.id, new_value={"domain": domain.domain, "verified": True})
            return Response({"verified": True, "domain": domain.domain})
        except (socket.gaierror, OSError):
            return Response({"verified": False, "domain": domain.domain, "message": "DNS record not found. Make sure the CNAME or A record points to your store."})


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

        from django.conf import settings as django_settings
        target_cname = f"{store.slug}.{django_settings.STORE_DOMAIN}"

        return Response({
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
        })


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

        # Unset other primary domains
        StoreDomain.objects.filter(store_id=pk, is_primary=True).update(is_primary=False)
        domain.is_primary = True
        domain.save(update_fields=["is_primary", "updated_at"])

        self._log_audit(action="store.domain.set_primary", resource_type="store_domain", resource_id=domain.id, new_value={"domain": domain.domain, "is_primary": True})

        return Response({"domain": domain.domain, "is_primary": True})
