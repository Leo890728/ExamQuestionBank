from django.db import models
from django.conf import settings
import reversion


@reversion.register()
class QuestionSet(models.Model):
    """
    題組 (一個題組包含多個題目)
    """
    id = models.AutoField(primary_key=True)
    exam_session = models.ForeignKey('exams.ExamSession', on_delete=models.CASCADE, related_name='question_sets', verbose_name="考試場次")
    subject = models.ForeignKey('exams.Subject', on_delete=models.CASCADE, related_name='question_sets', verbose_name="科目")

    title = models.CharField(max_length=512, blank=True, verbose_name="題組標題")
    description = models.TextField(blank=True, verbose_name="題組描述/題幹")
    order = models.IntegerField(default=0, verbose_name="題組順序")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_question_sets', verbose_name="建立者")

    class Meta:
        db_table = 'question_sets'
        verbose_name = '題組'
        verbose_name_plural = '題組'
        ordering = ['exam_session', 'order']

    def __str__(self):
        return f"{self.exam_session} - {self.title or f'題組{self.order}'}"


@reversion.register()
class Question(models.Model):
    """
    題目主體
    """
    DIFFICULTY_CHOICES = [
        ('easy', '簡單'),
        ('medium', '中等'),
        ('hard', '困難'),
    ]

    TYPE_CHOICES = [
        ('single', '單選題'),
        ('multiple', '複選題'),
        ('essay', '申論題'),
        ('truefalse', '是非題'),
    ]

    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('review', '待審核'),
        ('published', '已發布'),
        ('archived', '已封存'),
    ]

    id = models.AutoField(primary_key=True)
    question_set = models.ForeignKey(QuestionSet, on_delete=models.CASCADE, blank=True, null=True, related_name='questions', verbose_name="所屬題組")
    exam_session = models.ForeignKey('exams.ExamSession', on_delete=models.CASCADE, related_name='questions', verbose_name="考試場次")
    subject = models.ForeignKey('exams.Subject', on_delete=models.CASCADE, related_name='questions', verbose_name="科目")

    # Question content
    question_number = models.CharField(max_length=32, verbose_name="題號")
    content = models.TextField(verbose_name="題目內容")
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='single', verbose_name="題型")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium', verbose_name="難度")
    points = models.IntegerField(default=1, verbose_name="配分")

    # Analysis and explanation
    analysis = models.TextField(blank=True, verbose_name="解析")
    answer_explanation = models.TextField(blank=True, verbose_name="答案說明")

    # Source tracking
    source_file = models.CharField(max_length=512, blank=True, verbose_name="來源檔案")
    source_page = models.IntegerField(blank=True, null=True, verbose_name="來源頁碼")
    source_url = models.URLField(blank=True, verbose_name="來源網址")

    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="狀態")
    is_public = models.BooleanField(default=True, verbose_name="公開")
    view_count = models.IntegerField(default=0, verbose_name="瀏覽次數")
    attempt_count = models.IntegerField(default=0, verbose_name="作答次數")
    correct_count = models.IntegerField(default=0, verbose_name="答對次數")

    # Version control
    version = models.IntegerField(default=1, verbose_name="版本")

    # Timestamps and user tracking
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    published_at = models.DateTimeField(blank=True, null=True, verbose_name="發布時間")
    deleted_at = models.DateTimeField(blank=True, null=True, verbose_name="刪除時間")

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_questions', verbose_name="建立者")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_questions', verbose_name="更新者")

    class Meta:
        db_table = 'questions'
        verbose_name = '題目'
        verbose_name_plural = '題目'
        indexes = [
            models.Index(fields=['exam_session', 'subject']),
            models.Index(fields=['status', 'is_public']),
            models.Index(fields=['difficulty']),
        ]
        ordering = ['exam_session', 'question_number']

    def __str__(self):
        return f"{self.question_number} - {self.content[:50]}"

    @property
    def accuracy_rate(self):
        """計算答對率"""
        if self.attempt_count == 0:
            return 0
        return round((self.correct_count / self.attempt_count) * 100, 2)


class QuestionOption(models.Model):
    """
    題目選項 (選擇題用)
    """
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options', verbose_name="題目")

    option_label = models.CharField(max_length=10, verbose_name="選項標籤")  # A, B, C, D
    content = models.TextField(verbose_name="選項內容")
    is_correct = models.BooleanField(default=False, verbose_name="是否為正確答案")
    order = models.IntegerField(default=0, verbose_name="選項順序")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'question_options'
        verbose_name = '題目選項'
        verbose_name_plural = '題目選項'
        ordering = ['question', 'order']
        unique_together = [['question', 'option_label']]

    def __str__(self):
        return f"{self.question.question_number} - 選項{self.option_label}"


class QuestionTag(models.Model):
    """
    題目標籤 (關鍵字、法條等)
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True, verbose_name="標籤名稱")
    category = models.CharField(max_length=64, blank=True, verbose_name="標籤分類")  # 法條、概念、重點等
    description = models.TextField(blank=True, verbose_name="標籤說明")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    class Meta:
        db_table = 'question_tags'
        verbose_name = '題目標籤'
        verbose_name_plural = '題目標籤'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.category}: {self.name}" if self.category else self.name


class QuestionTagRelation(models.Model):
    """
    題目與標籤關聯
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='tag_relations', verbose_name="題目")
    tag = models.ForeignKey(QuestionTag, on_delete=models.CASCADE, related_name='question_relations', verbose_name="標籤")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="建立者")

    class Meta:
        db_table = 'question_tag_relations'
        verbose_name = '題目標籤關聯'
        verbose_name_plural = '題目標籤關聯'
        unique_together = [['question', 'tag']]


