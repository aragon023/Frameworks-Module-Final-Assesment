from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

class Household(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name

class Member(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="member_profile",
    )
    name = models.CharField(max_length=120)
    avatar_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

class Pet(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    species = models.CharField(max_length=40, default='Dog')
    icon = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.species})"

class Category(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
    name = models.CharField(max_length=60)

    def __str__(self):
        return self.name

class Task(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    assignee_member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True)
    assignee_pet = models.ForeignKey(Pet, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=[('low','low'),('med','med'),('high','high')], default='low')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Calendar scheduling (v1)
    start_at = models.DateTimeField(null=True, blank=True)

    # Google Calendar linkage (v1 - nullable)
    google_calendar_id = models.CharField(max_length=255, null=True, blank=True)
    google_event_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    google_last_synced_at = models.DateTimeField(null=True, blank=True)
    google_sync_status = models.CharField(
        max_length=32,
        null=True,
        blank=True,
        help_text="linked | pending | synced | error",
    )
    google_sync_error = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.title


class RewardRedemption(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    points_redeemed = models.IntegerField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id} redeemed {self.points_redeemed}"
    

def invite_expiry_default():
       return timezone.now() + timedelta(days=7)

class HouseholdInvite(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("adult", "Adult"),
        ("child", "Child"),
    ]

    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name="invites")
    email = models.EmailField()
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="adult")

    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=invite_expiry_default)
    accepted_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Invite {self.email} -> {self.household.name}"
