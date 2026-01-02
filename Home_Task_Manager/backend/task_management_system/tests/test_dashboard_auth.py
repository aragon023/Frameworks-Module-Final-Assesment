import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Household

User = get_user_model()

@pytest.mark.django_db
def test_dashboard_requires_auth():
    client = APIClient()
    res = client.get("/api/dashboard/")
    assert res.status_code == 401

@pytest.mark.django_db
def test_dashboard_works_when_authenticated():
    client = APIClient()
    h = Household.objects.create(name="H")
    u = User.objects.create_user(username="u", email="u@e.com", password="pass12345", household=h)
    client.force_authenticate(user=u)

    res = client.get("/api/dashboard/")
    assert res.status_code == 200
    body = res.json()
    assert "stats" in body
    assert "overdue" in body
    assert "upcoming" in body

