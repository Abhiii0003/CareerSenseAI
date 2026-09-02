from django.urls import path

from .views import (
    register,
    profile,
    upload_resume,
    resume_list,
    resume_analysis,
    skill_gap_analysis,
)


urlpatterns = [
    path(
        "register/",
        register,
        name="register",
    ),

    path(
        "profile/",
        profile,
        name="profile",
    ),

    path(
        "resume/upload/",
        upload_resume,
        name="resume-upload",
    ),

    path(
        "resume/",
        resume_list,
        name="resume-list",
    ),

    path(
        "resume/<int:resume_id>/analysis/",
        resume_analysis,
        name="resume-analysis",
    ),


    path(
        "resume/<int:resume_id>/skill-gap/",
        skill_gap_analysis,
        name="skill-gap-analysis",
    ),
]