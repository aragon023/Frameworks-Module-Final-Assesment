import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from core.models import Household

pytestmark = pytest.mark.django_db
User = get_user_model()


def test_google_auth_creates_user_and_household(monkeypatch, settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = "fake-client.apps.googleusercontent.com"

    def fake_verify(token, req, audience):
        assert audience == settings.GOOGLE_OAUTH_CLIENT_ID
        return {
            "email": "new@example.com",
            "email_verified": True,
            "given_name": "New",
            "family_name": "User",
            "name": "New User",
            "sub": "google-sub-123",
        }

    monkeypatch.setattr("core.views.id_token.verify_oauth2_token", fake_verify)

    client = APIClient()
    res = client.post("/api/auth/google/", {"id_token": "fake"}, format="json")

    assert res.status_code == 200
    assert "access" in res.data
    assert "refresh" in res.data

    user = User.objects.get(email="new@example.com")
    assert user.household_id is not None
    assert Household.objects.filter(id=user.household_id).exists()


def test_google_auth_existing_user_preserves_household(monkeypatch, settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = "fake-client.apps.googleusercontent.com"

    hh = Household.objects.create(name="Existing HH")
    user = User.objects.create(email="existing@example.com", username="existing@example.com", household=hh)

    def fake_verify(token, req, audience):
        return {
            "email": "existing@example.com",
            "email_verified": True,
            "given_name": "Existing",
            "family_name": "User",
            "name": "Existing User",
            "sub": "google-sub-456",
        }

    monkeypatch.setattr("core.views.id_token.verify_oauth2_token", fake_verify)

    client = APIClient()
    res = client.post("/api/auth/google/", {"id_token": "fake"}, format="json")

    assert res.status_code == 200
    user.refresh_from_db()
    assert user.household_id == hh.id


def test_google_auth_rejects_unverified_email(monkeypatch, settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = "fake-client.apps.googleusercontent.com"

    def fake_verify(token, req, audience):
        return {"email": "u@example.com", "email_verified": False}

    monkeypatch.setattr("core.views.id_token.verify_oauth2_token", fake_verify)

    client = APIClient()
    res = client.post("/api/auth/google/", {"id_token": "fake"}, format="json")

    assert res.status_code == 400
