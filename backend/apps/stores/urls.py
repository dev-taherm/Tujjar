from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.StoreViewSet, basename="store")

app_name = "stores"

urlpatterns = [
    path("check-slug/", views.SlugCheckView.as_view(), name="store-check-slug"),
    path("wizard/", views.StoreWizardView.as_view(), name="store-wizard"),
    path(
        "<uuid:pk>/change-slug/",
        views.StoreSlugChangeView.as_view(),
        name="store-change-slug",
    ),
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
        "<uuid:pk>/domains/<uuid:domain_pk>/verify/",
        views.StoreDomainVerifyView.as_view(),
        name="store-domain-verify",
    ),
    path(
        "<uuid:pk>/domains/<uuid:domain_pk>/instructions/",
        views.StoreDomainInstructionsView.as_view(),
        name="store-domain-instructions",
    ),
    path(
        "<uuid:pk>/domains/<uuid:domain_pk>/primary/",
        views.StoreDomainPrimaryView.as_view(),
        name="store-domain-primary",
    ),
    path(
        "<uuid:pk>/update-settings/",
        views.StoreViewSet.as_view({"patch": "update_settings"}),
        name="store-update-settings",
    ),
    path(
        "<uuid:pk>/set-theme/",
        views.StoreViewSet.as_view({"post": "set_theme"}),
        name="store-set-theme",
    ),
    path("", include(router.urls)),
]
