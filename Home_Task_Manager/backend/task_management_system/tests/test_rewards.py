import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import Household, Task, RewardRedemption

User = get_user_model()


def create_user(household, username, role="adult", points=0):
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="pass12345",
        household=household,
        role=role,
        points_balance=points,
    )


@pytest.mark.django_db
def test_task_completion_adds_points():
    client = APIClient()
    household = Household.objects.create(name="H")
    user = create_user(household, "u1", role="adult")
    task = Task.objects.create(household=household, title="T1", completed=False)

    client.force_authenticate(user=user)
    res = client.patch(f"/api/tasks/{task.id}/", {"completed": True}, format="json")
    assert res.status_code == 200

    user.refresh_from_db()
    assert user.points_balance == 10


@pytest.mark.django_db
def test_task_uncomplete_removes_points():
    client = APIClient()
    household = Household.objects.create(name="H")
    user = create_user(household, "u2", role="adult", points=10)
    task = Task.objects.create(household=household, title="T2", completed=True)

    client.force_authenticate(user=user)
    res = client.patch(f"/api/tasks/{task.id}/", {"completed": False}, format="json")
    assert res.status_code == 200

    user.refresh_from_db()
    assert user.points_balance == 0


@pytest.mark.django_db
def test_child_cannot_redeem():
    client = APIClient()
    household = Household.objects.create(name="H")
    user = create_user(household, "u3", role="child", points=50)

    client.force_authenticate(user=user)
    res = client.post("/api/rewards/redeem/", {"points": 10}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_can_redeem_and_balance_decreases():
    client = APIClient()
    household = Household.objects.create(name="H")
    user = create_user(household, "u4", role="admin", points=60)

    client.force_authenticate(user=user)
    res = client.post("/api/rewards/redeem/", {"points": 50, "note": "Movie night"}, format="json")
    assert res.status_code == 200

    user.refresh_from_db()
    assert user.points_balance == 10
    assert RewardRedemption.objects.filter(user=user, points_redeemed=50).exists()
