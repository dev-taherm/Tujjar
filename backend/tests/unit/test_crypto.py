from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.authentication.crypto import (
    decrypt_token,
    encrypt_token,
    generate_backup_codes,
    generate_password_reset_token,
    generate_verification_token,
    hash_backup_code,
    hash_token,
    token_is_expired,
    verify_backup_code,
)


class TestEncryptDecryptToken(TestCase):
    def test_encrypt_decrypt_roundtrip(self):
        original = "my-secret-token-123"
        encrypted = encrypt_token(original)
        decrypted = decrypt_token(encrypted)
        assert decrypted == original

    def test_encrypt_empty_returns_empty(self):
        assert encrypt_token("") == ""

    def test_decrypt_empty_returns_empty(self):
        assert decrypt_token("") == ""

    def test_decrypt_garbage_returns_empty(self):
        assert decrypt_token("not-encrypted") == ""

    def test_different_encryptions_differ(self):
        e1 = encrypt_token("token")
        e2 = encrypt_token("token")
        assert e1 != e2


class TestHashToken(TestCase):
    def test_returns_sha256(self):
        result = hash_token("test")
        assert len(result) == 64

    def test_deterministic(self):
        assert hash_token("test") == hash_token("test")

    def test_different_inputs(self):
        assert hash_token("a") != hash_token("b")


class TestGenerateVerificationToken(TestCase):
    def test_returns_tuple(self):
        token, token_hash = generate_verification_token()
        assert isinstance(token, str)
        assert isinstance(token_hash, str)

    def test_hash_matches_token(self):
        token, token_hash = generate_verification_token()
        assert hash_token(token) == token_hash

    def test_unique_tokens(self):
        t1, _ = generate_verification_token()
        t2, _ = generate_verification_token()
        assert t1 != t2


class TestGeneratePasswordResetToken(TestCase):
    def test_returns_tuple(self):
        token, token_hash = generate_password_reset_token()
        assert isinstance(token, str)
        assert isinstance(token_hash, str)

    def test_hash_matches_token(self):
        token, token_hash = generate_password_reset_token()
        assert hash_token(token) == token_hash


class TestGenerateBackupCodes(TestCase):
    def test_default_count(self):
        codes = generate_backup_codes()
        assert len(codes) == 8

    def test_custom_count(self):
        codes = generate_backup_codes(count=4)
        assert len(codes) == 4

    def test_unique_codes(self):
        codes = generate_backup_codes(count=20)
        assert len(set(codes)) == 20

    def test_codes_are_strings(self):
        codes = generate_backup_codes()
        for code in codes:
            assert isinstance(code, str)


class TestHashBackupCode(TestCase):
    def test_returns_sha256(self):
        result = hash_backup_code("ABC123")
        assert len(result) == 64

    def test_deterministic(self):
        assert hash_backup_code("test") == hash_backup_code("test")


class TestVerifyBackupCode(TestCase):
    def test_valid_code_returns_true(self):
        code = "TESTCODE"
        hashed = hash_backup_code(code)
        codes = [hashed, hash_backup_code("OTHER")]
        assert verify_backup_code(code, codes) is True
        assert hashed not in codes

    def test_invalid_code_returns_false(self):
        codes = [hash_backup_code("VALID")]
        assert verify_backup_code("WRONG", codes) is False
        assert len(codes) == 1


class TestTokenIsExpired(TestCase):
    def test_none_not_expired(self):
        assert token_is_expired(None) is False

    def test_past_time_expired(self):
        assert token_is_expired(timezone.now() - timedelta(hours=1)) is True

    def test_future_time_not_expired(self):
        assert token_is_expired(timezone.now() + timedelta(hours=1)) is False
