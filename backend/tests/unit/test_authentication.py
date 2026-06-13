import pytest
from django.test import TestCase
from rest_framework import status

from apps.authentication.models import User


class TestRegister(TestCase):
    def test_register_success(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "securepass123",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "new@example.com")

    def test_register_duplicate_email(self):
        User.objects.create_user(email="existing@example.com", password="pass12345")
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "existing@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "securepass123",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "differentpass",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "123",
                "password_confirm": "123",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestLogin(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", is_verified=True
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "testpass123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "wrongpass"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "nonexistent@example.com", "password": "pass12345"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestUserProfile(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_get_profile(self):
        response = self.client.get(
            "/api/v1/auth/users/me/",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")

    def test_update_profile(self):
        response = self.client.patch(
            "/api/v1/auth/users/me/",
            {"first_name": "Updated"},
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Updated")

    def test_unauthorized_access(self):
        response = self.client.get("/api/v1/auth/users/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
