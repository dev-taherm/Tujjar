from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "audit"

router = DefaultRouter()
router.register(r"", views.AuditLogViewSet, basename="auditlog")

urlpatterns = [
    path("", include(router.urls)),
]
