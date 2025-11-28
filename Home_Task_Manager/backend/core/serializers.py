from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task, Member, Category, Pet

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "household"]
        read_only_fields = ["household"]

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "name", "avatar_url"]

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
    Enforces that you cannot assign both a member and a pet.
    """
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
            "due_date",
            "priority",
            "completed",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    class CurrentUserSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ["id", "username", "email", "first_name", "last_name"]
            read_only_fields = ["id"]



