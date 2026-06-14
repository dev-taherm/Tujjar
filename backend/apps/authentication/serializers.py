from __future__ import annotations


from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "phone",
            "is_verified",
            "is_staff",
            "is_superuser",
            "two_factor_enabled",
            "provider",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_verified", "is_staff", "is_superuser", "two_factor_enabled", "provider", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "password", "password_confirm"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        from django.utils.text import slugify

        from apps.organizations.models import Organization, OrganizationMembership, Role

        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        # Generate verification token and store hash
        from .crypto import generate_verification_token

        token, _ = generate_verification_token()
        user.set_verification_token(token)
        user.save(update_fields=["verification_token", "verification_token_hash"])
        # Auto-create organization for the user
        org_name = f"{user.first_name or user.email}'s Organization"
        org = Organization.objects.create(
            name=org_name,
            slug=slugify(org_name) or f"user-{user.id}",
        )
        owner_role = Role.objects.filter(slug="owner", organization=None, is_system=True).first()
        if owner_role:
            OrganizationMembership.objects.create(
                user=user,
                organization=org,
                role=owner_role,
                is_accepted=True,
            )
        # Send verification email
        self._send_verification_email(user, token)
        return user

    def _send_verification_email(self, user: User, token: str) -> None:
        try:
            verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
            send_mail(
                subject="Verify your Tujjar account",
                message=f"Click the link to verify your account: {verify_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer with 2FA check, email verification, and account lockout."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.core.cache import cache

        email = attrs.get("email", "").lower().strip()
        cache_key = f"login_attempts:{email}"
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            raise serializers.ValidationError(
                {"detail": "Account locked due to too many failed attempts. Try again in 15 minutes."}
            )

        try:
            data = super().validate(attrs)
        except serializers.ValidationError:
            cache.set(cache_key, attempts + 1, timeout=900)
            raise

        cache.delete(cache_key)
        user = self.user

        if not user.is_verified:
            raise serializers.ValidationError(
                {"detail": "Email not verified. Please check your inbox."}
            )

        if user.two_factor_enabled:
            import secrets as _secrets

            temp_token = _secrets.token_urlsafe(32)
            from django.core.cache import cache as _cache

            _cache.set(f"2fa_pending:{temp_token}", str(user.id), timeout=60)
            return {
                "requires_2fa": True,
                "two_factor_session_token": temp_token,
                "user": UserSerializer(user).data,
            }

        data["user"] = UserSerializer(user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user_id"] = str(user.id)
        token["email"] = user.email
        token["is_verified"] = user.is_verified
        token["is_staff"] = user.is_staff
        # Include org_id from user's first organization membership
        membership = user.memberships.filter(is_accepted=True).select_related("organization").first()
        if membership:
            token["org_id"] = str(membership.organization.id)
        return token


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Incorrect password")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        # Blacklist all existing refresh tokens for this user
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        OutstandingToken.objects.filter(user=user).delete()
        return user


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            self.user = None
        return value

    def save(self, **kwargs):
        if self.user is None:
            return
        user = self.user
        from .crypto import generate_password_reset_token

        token, _ = generate_password_reset_token()
        user.set_password_reset_token(token)
        user.password_reset_expires = timezone.now() + timezone.timedelta(hours=1)
        user.save(update_fields=[
            "password_reset_token", "password_reset_token_hash", "password_reset_expires",
        ])
        try:
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
            send_mail(
                subject="Reset your Tujjar password",
                message=f"Click the link to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from .crypto import hash_token

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        validate_password(attrs["password"])
        token_hash = hash_token(attrs["token"])
        try:
            user = User.objects.get(
                password_reset_token_hash=token_hash,
                password_reset_expires__gt=timezone.now(),
                is_active=True,
            )
        except User.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired token"})
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.password_reset_token = ""
        user.password_reset_token_hash = ""
        user.password_reset_expires = None
        user.save(update_fields=[
            "password", "password_reset_token", "password_reset_token_hash", "password_reset_expires",
        ])
        return user


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        from .crypto import hash_token

        token_hash = hash_token(value)
        try:
            self.user = User.objects.get(verification_token_hash=token_hash, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        return value

    def save(self, **kwargs):
        self.user.is_verified = True
        self.user.verification_token = ""
        self.user.verification_token_hash = ""
        self.user.save(update_fields=["is_verified", "verification_token", "verification_token_hash"])
        return self.user


class TwoFactorSetupSerializer(serializers.Serializer):
    def validate(self, attrs):
        user = self.context["request"].user
        if user.two_factor_enabled:
            raise serializers.ValidationError("2FA is already enabled")
        return attrs

    def save(self, **kwargs):
        import pyotp

        user = self.context["request"].user
        secret = pyotp.random_base32()
        user.set_two_factor_secret(secret)
        user.save(update_fields=["two_factor_secret"])
        totp = pyotp.TOTP(secret)
        return {
            "secret": secret,
            "provisioning_uri": totp.provisioning_uri(
                name=user.email, issuer_name="Tujjar"
            ),
        }


class TwoFactorVerifySerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_code(self, value):
        import pyotp

        user = self.context["request"].user
        if not user.two_factor_secret:
            raise serializers.ValidationError("2FA is not set up")
        secret = user.get_two_factor_secret()
        totp = pyotp.TOTP(secret)
        if not totp.verify(value):
            raise serializers.ValidationError("Invalid code")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.two_factor_enabled = True
        user.save(update_fields=["two_factor_enabled"])
        return user


class TwoFactorLoginSerializer(serializers.Serializer):
    """Complete 2FA verification during login flow."""

    two_factor_session_token = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        from django.core.cache import cache

        import pyotp

        session_token = attrs["two_factor_session_token"]
        cache_key = f"2fa_pending:{session_token}"
        user_id = cache.get(cache_key)

        if not user_id:
            raise serializers.ValidationError({"two_factor_session_token": "Invalid or expired session"})

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"two_factor_session_token": "Invalid session"})

        if not user.two_factor_secret:
            raise serializers.ValidationError("2FA is not set up")

        secret = user.get_two_factor_secret()
        totp = pyotp.TOTP(secret)
        if not totp.verify(attrs["code"]):
            raise serializers.ValidationError({"code": "Invalid 2FA code"})

        cache.delete(cache_key)
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        from rest_framework_simplejwt.tokens import RefreshToken

        tokens = RefreshToken.for_user(user)
        # Include org_id in access token
        membership = user.memberships.filter(is_accepted=True).select_related("organization").first()
        if membership:
            tokens["org_id"] = str(membership.organization.id)
        return {
            "user": UserSerializer(user).data,
            "tokens": {
                "access": str(tokens.access_token),
                "refresh": str(tokens),
            },
        }
