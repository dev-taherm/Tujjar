from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MediaAssetViewSet, MediaFolderViewSet

router = DefaultRouter()
router.register("folders", MediaFolderViewSet, basename="media-folder")
router.register("assets", MediaAssetViewSet, basename="media-asset")

urlpatterns = [
    path("", include(router.urls)),
]
