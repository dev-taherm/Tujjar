from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from apps.core.models import TimeStampedModel


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Custom user model using email as the primary identifier."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, default="")

    # Auth fields — tokens are stored as SHA-256 hashes for secure lookup
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, blank=True, default="")
    verification_token_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    verification_token_expires = models.DateTimeField(null=True, blank=True)
    password_reset_token = models.CharField(max_length=255, blank=True, default="")
    password_reset_token_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)

    # 2FA fields — secret is encrypted at rest with Fernet
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, blank=True, default="")
    backup_codes = models.JSONField(default=list, blank=True)

    # OAuth fields
    provider = models.CharField(max_length=50, blank=True, default="")
    provider_id = models.CharField(max_length=255, blank=True, default="")

    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_organizations(self):
        """Get all organizations this user belongs to."""
        return self.memberships.filter(is_accepted=True).select_related("organization")

    def get_current_organization(self):
        """Get the current active organization."""
        membership = self.memberships.filter(is_accepted=True).first()
        return membership.organization if membership else None

    # --- Token management methods ---

    def set_verification_token(self, token: str) -> None:
        """Store verification token as a SHA-256 hash."""
        from .crypto import hash_token

        self.verification_token = ""
        self.verification_token_hash = hash_token(token)

    def verify_verification_token(self, token: str) -> bool:
        """Check if a token matches the stored hash."""
        from .crypto import hash_token

        return self.verification_token_hash == hash_token(token)

    def set_password_reset_token(self, token: str) -> None:
        """Store password reset token as a SHA-256 hash."""
        from .crypto import hash_token

        self.password_reset_token = ""
        self.password_reset_token_hash = hash_token(token)

    def verify_password_reset_token(self, token: str) -> bool:
        """Check if a token matches the stored hash."""
        from .crypto import hash_token

        return self.password_reset_token_hash == hash_token(token)

    def set_two_factor_secret(self, secret: str) -> None:
        """Encrypt and store 2FA secret."""
        from .crypto import encrypt_token

        self.two_factor_secret = encrypt_token(secret)

    def get_two_factor_secret(self) -> str:
        """Decrypt and return 2FA secret."""
        from .crypto import decrypt_token

        return decrypt_token(self.two_factor_secret)
