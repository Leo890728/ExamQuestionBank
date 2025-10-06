from django.db import models
from django.conf import settings
from datetime import timedelta
from django.utils import timezone


class Flashcard(models.Model):
    """
    快閃卡 - 基於間隔重複系統(SRS)
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flashcards', verbose_name="使用者")
    question = models.ForeignKey('question_bank.Question', on_delete=models.CASCADE, related_name='flashcards', verbose_name="題目")

    # SRS (Spaced Repetition System) fields
    ease_factor = models.FloatField(default=2.5, verbose_name="難易度係數")  # SM-2算法
    interval = models.IntegerField(default=1, verbose_name="複習間隔（天）")
    repetitions = models.IntegerField(default=0, verbose_name="重複次數")

    # Review tracking
    next_review_date = models.DateTimeField(default=timezone.now, verbose_name="下次複習時間")
    last_review_date = models.DateTimeField(blank=True, null=True, verbose_name="上次複習時間")
    review_count = models.IntegerField(default=0, verbose_name="複習次數")

    # Performance metrics
    correct_streak = models.IntegerField(default=0, verbose_name="連續答對次數")
    total_correct = models.IntegerField(default=0, verbose_name="總答對次數")
    total_wrong = models.IntegerField(default=0, verbose_name="總答錯次數")

    # Card status
    STATUS_CHOICES = [
        ('new', '新卡片'),
        ('learning', '學習中'),
        ('review', '複習中'),
        ('mastered', '已掌握'),
        ('suspended', '已暫停'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="狀態")

    # Custom fields
    custom_front = models.TextField(blank=True, verbose_name="自訂正面內容")
    custom_back = models.TextField(blank=True, verbose_name="自訂背面內容")
    personal_notes = models.TextField(blank=True, verbose_name="個人筆記")
    tags = models.JSONField(default=list, blank=True, verbose_name="標籤")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'flashcards'
        verbose_name = '快閃卡'
        verbose_name_plural = '快閃卡'
        unique_together = [['user', 'question']]
        indexes = [
            models.Index(fields=['user', 'next_review_date']),
            models.Index(fields=['user', 'status']),
        ]
        ordering = ['next_review_date']

    def __str__(self):
        return f"{self.user.username} - {self.question.question_number}"

    @property
    def is_due(self):
        """檢查是否到期需要複習"""
        return timezone.now() >= self.next_review_date

    @property
    def accuracy_rate(self):
        """計算答對率"""
        total = self.total_correct + self.total_wrong
        if total == 0:
            return 0
        return round((self.total_correct / total) * 100, 2)

    def update_srs(self, quality):
        """
        更新SRS參數（基於SM-2算法）
        quality: 0-5的評分 (0=完全忘記, 5=完美記憶)
        """
        if quality >= 3:
            # 答對
            self.total_correct += 1
            self.correct_streak += 1

            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = int(self.interval * self.ease_factor)

            self.repetitions += 1
            self.ease_factor = max(1.3, self.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

            # Update status
            if self.interval >= 21:
                self.status = 'mastered'
            elif self.interval >= 7:
                self.status = 'review'
            else:
                self.status = 'learning'
        else:
            # 答錯
            self.total_wrong += 1
            self.correct_streak = 0
            self.repetitions = 0
            self.interval = 1
            self.status = 'learning'

        self.last_review_date = timezone.now()
        self.next_review_date = timezone.now() + timedelta(days=self.interval)
        self.review_count += 1


class FlashcardReview(models.Model):
    """
    快閃卡複習紀錄
    """
    id = models.AutoField(primary_key=True)
    flashcard = models.ForeignKey(Flashcard, on_delete=models.CASCADE, related_name='reviews', verbose_name="快閃卡")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flashcard_reviews', verbose_name="使用者")

    # Review result
    quality = models.IntegerField(verbose_name="質量評分")  # 0-5
    time_spent = models.IntegerField(default=0, verbose_name="花費時間（秒）")

    # SRS state at review time
    ease_factor_before = models.FloatField(verbose_name="複習前難易度")
    ease_factor_after = models.FloatField(verbose_name="複習後難易度")
    interval_before = models.IntegerField(verbose_name="複習前間隔")
    interval_after = models.IntegerField(verbose_name="複習後間隔")

    reviewed_at = models.DateTimeField(auto_now_add=True, verbose_name="複習時間")

    class Meta:
        db_table = 'flashcard_reviews'
        verbose_name = '快閃卡複習紀錄'
        verbose_name_plural = '快閃卡複習紀錄'
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"{self.flashcard.user.username} - {self.flashcard.question.question_number} - 評分{self.quality}"


class FlashcardDeck(models.Model):
    """
    快閃卡牌組
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flashcard_decks', verbose_name="使用者")

    name = models.CharField(max_length=256, verbose_name="牌組名稱")
    description = models.TextField(blank=True, verbose_name="牌組描述")
    color = models.CharField(max_length=20, default='#007bff', verbose_name="顏色標籤")

    flashcards = models.ManyToManyField(Flashcard, related_name='decks', blank=True, verbose_name="快閃卡")

    # Settings
    daily_new_cards = models.IntegerField(default=20, verbose_name="每日新卡片數")
    daily_review_limit = models.IntegerField(default=100, verbose_name="每日複習上限")

    is_active = models.BooleanField(default=True, verbose_name="啟用狀態")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        db_table = 'flashcard_decks'
        verbose_name = '快閃卡牌組'
        verbose_name_plural = '快閃卡牌組'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    @property
    def card_count(self):
        """牌組卡片總數"""
        return self.flashcards.count()

    @property
    def due_count(self):
        """今日待複習卡片數"""
        return self.flashcards.filter(next_review_date__lte=timezone.now()).count()
