from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    entity_id = models.CharField(max_length=100, blank=True, null=True)
    entity_name = models.CharField(max_length=255, blank=True, null=True)
    entity_logo = models.TextField(blank=True, null=True)  # base64 string or URL

    def __str__(self):
        return f"{self.user.username}'s Profile"
