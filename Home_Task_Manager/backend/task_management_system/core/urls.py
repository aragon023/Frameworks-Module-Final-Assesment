from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardView,
    MembersListView,
    TaskViewSet,
    CategoryViewSet,
    MemberViewSet,
    PetViewSet,
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    MeView,
    ChangePasswordView,
    GoogleAuthView,
    CalendarTasksView,
    HouseholdInviteCreateView,
    HouseholdInviteAcceptView,
    HouseholdUserRoleUpdateView,
    RewardsSummaryView,
    RewardsRedeemView,
)

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"member-items", MemberViewSet, basename="member")
router.register(r"pets", PetViewSet, basename="pet")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("members/", MembersListView.as_view(), name="members-list"),
    path("register/", RegisterView.as_view(), name="register"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("", include(router.urls)),
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("calendar/tasks/", CalendarTasksView.as_view(), name="calendar-tasks"),
    path("rewards/summary/", RewardsSummaryView.as_view(), name="rewards-summary"),
    path("rewards/redeem/", RewardsRedeemView.as_view(), name="rewards-redeem"),
    path("household/invites/", HouseholdInviteCreateView.as_view(), name="household-invite-create"),
    path("household/invites/accept/", HouseholdInviteAcceptView.as_view(), name="household-invite-accept"),
    path("household/users/<int:user_id>/role/", HouseholdUserRoleUpdateView.as_view(), name="household-user-role-update"),
]
