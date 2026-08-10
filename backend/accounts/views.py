from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from pypdf import PdfReader

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