class QuestionAttempt(models.Model):
    """
    作答紀錄
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_attempts', verbose_name="使用者")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempts', verbose_name="題目")

    # Attempt details
    selected_options = models.JSONField(default=list, verbose_name="選擇的選項")  # List of option IDs
    answer_text = models.TextField(blank=True, verbose_name="作答文字")  # For essay questions
    is_correct = models.BooleanField(default=False, verbose_name="是否正確")
    time_spent = models.IntegerField(default=0, verbose_name="作答時間（秒）")

    # Context
    practice_session = models.ForeignKey('PracticeSession', on_delete=models.SET_NULL, blank=True, null=True, related_name='attempts', verbose_name="練習場次")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作答時間")

    class Meta:
        db_table = 'question_attempts'
        verbose_name = '作答紀錄'
        verbose_name_plural = '作答紀錄'
        indexes = [
            models.Index(fields=['user', 'question']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.question.question_number} ({'正確' if self.is_correct else '錯誤'})"


class QuestionNote(models.Model):
    """
    題目筆記
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_notes', verbose_name="使用者")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='notes', verbose_name="題目")

    content = models.TextField(verbose_name="筆記內容")
    is_private = models.BooleanField(default=True, verbose_name="私人筆記")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'question_notes'
        verbose_name = '題目筆記'
        verbose_name_plural = '題目筆記'
        unique_together = [['user', 'question']]

    def __str__(self):
        return f"{self.user.username} - {self.question.question_number}"


class QuestionBookmark(models.Model):
    """
    題目收藏
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_bookmarks', verbose_name="使用者")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bookmarks', verbose_name="題目")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="收藏時間")

    class Meta:
        db_table = 'question_bookmarks'
        verbose_name = '題目收藏'
        verbose_name_plural = '題目收藏'
        unique_together = [['user', 'question']]

    def __str__(self):
        return f"{self.user.username} - {self.question.question_number}"


class PracticeSession(models.Model):
    """
    練習場次
    """
    MODE_CHOICES = [
        ('historical', '歷屆考題'),
        ('simulation', '模擬考試'),
        ('mixed', '混合練習'),
        ('bookmarked', '收藏題庫'),
        ('wrong', '錯題本'),
    ]

    STATUS_CHOICES = [
        ('in_progress', '進行中'),
        ('completed', '已完成'),
        ('abandoned', '已放棄'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_sessions', verbose_name="使用者")

    mode = models.CharField(max_length=20, choices=MODE_CHOICES, verbose_name="練習模式")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress', verbose_name="狀態")

    # Configuration
    total_questions = models.IntegerField(verbose_name="題目總數")
    answered_questions = models.IntegerField(default=0, verbose_name="已答題數")
    correct_answers = models.IntegerField(default=0, verbose_name="答對題數")

    # Filters used
    exam_session = models.ForeignKey('exams.ExamSession', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="考試場次")
    subject = models.ForeignKey('exams.Subject', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="科目")
    difficulty = models.CharField(max_length=20, blank=True, verbose_name="難度")

    # Timing
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="開始時間")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="完成時間")
    total_time_spent = models.IntegerField(default=0, verbose_name="總花費時間（秒）")

    class Meta:
        db_table = 'practice_sessions'
        verbose_name = '練習場次'
        verbose_name_plural = '練習場次'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_mode_display()} ({self.started_at.strftime('%Y-%m-%d')})"

    @property
    def accuracy_rate(self):
        """計算答對率"""
        if self.answered_questions == 0:
            return 0
        return round((self.correct_answers / self.answered_questions) * 100, 2)


class ImportJob(models.Model):
    """
    題庫匯入工作
    """
    STATUS_CHOICES = [
        ('pending', '等待中'),
        ('processing', '處理中'),
        ('completed', '已完成'),
        ('failed', '失敗'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="匯入者")

    file_name = models.CharField(max_length=512, verbose_name="檔案名稱")
    file_path = models.CharField(max_length=1024, verbose_name="檔案路徑")
    file_type = models.CharField(max_length=32, verbose_name="檔案類型")  # json, csv, excel, pdf

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="狀態")
    total_items = models.IntegerField(default=0, verbose_name="總項目數")
    processed_items = models.IntegerField(default=0, verbose_name="已處理項目數")
    success_items = models.IntegerField(default=0, verbose_name="成功項目數")
    failed_items = models.IntegerField(default=0, verbose_name="失敗項目數")

    error_log = models.TextField(blank=True, verbose_name="錯誤日誌")
    result_summary = models.JSONField(default=dict, blank=True, verbose_name="結果摘要")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    started_at = models.DateTimeField(blank=True, null=True, verbose_name="開始時間")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="完成時間")

    class Meta:
        db_table = 'import_jobs'
        verbose_name = '匯入工作'
        verbose_name_plural = '匯入工作'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} - {self.get_status_display()}"
