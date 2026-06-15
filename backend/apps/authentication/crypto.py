from __future__ import annotations

import hashlib
import secrets

from django.conf import settings
from django.utils import timezone


def _get_fernet():
    """Get or create a Fernet instance for token encryption."""
    from cryptography.fernet import Fernet

    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(__import__("base64").urlsafe_b64encode(key))


def encrypt_token(plaintext: str) -> str:
    """Encrypt a token string using Fernet."""
    if not plaintext:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plaintext.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    """Decrypt a Fernet-encrypted token string."""
    if not ciphertext:
        return ""
    try:
        fernet = _get_fernet()
        return fernet.decrypt(ciphertext.encode()).decode()
    except Exception:
        return ""


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_verification_token() -> tuple[str, str]:
    """Generate a verification token and its hash. Returns (token, hash)."""
    token = secrets.token_urlsafe(48)
    return token, hash_token(token)


def generate_password_reset_token() -> tuple[str, str]:
    """Generate a password reset token and its hash. Returns (token, hash)."""
    token = secrets.token_urlsafe(48)
    return token, hash_token(token)


def generate_backup_codes(count: int = 8) -> list[str]:
    """Generate plaintext backup codes. Returns list of 10-char codes."""
    return [secrets.token_urlsafe(8) for _ in range(count)]


def hash_backup_code(code: str) -> str:
    """Hash a backup code for secure storage."""
    return hashlib.sha256(code.encode()).hexdigest()


def verify_backup_code(plaintext: str, hashed_codes: list[str]) -> bool:
    """Check if plaintext matches any stored hashed backup codes. Returns True if found and removes it."""
    code_hash = hash_backup_code(plaintext)
    if code_hash in hashed_codes:
        hashed_codes.remove(code_hash)
        return True
    return False


def token_is_expired(expires_at) -> bool:
    """Check if a token expiry datetime has passed."""
    if expires_at is None:
        return False
    return timezone.now() > expires_at
