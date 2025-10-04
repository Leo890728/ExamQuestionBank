from django.db import models

# Create your models here.


class Exam(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128)
    creator = models.ForeignKey("users.User", on_delete=models.CASCADE, db_index=True, related_name="created_exams")

    questions = models.ManyToManyField("question_bank.Question", through="ExamQuestion", related_name="exams")

    class Meta:
        db_table = "exam"


class ExamQuestion(models.Model):
    exam = models.ForeignKey("Exam", on_delete=models.CASCADE)
    question = models.ForeignKey("question_bank.Question", on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "exam_question"
        unique_together = [["exam", "question"]]