from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import Household

class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("adult", "Adult"),
        ("child", "Child"),
    ]

    household = models.ForeignKey(
        Household,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users"
    )

    role = models.CharField(
        max_length=16,
        choices=ROLE_CHOICES,
        default="adult",
    )
