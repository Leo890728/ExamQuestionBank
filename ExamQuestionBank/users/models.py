from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    email = models.EmailField(unique=True, verbose_name="電子郵件")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="電話")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="頭像")

    # User role
    ROLE_CHOICES = [
        ('student', '學生'),
        ('admin', '管理員'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student', verbose_name="角色")

    # User preferences
    preferred_subjects = models.JSONField(default=list, blank=True, verbose_name="偏好科目")
    study_goal = models.IntegerField(default=50, verbose_name="每日學習目標（題數）")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    last_login_ip = models.GenericIPAddressField(blank=True, null=True, verbose_name="最後登入IP")

    class Meta:
        db_table = 'users'
        verbose_name = '使用者'
        verbose_name_plural = '使用者'

    def __str__(self):
        return f"{self.username} ({self.get_full_name() or self.email})"