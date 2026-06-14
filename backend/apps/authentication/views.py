from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.audit.models import log_action

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    ResetPasswordSerializer,
    RequestPasswordResetSerializer,
    TwoFactorLoginSerializer,
    TwoFactorSetupSerializer,
    TwoFactorVerifySerializer,
    UserCreateSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)


class AuthAnonThrottle(AnonRateThrottle):
    rate = "100/hour"


class AuthUserThrottle(UserRateThrottle):
    rate = "1000/hour"


class RegisterView(APIView):
    """Register a new user."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = RefreshToken.for_user(user)
        log_action(
            action="user.register",
            resource_type="user",
            resource_id=user.id,
            user=user,
            new_value={"email": user.email},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """Verify email with token."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Email verified successfully"})


class RequestPasswordResetView(APIView):
    """Request password reset email."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "If the email exists, a reset link has been sent"})


class ResetPasswordView(APIView):
    """Reset password with token."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password reset successfully"})


class TwoFactorSetupView(APIView):
    """Set up 2FA."""

    def post(self, request):
        serializer = TwoFactorSetupSerializer(data={}, context={"request": request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        log_action(
            action="user.2fa.setup",
            resource_type="user",
            resource_id=request.user.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            new_value={"2fa_enabled": True},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(result)


class TwoFactorVerifyView(APIView):
    """Verify 2FA code and enable it."""

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(
            action="user.2fa.enable",
            resource_type="user",
            resource_id=request.user.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            new_value={"2fa_enabled": True},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response({"message": "2FA enabled successfully"})


class TwoFactorDisableView(APIView):
    """Disable 2FA — requires password confirmation."""

    def post(self, request):
        password = request.data.get("password")
        if not password:
            return Response(
                {"detail": "Password is required to disable 2FA."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(password):
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        user.two_factor_enabled = False
        user.two_factor_secret = ""
        user.save(update_fields=["two_factor_enabled", "two_factor_secret"])
        log_action(
            action="user.2fa.disable",
            resource_type="user",
            resource_id=user.id,
            user=user,
            organization_id=getattr(request, "org_id", None),
            new_value={"2fa_enabled": False},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response({"message": "2FA disabled successfully"})


class TwoFactorLoginView(APIView):
    """Complete 2FA verification during login flow."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        serializer = TwoFactorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result)


class UserViewSet(viewsets.ModelViewSet):
    """User profile management — read and update only."""

    serializer_class = UserSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        from rest_framework import status as http_status
        from rest_framework.response import Response

        return Response(
            {"detail": "User creation is not allowed through this endpoint."},
            status=http_status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        from rest_framework import status as http_status
        from rest_framework.response import Response

        return Response(
            {"detail": "User deletion is not allowed through this endpoint."},
            status=http_status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        if request.method == "GET":
            return Response(UserSerializer(request.user).data)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(
            action="user.password.change",
            resource_type="user",
            resource_id=request.user.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response({"message": "Password changed successfully"})


class ThrottledLoginView(APIView):
    """Login endpoint with per-view rate limiting."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        from rest_framework_simplejwt.views import TokenObtainPairView

        from .serializers import CustomTokenObtainPairSerializer

        view = TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer)
        return view(request._request)


class ThrottledTokenRefreshView(APIView):
    """Token refresh endpoint with per-view rate limiting."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def post(self, request):
        from rest_framework_simplejwt.views import TokenRefreshView

        view = TokenRefreshView.as_view()
        return view(request._request)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    """Blacklist refresh token."""
    from rest_framework_simplejwt.exceptions import TokenError

    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except TokenError:
        pass
    except Exception:
        pass
    if request.user and request.user.is_authenticated:
        log_action(
            action="user.logout",
            resource_type="user",
            resource_id=request.user.id,
            user=request.user,
            organization_id=getattr(request, "org_id", None),
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
    return Response({"message": "Logged out successfully"})
