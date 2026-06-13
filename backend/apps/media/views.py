from __future__ import annotations


from django.db.models import Count, Q, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.audit.models import log_action

from .models import MediaAsset, MediaFolder
from .serializers import (
    MediaAssetSerializer,
    MediaFolderSerializer,
    MediaUploadSerializer,
)
from .services import storage_service


class MediaFolderViewSet(viewsets.ModelViewSet):
    """Folder management for organizing media."""

    serializer_class = MediaFolderSerializer

    def get_queryset(self):
        qs = MediaFolder.objects.select_related("store", "parent").filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        parent = self.request.query_params.get("parent")
        if parent == "null":
            qs = qs.filter(parent__isnull=True)
        elif parent:
            qs = qs.filter(parent_id=parent)
        return qs

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)


class MediaAssetViewSet(viewsets.ModelViewSet):
    """Media asset management with upload support."""

    serializer_class = MediaAssetSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = MediaAsset.objects.select_related("store", "folder").filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        folder_id = self.request.query_params.get("folder")
        if folder_id:
            qs = qs.filter(folder_id=folder_id)
        elif folder_id == "root":
            qs = qs.filter(folder__isnull=True)
        file_type = self.request.query_params.get("file_type")
        if file_type:
            qs = qs.filter(file_type=file_type)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(filename__icontains=search)
                | Q(alt_text__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload a file and create a media asset."""
        upload_serializer = MediaUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)

        file_obj = upload_serializer.validated_data["file"]
        folder_id = upload_serializer.validated_data.get("folder")
        title = upload_serializer.validated_data.get("title", "")
        alt_text = upload_serializer.validated_data.get("alt_text", "")
        store_id = upload_serializer.validated_data.get("store")

        upload_info = storage_service.get_upload_info(file_obj.name)
        storage_path = storage_service.generate_path(
            request.org_id, store_id, folder_id, file_obj.name
        )

        result = storage_service.save_file(file_obj, storage_path)

        asset = MediaAsset.objects.create(
            organization_id=request.org_id,
            store_id=store_id,
            folder_id=folder_id,
            title=title or file_obj.name,
            filename=storage_path.split("/")[-1],
            original_filename=file_obj.name,
            file_type=upload_info["file_type"],
            mime_type=upload_info["mime_type"],
            file_size=file_obj.size,
            file_url=result["url"],
            thumbnail_url=result["url"] if upload_info["file_type"] == "image" else "",
            storage_backend="local",
            storage_path=result["path"],
            alt_text=alt_text,
        )

        log_action(
            action="media.upload",
            resource_type="media",
            resource_id=asset.id,
            organization_id=request.org_id,
            user=request.user,
            new_value=MediaAssetSerializer(asset).data,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(MediaAssetSerializer(asset).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        """Move asset to a different folder."""
        asset = self.get_object()
        folder_id = request.data.get("folder")
        asset.folder_id = folder_id if folder_id else None
        asset.save(update_fields=["folder", "updated_at"])
        return Response(MediaAssetSerializer(asset).data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get media library statistics."""
        qs = MediaAsset.objects.filter(organization_id=request.org_id)
        agg = qs.aggregate(
            total_assets=Count("id"),
            total_size=Sum("file_size"),
        )
        return Response({
            "total_assets": agg["total_assets"],
            "total_images": qs.filter(file_type="image").count(),
            "total_videos": qs.filter(file_type="video").count(),
            "total_documents": qs.filter(file_type="document").count(),
            "total_size": agg["total_size"] or 0,
        })
