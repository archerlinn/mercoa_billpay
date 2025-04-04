from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    entity_name = models.CharField(max_length=255, null=True, blank=True)
    entity_logo = models.URLField(null=True, blank=True)
    mercoa_user_id = models.CharField(max_length=100, null=True, blank=True)  # New field

    def __str__(self):
        return f"{self.user.username}'s Profile"
