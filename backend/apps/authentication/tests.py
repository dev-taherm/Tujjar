import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


class TestRegister:
    def test_register_success(self, client):
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "newuser@example.com",
                "first_name": "New",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "securepass123",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert "tokens" in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == "newuser@example.com"
        assert "access" in response.data["tokens"]
        assert "refresh" in response.data["tokens"]

    def test_register_duplicate_email(self, client, user):
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "securepass123",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, client):
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "mismatch@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "securepass123",
                "password_confirm": "differentpass",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, client):
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": "weak@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "123",
                "password_confirm": "123",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_fields(self, client):
        response = client.post("/api/v1/auth/register/", {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    def test_login_success(self, client, user):
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "testpass123"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert "user" in response.data

    def test_login_wrong_password(self, client, user):
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "wrongpass"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "nonexistent@example.com", "password": "pass12345"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, client):
        response = client.post("/api/v1/auth/login/", {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTokenRefresh:
    def test_token_refresh_success(self, client, auth_tokens):
        response = client.post(
            "/api/v1/auth/refresh/",
            {"refresh": auth_tokens["refresh"]},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_token_refresh_invalid(self, client):
        response = client.post(
            "/api/v1/auth/refresh/",
            {"refresh": "invalid-token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserProfile:
    def test_get_profile(self, client, user, auth_tokens):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
        response = client.get("/api/v1/auth/users/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "test@example.com"
        assert response.data["first_name"] == "Test"
        assert response.data["last_name"] == "User"

    def test_update_profile(self, client, user, auth_tokens):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
        response = client.patch(
            "/api/v1/auth/users/me/",
            {"first_name": "Updated"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"

    def test_unauthorized_access(self, client):
        response = client.get("/api/v1/auth/users/me/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPasswordChange:
    def test_change_password_success(self, client, user, auth_tokens):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
        response = client.post(
            "/api/v1/auth/users/change_password/",
            {"old_password": "testpass123", "new_password": "newsecurepass123"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password("newsecurepass123")

    def test_change_password_wrong_old(self, client, user, auth_tokens):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
        response = client.post(
            "/api/v1/auth/users/change_password/",
            {"old_password": "wrongpass", "new_password": "newsecurepass123"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_weak_new(self, client, user, auth_tokens):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
        response = client.post(
            "/api/v1/auth/users/change_password/",
            {"old_password": "testpass123", "new_password": "123"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
