from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.search.views import SearchIndexViewSet, SearchQueryViewSet

router = DefaultRouter()
router.register(r"index", SearchIndexViewSet, basename="search-index")
router.register(r"queries", SearchQueryViewSet, basename="search-query")

app_name = "search"

urlpatterns = [
    path("", include(router.urls)),
]
