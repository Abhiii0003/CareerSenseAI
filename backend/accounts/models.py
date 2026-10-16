from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    college = models.CharField(max_length=200, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.username


class Resume(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="resumes",
    )
    file = models.FileField(upload_to="resumes/")
    extracted_text = models.TextField(blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.file.name}"


class JobDescription(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_descriptions",
    )
    title = models.CharField(max_length=200, blank=True)
    company = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Job Description'}"


class InterviewQuestion(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="interview_questions",
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="interview_questions",
    )
    job_description = models.ForeignKey(
        JobDescription,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="interview_questions",
    )

    question = models.TextField()

    question_type = models.CharField(
        max_length=50,
        default="technical",
    )

    difficulty = models.CharField(
        max_length=30,
        default="medium",
    )

    # User's interview answer
    answer = models.TextField(
        blank=True,
        default="",
    )

    # Evaluation score out of 10
    score = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # AI-style evaluation feedback
    feedback = models.TextField(
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.question[:50]}"