from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TemplateViewSet

app_name = "templates"

router = DefaultRouter()
router.register(r"", TemplateViewSet, basename="template")

urlpatterns = [
    path("", include(router.urls)),
]
