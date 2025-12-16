from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import Household

class User(AbstractUser):
    household = models.ForeignKey(
        Household,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users'
    )
