from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DashboardView, MembersListView, TaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("members/", MembersListView.as_view(), name="members-list"),
    path("", include(router.urls)),  # /api/tasks/, /api/tasks/<id>/
]
