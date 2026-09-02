from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from pypdf import PdfReader

from .models import Resume

from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    ResumeSerializer,
)


@api_view(["POST"])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        return Response(
            {"message": "User registered successfully"},
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PUT"])
def profile(request):
    user = request.user

    if request.method == "GET":
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    serializer = UserProfileSerializer(
        user,
        data=request.data,
        partial=True,
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
def upload_resume(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = ResumeSerializer(data=request.data)

    if serializer.is_valid():
        resume = serializer.save(user=request.user)

        try:
            reader = PdfReader(resume.file.path)

            extracted_text = ""

            for page in reader.pages:
                page_text = page.extract_text()

                if page_text:
                    extracted_text += page_text + "\n"

            resume.extracted_text = extracted_text.strip()
            resume.save(update_fields=["extracted_text"])

        except Exception as e:
            return Response(
                {
                    "detail": "Resume uploaded, but text extraction failed.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "id": resume.id,
                "file": resume.file.url,
                "uploaded_at": resume.uploaded_at,
                "extracted_text": resume.extracted_text,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
def resume_list(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    resumes = request.user.resumes.all().order_by("-uploaded_at")

    data = []

    for resume in resumes:
        data.append(
            {
                "id": resume.id,
                "file": resume.file.url,
                "uploaded_at": resume.uploaded_at,
                "extracted_text": resume.extracted_text,
            }
        )

    return Response(
        data,
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def resume_analysis(request, resume_id):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        resume = request.user.resumes.get(id=resume_id)

    except Resume.DoesNotExist:
        return Response(
            {"detail": "Resume not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    text = resume.extracted_text.lower()

    skill_keywords = [
        "python",
        "java",
        "javascript",
        "react",
        "django",
        "html",
        "css",
        "sql",
        "mysql",
        "postgresql",
        "mongodb",
        "git",
        "github",
        "machine learning",
        "deep learning",
        "data science",
        "c",
        "c++",
        "android",
        "flutter",
        "aws",
        "docker",
    ]

    found_skills = []

    for skill in skill_keywords:
        if skill in text:
            found_skills.append(skill)

    score = 0

    # Resume content
    if len(text) >= 300:
        score += 20

    if len(text) >= 800:
        score += 10

    # Resume sections
    sections = [
        "education",
        "experience",
        "skills",
        "projects",
        "certifications",
    ]

    for section in sections:
        if section in text:
            score += 8

    # Skills
    skill_score = min(len(found_skills) * 4, 30)
    score += skill_score

    # Contact information
    if "@" in text:
        score += 5

    if any(char.isdigit() for char in text):
        score += 5

    score = min(score, 100)

    return Response(
        {
            "resume_id": resume.id,
            "score": score,
            "skills": found_skills,
            "skill_count": len(found_skills),
            "text_length": len(text),
        },
        status=status.HTTP_200_OK,
    )