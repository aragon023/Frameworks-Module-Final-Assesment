from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from .utils import send_password_reset_email

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, Member, Category, Pet, Household
from .serializers import (
    TaskRowSerializer,
    MemberSerializer,
    TaskSerializer,
    CategorySerializer,
    PetSerializer,
    RegisterSerializer,
    CurrentUserSerializer,
)

User = get_user_model()
password_reset_token = PasswordResetTokenGenerator()

def get_default_household():
    """
    Ensure there's a default household (pk=1) and return it.
    Adjust defaults if your Household model has extra required fields.
    """
    household, _ = Household.objects.get_or_create(
        pk=1,
        defaults={"name": "Default Household"},
    )
    return household



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


class MemberViewSet(viewsets.ModelViewSet):
    """
    CRUD for members (family).
    Uses /api/member-items/ to avoid clashing with /api/members/ (list-only).
    """
    queryset = Member.objects.all().order_by("name")
    serializer_class = MemberSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        household = self.request.query_params.get("household")
        if household:
            qs = qs.filter(household_id=household)
        else:
            # MVP: default to household 1
            qs = qs.filter(household_id=1)
        return qs

    def perform_create(self, serializer):
        # MVP: assign new members to the default household
        household = get_default_household()
        serializer.save(household=household)



class PetViewSet(viewsets.ModelViewSet):
    """
    CRUD for pets.
    Pets are linked to tasks but not responsible for them.
    """
    queryset = Pet.objects.all().order_by("name")
    serializer_class = PetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        household = self.request.query_params.get("household")
        if household:
            qs = qs.filter(household_id=household)
        else:
            # MVP: default to household 1
            qs = qs.filter(household_id=1)
        return qs

    def perform_create(self, serializer):
        """
        Always create pets in the default household (pk=1).
        """
        household = get_default_household()
        serializer.save(household=household)


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD API for tasks.

    Supports filters via query parameters:
      - search: text in title/description
      - category: category id
      - assignee_member: member id
      - assignee_pet: pet id
      - completed: true/false/1/0

    Household is ALWAYS inferred from the authenticated user.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 🔐 Always scope to user's household
        qs = Task.objects.filter(
            household=self.request.user.household
        ).order_by("-created_at")

        p = self.request.query_params

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

    def perform_create(self, serializer):
        # 🔐 Always assign task to user's household
        serializer.save(
            household=self.request.user.household
        )

    def perform_update(self, serializer):
        """
        Automatically stamps completed_at when a task is marked completed.
        """
        was_completed = serializer.instance.completed
        obj = serializer.save()

        if not was_completed and obj.completed and obj.completed_at is None:
            obj.completed_at = timezone.now()
            obj.save(update_fields=["completed_at"])


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for categories.
    Categories are always scoped to the authenticated user's household.
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(
            household=self.request.user.household
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(
            household=self.request.user.household
        )


class RegisterView(APIView):
    """
    POST /api/register/
    Body: { "username": "...", "email": "...", "password": "..." }
    """

    permission_classes = []  # allow anyone

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"id": user.id, "username": user.username, "email": user.email},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    POST /api/password-reset/
    Body: { "email": "user@example.com" }
    Always returns success to avoid revealing which emails exist.
    """
    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip()

        if not email:
            return Response({"detail": "If this email exists, a reset link will be sent."})

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Do NOT reveal existence of emails
            return Response({"detail": "If this email exists, a reset link will be sent."})

        # This now handles uid, token, reset_url, and sending the email
        send_password_reset_email(user)

        return Response({"detail": "If this email exists, a reset link will be sent."})


class PasswordResetConfirmView(APIView):
    """
    POST /api/password-reset-confirm/
    Body: { "uid": "...", "token": "...", "new_password": "..." }
    """
    permission_classes = []

    def post(self, request):
        uid_b64 = request.data.get("uid", "")
        token = request.data.get("token", "")
        new_password = request.data.get("new_password", "")

        if not uid_b64 or not token or not new_password:
            return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "Invalid token or user."}, status=status.HTTP_400_BAD_REQUEST)

        if not password_reset_token.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password has been reset successfully."})


class MeView(APIView):
    """
    GET/PATCH /api/me/
    - GET: return current user's profile
    - PATCH: update username, email, first_name, last_name
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = CurrentUserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    POST /api/change-password/
    Body: { old_password: "...", new_password: "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")

        if not old_password or not new_password:
            return Response(
                {"detail": "Both old_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(old_password):
            return Response(
                {"detail": "Old password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate new password with Django's validators
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response(
                {"detail": " ".join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password updated successfully."})
