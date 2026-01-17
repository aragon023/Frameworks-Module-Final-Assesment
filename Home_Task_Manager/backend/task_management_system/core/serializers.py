from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task, Member, Category, Pet, Household, HouseholdInvite

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "household"]
        read_only_fields = ["household"]


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "name", "avatar_url", "user"]
        read_only_fields = ["user"]



class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = ["id", "name", "icon", "household"]
        read_only_fields = ["household"]


class TaskRowSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for the dashboard lists.
    Returns: id, title, due_date, priority, completed, and a computed 'assignee'.
    """
    assignee = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ["id", "title", "due_date", "priority", "completed", "assignee"]

    def get_assignee(self, obj):
        # Prefer member if present; otherwise pet; else None
        if obj.assignee_member_id:
            m = obj.assignee_member
            return {
                "id": m.id,
                "name": m.name,
                "avatar_url": getattr(m, "avatar_url", None),
                "type": "member",
            }
        if obj.assignee_pet_id:
            p = obj.assignee_pet
            return {
                "id": p.id,
                "name": p.name,
                "icon": getattr(p, "icon", None),
                "type": "pet",
            }
        return None


class TaskSerializer(serializers.ModelSerializer):
    """
    Full serializer for creating, updating, and deleting tasks.

    Security:
    - household is read-only and set server-side from request.user.household
    - category / assignee_member / assignee_pet must belong to the same household
    - member and pet CAN both be set
    """

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none(),
        required=False,
        allow_null=True,
    )
    assignee_member = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.none(),
        required=False,
        allow_null=True,
    )
    assignee_pet = serializers.PrimaryKeyRelatedField(
        queryset=Pet.objects.none(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "household",
            "title",
            "description",
            "category",
            "assignee_member",
            "assignee_pet",
            "start_at",
            "due_date",
            "priority",
            "completed",
            "completed_at",
            "created_at",
            "updated_at",
            "google_calendar_id",
            "google_event_id",
            "google_last_synced_at",
            "google_sync_status",
            "google_sync_error",
        ]

        read_only_fields = [
            "id",
            "household",
            "created_at",
            "updated_at",
            "completed_at",

            # keep linkage server-owned
            "google_calendar_id",
            "google_event_id",
            "google_last_synced_at",
            "google_sync_status",
            "google_sync_error",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and getattr(user, "is_authenticated", False) and getattr(user, "household_id", None):
            hh_id = user.household_id
            self.fields["category"].queryset = Category.objects.filter(household_id=hh_id)
            self.fields["assignee_member"].queryset = Member.objects.filter(household_id=hh_id)
            self.fields["assignee_pet"].queryset = Pet.objects.filter(household_id=hh_id)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        household = getattr(user, "household", None)

        if user and getattr(user, "is_authenticated", False) and household is None:
            raise serializers.ValidationError("User is not associated with a household.")

        member = attrs.get("assignee_member")
        pet = attrs.get("assignee_pet")
        category = attrs.get("category")

        # Defense-in-depth: ensure related objects belong to the same household
        if household:
            if category and getattr(category, "household_id", None) != household.id:
                raise serializers.ValidationError({"category": "Category must belong to your household."})

            if member and getattr(member, "household_id", None) != household.id:
                raise serializers.ValidationError({"assignee_member": "Member must belong to your household."})

            if pet and getattr(pet, "household_id", None) != household.id:
                raise serializers.ValidationError({"assignee_pet": "Pet must belong to your household."})

        # Calendar validation: start_at must be <= due_date
        start_at = attrs.get("start_at")
        due_date = attrs.get("due_date")

        # Support PATCH (partial updates): fall back to existing instance values
        if self.instance is not None:
            if start_at is None:
                start_at = getattr(self.instance, "start_at", None)
            if due_date is None:
                due_date = getattr(self.instance, "due_date", None)

        if start_at and due_date and start_at > due_date:
            raise serializers.ValidationError(
                {"start_at": "start_at must be before or equal to due_date."}
            )

        return attrs



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        # 1. Create household
        household = Household.objects.create(
            name=f"{validated_data.get('username')}'s Household"
        )

        # 2. Create user and assign household
        user = User(
            **validated_data,
            household=household
        )
        user.set_password(password)
        user.save()

        return user

class CurrentUserSerializer(serializers.ModelSerializer):
    household = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "household",
        ]
        read_only_fields = ["id"]

    def get_household(self, obj):
        if obj.household:
            return {
                "id": obj.household.id,
                "name": obj.household.name,
            }
        return None

class HouseholdInviteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseholdInvite
        fields = ["id", "email", "role"]

class HouseholdInviteAcceptSerializer(serializers.Serializer):
    token = serializers.UUIDField()