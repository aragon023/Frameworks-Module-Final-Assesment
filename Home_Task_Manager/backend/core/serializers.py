from rest_framework import serializers
from .models import Task, Member, Category, Pet

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "name", "avatar_url"]

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

    def validate(self, attrs):
        """
        Prevents assigning BOTH a pet and a member at the same time.
        """
        member = attrs.get("assignee_member")
        pet = attrs.get("assignee_pet")

        if member and pet:
            raise serializers.ValidationError(
                "Provide assignee_member OR assignee_pet, not both."
            )

        return attrs