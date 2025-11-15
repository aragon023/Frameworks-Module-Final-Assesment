from datetime import timedelta

from django.utils import timezone
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets

from .models import Task, Member, Category
from .serializers import (
    TaskRowSerializer,
    MemberSerializer,
    TaskSerializer,
    CategorySerializer,
)


class DashboardView(APIView):
    """
    GET /api/dashboard/?household=<id>

    Returns:
      {
        "stats": { "completed_this_week": int, "pending_rewards": int },
        "overdue": [TaskRow...],
        "upcoming": [TaskRow...]
      }
    """
    def get(self, request):
        household_id = request.query_params.get("household")

        qs = Task.objects.all()
        if household_id:
            qs = qs.filter(household_id=household_id)

        now = timezone.now()
        start_of_week = now - timedelta(days=now.weekday())

        completed_this_week = qs.filter(
            completed=True,
            completed_at__gte=start_of_week
        ).count()

        # Simple placeholder metric: number of completed tasks
        pending_rewards = qs.filter(completed=True).count()

        overdue = qs.filter(
            completed=False,
            due_date__lt=now
        ).order_by('due_date')[:10]

        upcoming = qs.filter(
            completed=False,
            due_date__gte=now
        ).order_by('due_date')[:10]

        return Response({
            "stats": {
                "completed_this_week": completed_this_week,
                "pending_rewards": pending_rewards,
            },
            "overdue": TaskRowSerializer(overdue, many=True).data,
            "upcoming": TaskRowSerializer(upcoming, many=True).data
        })
    
class MembersListView(APIView):
    """
    GET /api/members/?household=<id>
    """
    def get(self, request):
        household_id = request.query_params.get("household")
        qs = Member.objects.all()
        if household_id:
            qs = qs.filter(household_id=household_id)
        data = MemberSerializer(qs.order_by("name"), many=True).data
        return Response(data)

class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD API for tasks.

    Supports filters via query parameters:
      - household: household id
      - search: text in title/description
      - category: category id
      - assignee_member: member id
      - assignee_pet: pet id
      - completed: true/false/1/0
    """
    queryset = Task.objects.all().order_by("-created_at")
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params

        household = p.get("household")
        if household:
            qs = qs.filter(household_id=household)

        search = p.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        category = p.get("category")
        if category:
            qs = qs.filter(category_id=category)

        assignee_member = p.get("assignee_member")
        if assignee_member:
            qs = qs.filter(assignee_member_id=assignee_member)

        assignee_pet = p.get("assignee_pet")
        if assignee_pet:
            qs = qs.filter(assignee_pet_id=assignee_pet)

        completed = p.get("completed")
        if completed is not None:
            value = completed.lower()
            if value in ("1", "true", "yes"):
                qs = qs.filter(completed=True)
            elif value in ("0", "false", "no"):
                qs = qs.filter(completed=False)

        return qs

    def perform_update(self, serializer):
        """
        Automatically stamps completed_at when a task is marked completed.
        """
        was_completed = serializer.instance.completed
        obj = serializer.save()
        from django.utils import timezone as _tz  # local alias to avoid shadowing

        if not was_completed and obj.completed and obj.completed_at is None:
            obj.completed_at = _tz.now()
            obj.save(update_fields=["completed_at"])


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Simple CRUD for categories.
    Currently assigns all new categories to household 1 by default.
    """
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        household = self.request.query_params.get("household")
        if household:
            qs = qs.filter(household_id=household)
        else:
            # For now default to household 1 in lists too (MVP)
            qs = qs.filter(household_id=1)
        return qs

    def perform_create(self, serializer):
        # MVP: always assign to household 1
        serializer.save(household_id=1)
