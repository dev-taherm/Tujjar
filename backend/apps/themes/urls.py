from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.ThemeViewSet, basename="theme")

app_name = "themes"

urlpatterns = [
    path(
        "<uuid:theme_pk>/presets/",
        views.ThemePresetViewSet.as_view({"get": "list", "post": "create"}),
        name="theme-preset-list",
    ),
    path(
        "<uuid:theme_pk>/presets/<uuid:pk>/",
        views.ThemePresetViewSet.as_view(
            {"put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="theme-preset-detail",
    ),
    path("", include(router.urls)),
]
