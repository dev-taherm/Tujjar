from __future__ import annotations

import hashlib
import secrets

from django.conf import settings


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
