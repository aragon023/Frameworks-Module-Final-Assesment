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
]
