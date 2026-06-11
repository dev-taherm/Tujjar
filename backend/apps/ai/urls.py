from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AIConversationViewSet, AIGenerationViewSet, AIProviderViewSet

router = DefaultRouter()
router.register("providers", AIProviderViewSet, basename="ai-provider")
router.register("conversations", AIConversationViewSet, basename="ai-conversation")
router.register("", AIGenerationViewSet, basename="ai-generation")

urlpatterns = [
    path("", include(router.urls)),
]
