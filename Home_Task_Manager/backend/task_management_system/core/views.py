from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, time
from django.utils.dateparse import parse_date
from django.utils.timezone import make_aware, get_current_timezone
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
from django.db import transaction
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from .permissions import IsNotChild, IsAdmin

from .utils import send_password_reset_email

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import Task, Member, Category, Pet, Household, HouseholdInvite
from .serializers import (
    TaskRowSerializer,
    MemberSerializer,
    TaskSerializer,
    CategorySerializer,
    PetSerializer,
    RegisterSerializer,
    CurrentUserSerializer,
    HouseholdInviteCreateSerializer, 
    HouseholdInviteAcceptSerializer,
)

User = get_user_model()
password_reset_token = PasswordResetTokenGenerator()


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsNotChild]


    def get(self, request):
        qs = Task.objects.filter(household=request.user.household)

        now = timezone.now()
        start_of_week = now - timedelta(days=now.weekday())

        completed_this_week = qs.filter(completed=True, completed_at__gte=start_of_week).count()
        pending_rewards = qs.filter(completed=True).count()

        overdue = qs.filter(completed=False, due_date__lt=now).order_by("due_date")[:10]
        upcoming = qs.filter(completed=False, due_date__gte=now).order_by("due_date")[:10]

        return Response({
            "stats": {
                "completed_this_week": completed_this_week,
                "pending_rewards": pending_rewards,
            },
            "overdue": TaskRowSerializer(overdue, many=True).data,
            "upcoming": TaskRowSerializer(upcoming, many=True).data,
        })


class MembersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Member.objects.filter(household=request.user.household).order_by("name")
        data = MemberSerializer(qs, many=True).data
        return Response(data)


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Member.objects.filter(household=self.request.user.household).order_by("name")

    def perform_create(self, serializer):
        serializer.save(household=self.request.user.household)


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pet.objects.filter(household=self.request.user.household).order_by("name")

    def perform_create(self, serializer):
        serializer.save(household=self.request.user.household)



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
    permission_classes = [IsAuthenticated, IsNotChild]

    def get_queryset(self):
        # Always scope to user's household
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

class GoogleAuthView(APIView):
    """
    POST /api/auth/google/
    Body: { "id_token": "<google-id-token>" }

    Returns:
      { "access": "...", "refresh": "..." }
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        token = request.data.get("id_token")
        if not token:
            return Response({"detail": "id_token required"}, status=status.HTTP_400_BAD_REQUEST)

        if not getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", ""):
            return Response({"detail": "GOOGLE_OAUTH_CLIENT_ID not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 1) Verify Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except Exception:
            return Response({"detail": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        email = (idinfo.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Google token missing email"}, status=status.HTTP_400_BAD_REQUEST)

        # Email Verification
        if idinfo.get("email_verified") is False:
            return Response({"detail": "Google email not verified"}, status=status.HTTP_400_BAD_REQUEST)

        given_name = (idinfo.get("given_name") or "").strip()
        family_name = (idinfo.get("family_name") or "").strip()
        full_name = (idinfo.get("name") or "").strip()

        # 2) Find existing user
        user = User.objects.filter(email__iexact=email).first()

        # 3) Create user + household if new
        if not user:
            household_name = f"{full_name}'s Household" if full_name else f"{email}'s Household"
            household = Household.objects.create(name=household_name)

            # Create user with safe defaults.
            user = User.objects.create(
                email=email,
                username=email,
                first_name=given_name,
                last_name=family_name,
                household=household,
                role="admin",
                auth_provider="google",
            )

        else:
            # Existing user: ensure provider is set correctly
            if getattr(user, "auth_provider", "") != "google":
                user.auth_provider = "google"
                user.save(update_fields=["auth_provider"])

            # Safety: if an old user somehow has no household, create one.
            if getattr(user, "household_id", None) is None:
                household_name = f"{full_name}'s Household" if full_name else f"{email}'s Household"
                user.household = Household.objects.create(name=household_name)
                user.save(update_fields=["household"])

            # Optional: fill names if blank
            update_fields = []
            if hasattr(user, "first_name") and not user.first_name and given_name:
                user.first_name = given_name
                update_fields.append("first_name")
            if hasattr(user, "last_name") and not user.last_name and family_name:
                user.last_name = family_name
                update_fields.append("last_name")
            if update_fields:
                user.save(update_fields=update_fields)

            # Ensure this user has a Member profile in the household
            Member.objects.get_or_create(
                household=user.household,
                user=user,
                defaults={
                    "name": user.get_full_name().strip() or user.username,
                    "avatar_url": "",
                },
            )

        # 4) Issue SimpleJWT tokens
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )

class CalendarTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/calendar/tasks/?start=YYYY-MM-DD&end=YYYY-MM-DD
        Returns tasks overlapping the [start, end) range, household-scoped.
        """
        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")

        if not start_param or not end_param:
            return Response(
                {"detail": "start and end query parameters are required (YYYY-MM-DD)."},
                status=400,
            )

        # Parse as dates (recommended for calendar month/week views)
        start_date = parse_date(start_param)
        end_date = parse_date(end_param)

        if not start_date or not end_date:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD for start and end."},
                status=400,
            )

        tz = get_current_timezone()
        start_dt = make_aware(datetime.combine(start_date, time.min), timezone=tz)
        end_dt = make_aware(datetime.combine(end_date, time.min), timezone=tz)

        # Household scoped
        qs = Task.objects.filter(household=request.user.household)

        # Overlap logic:
        # If start_at exists: task window is [start_at, due_date]
        # Else: treat task as "instant" at due_date
        # Include tasks whose window overlaps [start_dt, end_dt)
        qs = qs.filter(
            Q(start_at__isnull=False, due_date__isnull=False, start_at__lt=end_dt, due_date__gte=start_dt)
            | Q(start_at__isnull=True, due_date__isnull=False, due_date__gte=start_dt, due_date__lt=end_dt)
        ).order_by("due_date")

        data = TaskSerializer(qs, many=True, context={"request": request}).data
        return Response(data)

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

        # This handles uid, token, reset_url, and sending the email
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
    
class HouseholdInviteCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # v1: only admin can invite
        if getattr(request.user, "role", "adult") != "admin":
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        serializer = HouseholdInviteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invite = HouseholdInvite.objects.create(
            household=request.user.household,
            email=serializer.validated_data["email"].lower().strip(),
            role=serializer.validated_data["role"],
        )

        invite_link = f"{settings.FRONTEND_BASE_URL}/invite/accept?token={invite.token}"

        from django.core.mail import send_mail

        email_sent = True
        email_error = None

        try:
            send_mail(
                subject="You’ve been invited to join a household",
                message=f"Accept your invite here: {invite_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invite.email],
                fail_silently=False,
            )
        except Exception as e:
            email_sent = False
            email_error = str(e)

        return Response(
            {
                "detail": "Invite created.",
                "invite_link": invite_link,
                "email_sent": email_sent,
                "email_error": email_error,
            },
            status=status.HTTP_201_CREATED,
        )

        
class HouseholdInviteAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = HouseholdInviteAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        try:
            invite = HouseholdInvite.objects.get(token=token, accepted_at__isnull=True)
        except HouseholdInvite.DoesNotExist:
            return Response({"detail": "Invalid invite."}, status=status.HTTP_404_NOT_FOUND)

        if invite.is_expired():
            return Response({"detail": "Invite expired."}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.email.strip().lower() != invite.email.strip().lower():
            return Response(
                {"detail": "This invite was sent to a different email address."},
                status=status.HTTP_403_FORBIDDEN,
        )


        request.user.household = invite.household
        request.user.role = invite.role
        request.user.save(update_fields=["household", "role"])

        Member.objects.get_or_create(
            household=invite.household,
            user=request.user,
            defaults={
                "name": request.user.get_full_name().strip() or request.user.username,
                "avatar_url": "",
            },
        )


        invite.accepted_at = timezone.now()
        invite.save(update_fields=["accepted_at"])

        return Response({"detail": "Invite accepted."}, status=status.HTTP_200_OK)
    
class HouseholdUserRoleUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id: int):
        role = request.data.get("role")

        if role not in ["admin", "adult", "child"]:
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id, household=request.user.household).first()
        if not user:
            return Response({"detail": "User not found in your household."}, status=status.HTTP_404_NOT_FOUND)

        user.role = role
        user.save(update_fields=["role"])

        return Response({"detail": "Role updated successfully.", "role": user.role})



