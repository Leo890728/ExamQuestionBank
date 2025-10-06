from django.db import models
from django.conf import settings


class ExamSeries(models.Model):
    """
    考試別 (e.g., 司法官, 律師)
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True, verbose_name="考試名稱")
    code = models.CharField(max_length=32, unique=True, verbose_name="考試代碼")
    description = models.TextField(blank=True, verbose_name="考試描述")
    is_active = models.BooleanField(default=True, verbose_name="啟用狀態")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'exam_series'
        verbose_name = '考試別'
        verbose_name_plural = '考試別'
        ordering = ['code']

    def __str__(self):
        return self.name


class ExamSession(models.Model):
    """
    年度場次 (e.g., 2024年司法官考試)
    """
    id = models.AutoField(primary_key=True)
    exam_series = models.ForeignKey(ExamSeries, on_delete=models.CASCADE, related_name='sessions', verbose_name="考試別")
    year = models.IntegerField(verbose_name="年度")
    session_number = models.IntegerField(default=1, verbose_name="場次")
    exam_date = models.DateField(blank=True, null=True, verbose_name="考試日期")

    description = models.TextField(blank=True, verbose_name="場次說明")
    is_published = models.BooleanField(default=False, verbose_name="已發布")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'exam_sessions'
        verbose_name = '考試場次'
        verbose_name_plural = '考試場次'
        unique_together = [['exam_series', 'year', 'session_number']]
        ordering = ['-year', '-session_number']

    def __str__(self):
        return f"{self.exam_series.name} {self.year}年 第{self.session_number}場"


class Subject(models.Model):
    """
    科目 (e.g., 民法, 刑法, 行政法)
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True, verbose_name="科目名稱")
    code = models.CharField(max_length=32, unique=True, verbose_name="科目代碼")
    description = models.TextField(blank=True, verbose_name="科目描述")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children', verbose_name="上層科目")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'subjects'
        verbose_name = '科目'
        verbose_name_plural = '科目'
        ordering = ['code']

    def __str__(self):
        return self.name