from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.PageViewSet, basename="page")

app_name = "pages"

urlpatterns = [
    path("", include(router.urls)),
]
