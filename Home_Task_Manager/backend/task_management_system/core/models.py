from django.db import models

class Household(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name

class Member(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE)
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
