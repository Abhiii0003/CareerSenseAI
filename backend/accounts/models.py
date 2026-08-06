from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    college = models.CharField(max_length=200, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.username