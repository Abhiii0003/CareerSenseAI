from django.urls import path

from .views import (
    register,
    profile,
    upload_resume,
    resume_list,
    resume_analysis,
    skill_gap_analysis,
    career_roadmap,
    create_job_description,
    job_description_list,
    job_description_match,
    generate_interview_questions,
    interview_question_list,
    evaluate_interview_answer,
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

    path(
        "resume/<int:resume_id>/roadmap/",
        career_roadmap,
        name="career-roadmap",
    ),

    path(
        "jd/create/",
        create_job_description,
        name="job-description-create",
    ),

    path(
        "jd/",
        job_description_list,
        name="job-description-list",
    ),

    path(
        "resume/<int:resume_id>/jd-match/<int:job_id>/",
        job_description_match,
        name="job-description-match",
    ),

    # =========================
    # AI INTERVIEW
    # =========================

    path(
        "interview/generate/",
        generate_interview_questions,
        name="interview-generate",
    ),

    path(
        "interview/questions/",
        interview_question_list,
        name="interview-question-list",
    ),

    path(
        "interview/evaluate/",
        evaluate_interview_answer,
        name="interview-evaluate",
    ),
]