import pytest
from pytest_bdd import scenario, given, when, then, parsers
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
pytestmark = pytest.mark.django_db

from core.models import Household, Task

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def ctx():
    # shared context between steps
    return {}

@scenario("features/household_isolation.feature", "Authenticated user only sees tasks in their own household")
def test_household_isolation():
    pass


@given("two households exist")
def two_households_exist(ctx):
    ctx["h1"] = Household.objects.create(name="Household A")
    ctx["h2"] = Household.objects.create(name="Household B")


@given("a user in household A is authenticated")
def user_in_household_a_is_authenticated(api_client, ctx):
    user = User.objects.create_user(
        username="user_a",
        email="user_a@example.com",
        password="pass12345",
        household=ctx["h1"],
    )

    # force auth without JWT
    api_client.force_authenticate(user=user)

    ctx["user"] = user


@given("tasks exist in both households")
def tasks_exist_in_both_households(ctx):
    Task.objects.create(title="Task A1", household=ctx["h1"])
    Task.objects.create(title="Task A2", household=ctx["h1"])
    Task.objects.create(title="Task B1", household=ctx["h2"])


@when("the user requests the tasks list")
def user_requests_tasks_list(api_client, ctx):
    ctx["response"] = api_client.get("/api/tasks/")


@then("only household A tasks are returned")
def only_household_a_tasks_returned(ctx):
    res = ctx["response"]
    assert res.status_code == 200

    titles = [t["title"] for t in res.json()]
    assert set(titles) == {"Task A1", "Task A2"}
