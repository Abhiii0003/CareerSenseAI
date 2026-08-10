from django.urls import path
from .views import register, profile, upload_resume, resume_list


urlpatterns = [
    path("register/", register, name="register"),
    path("profile/", profile, name="profile"),
    path("resume/upload/", upload_resume, name="resume-upload"),
    path("resume/", resume_list, name="resume-list"),
]