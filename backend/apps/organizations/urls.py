from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.OrganizationViewSet, basename="organization")

urlpatterns = [
    path(
        "<uuid:org_pk>/roles/",
        views.RoleViewSet.as_view({"get": "list", "post": "create"}),
        name="role-list",
    ),
    path(
        "<uuid:org_pk>/roles/<uuid:pk>/",
        views.RoleViewSet.as_view({"get": "retrieve", "put": "partial_update", "delete": "destroy"}),
        name="role-detail",
    ),
    path(
        "permissions/",
        views.PermissionViewSet.as_view({"get": "list"}),
        name="permission-list",
    ),
    path("", include(router.urls)),
]
