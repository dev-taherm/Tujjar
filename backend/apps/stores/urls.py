from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.StoreViewSet, basename="store")

app_name = "stores"

urlpatterns = [
    path(
        "<uuid:pk>/domains/",
        views.StoreDomainViewSet.as_view({"get": "list", "post": "create"}),
        name="store-domain-list",
    ),
    path(
        "<uuid:pk>/domains/<uuid:domain_pk>/",
        views.StoreDomainViewSet.as_view({"delete": "destroy"}),
        name="store-domain-detail",
    ),
    path(
        "<uuid:pk>/update-settings/",
        views.StoreViewSet.as_view({"patch": "update_settings"}),
        name="store-update-settings",
    ),
    path("", include(router.urls)),
]
