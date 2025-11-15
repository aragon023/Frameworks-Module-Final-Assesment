from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardView, MembersListView, TaskViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("members/", MembersListView.as_view(), name="members-list"),
    path("", include(router.urls)),
]
