"""Migrate existing plaintext tokens to hashed/encrypted format."""

from __future__ import annotations

import hashlib

from django.db import migrations


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def forwards(apps, schema_editor):
    User = apps.get_model("authentication", "User")
    for user in User.objects.all():
        updates = []
        if user.verification_token:
            user.verification_token_hash = hash_token(user.verification_token)
            user.verification_token = ""
            updates.extend(["verification_token", "verification_token_hash"])
        if user.password_reset_token:
            user.password_reset_token_hash = hash_token(user.password_reset_token)
            user.password_reset_token = ""
            updates.extend(["password_reset_token", "password_reset_token_hash"])
        if updates:
            user.save(update_fields=updates)


def reverse(apps, schema_editor):
    User = apps.get_model("authentication", "User")
    User.objects.all().update(
        verification_token="",
        verification_token_hash="",
        password_reset_token="",
        password_reset_token_hash="",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0002_encrypt_tokens_and_hash_lookups"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse),
    ]
