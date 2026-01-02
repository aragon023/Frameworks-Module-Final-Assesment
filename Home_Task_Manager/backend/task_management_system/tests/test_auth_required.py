import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_me_requires_auth():
    client = APIClient()
    res = client.get("/api/me/")
    assert res.status_code == 401
