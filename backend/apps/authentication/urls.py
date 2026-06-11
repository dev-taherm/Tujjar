from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .serializers import CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    # Public endpoints
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path(
        "password-reset/request/",
        views.RequestPasswordResetView.as_view(),
        name="request-password-reset",
    ),
    path(
        "password-reset/confirm/",
        views.ResetPasswordView.as_view(),
        name="reset-password",
    ),
    # JWT
    path("login/", CustomTokenObtainPairView.as_view(), name="token-obtain"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.logout_view, name="logout"),
    # Protected endpoints
    path("2fa/setup/", views.TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/verify/", views.TwoFactorVerifyView.as_view(), name="2fa-verify"),
    path("2fa/disable/", views.TwoFactorDisableView.as_view(), name="2fa-disable"),
    # User routes
    path("", include(router.urls)),
]
