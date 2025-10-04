from django.db import models

# Create your models here.

class Category(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        db_table = "category"


class Subject(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        db_table = "subject"


class QuestionTag(models.Model):
    question = models.ForeignKey("Question", on_delete=models.CASCADE)
    tag = models.ForeignKey("Tag", on_delete=models.CASCADE)

    class Meta:
        db_table = "question_tag"
        unique_together = [["question", "tag"]]


class Question(models.Model):
    id = models.AutoField(primary_key=True)
    content = models.TextField()
    difficulty = models.CharField(max_length=32)
    year = models.IntegerField()

    category = models.ForeignKey("Category", on_delete=models.CASCADE, db_index=True, related_name="questions")
    subject = models.ForeignKey("Subject", on_delete=models.CASCADE, db_index=True, related_name="questions")
    creator = models.ForeignKey("users.User", on_delete=models.CASCADE, db_index=True, related_name="created_questions")

    tags = models.ManyToManyField("Tag", through="QuestionTag", related_name="questions")

    class Meta:
        db_table = "question"


class Option(models.Model):
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey("Question", on_delete=models.CASCADE, db_index=True, related_name="options")
    content = models.TextField()
    is_correct = models.BooleanField(default=False) 

    class Meta:
        db_table = "option"


class Tag(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        db_table = "tag"