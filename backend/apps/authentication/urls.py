from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "authentication"

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")


urlpatterns = [
    # Public endpoints
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path(
        "verify-email/resend/", views.ResendVerificationView.as_view(), name="resend-verification"
    ),
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
    path("login/", views.ThrottledLoginView.as_view(), name="token-obtain"),
    path("refresh/", views.ThrottledTokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.logout_view, name="logout"),
    # 2FA
    path("2fa/login/", views.TwoFactorLoginView.as_view(), name="2fa-login"),
    path("2fa/login/backup/", views.TwoFactorBackupLoginView.as_view(), name="2fa-login-backup"),
    path("2fa/setup/", views.TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/verify/", views.TwoFactorVerifyView.as_view(), name="2fa-verify"),
    path("2fa/disable/", views.TwoFactorDisableView.as_view(), name="2fa-disable"),
    path("2fa/backup-codes/", views.BackupCodesView.as_view(), name="2fa-backup-codes"),
    # User routes
    path("", include(router.urls)),
]
