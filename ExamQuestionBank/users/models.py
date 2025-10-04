from django.db import models

# Create your models here.


class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128)
    email = models.EmailField(unique=True, max_length=255, db_index=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=32, default="user")

    class Meta:
        db_table = "user"