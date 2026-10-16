from django.db import models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from pypdf import PdfReader

from .models import Resume, JobDescription, InterviewQuestion

from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    ResumeSerializer,
    JobDescriptionSerializer,
    InterviewQuestionSerializer,
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

    text = (resume.extracted_text or "").lower()

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

    if len(text) >= 300:
        score += 20

    if len(text) >= 800:
        score += 10

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

    skill_score = min(len(found_skills) * 4, 30)
    score += skill_score

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


@api_view(["GET"])
def skill_gap_analysis(request, resume_id):
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

    role = request.GET.get("role", "").strip().lower()

    role_skills = {
        "java-developer": [
            "java",
            "sql",
            "git",
            "spring boot",
            "hibernate",
            "rest api",
            "junit",
        ],
        "python-developer": [
            "python",
            "sql",
            "git",
            "django",
            "rest api",
            "flask",
            "pytest",
        ],
        "frontend-developer": [
            "html",
            "css",
            "javascript",
            "react",
            "git",
            "typescript",
            "rest api",
        ],
        "data-analyst": [
            "python",
            "sql",
            "excel",
            "pandas",
            "numpy",
            "data visualization",
            "power bi",
        ],
        "machine-learning-engineer": [
            "python",
            "sql",
            "machine learning",
            "deep learning",
            "numpy",
            "pandas",
            "scikit-learn",
        ],
    }

    role_names = {
        "java-developer": "Java Developer",
        "python-developer": "Python Developer",
        "frontend-developer": "Frontend Developer",
        "data-analyst": "Data Analyst",
        "machine-learning-engineer": "Machine Learning Engineer",
    }

    if role not in role_skills:
        return Response(
            {
                "detail": "Invalid role.",
                "available_roles": list(role_names.keys()),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    resume_text = (resume.extracted_text or "").lower()

    matched_skills = []
    missing_skills = []

    for skill in role_skills[role]:
        if skill in resume_text:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    total_skills = len(role_skills[role])

    match_percentage = round(
        (len(matched_skills) / total_skills) * 100
    )

    return Response(
        {
            "resume_id": resume.id,
            "role": role_names[role],
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_percentage": match_percentage,
            "total_required_skills": total_skills,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def career_roadmap(request, resume_id):
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

    role = request.GET.get("role", "").strip().lower()

    roadmap_data = {
        "java-developer": {
            "name": "Java Developer",
            "description": "Build strong backend development and enterprise Java skills.",
            "steps": [
                {
                    "step": 1,
                    "title": "Java Core",
                    "skills": ["Java", "OOP", "Collections", "Exception Handling"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 2,
                    "title": "Git & GitHub",
                    "skills": ["Git", "GitHub", "Branching", "Pull Requests"],
                    "duration": "3-5 days",
                },
                {
                    "step": 3,
                    "title": "Spring Boot",
                    "skills": ["Spring Boot", "REST API", "Dependency Injection"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 4,
                    "title": "Hibernate & Database",
                    "skills": ["Hibernate", "JPA", "SQL", "MySQL"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 5,
                    "title": "Testing",
                    "skills": ["JUnit", "Unit Testing", "API Testing"],
                    "duration": "1 week",
                },
                {
                    "step": 6,
                    "title": "Build a Real Project",
                    "skills": ["Backend Architecture", "Authentication", "Deployment"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 7,
                    "title": "Interview Preparation",
                    "skills": ["DSA", "Java Interview", "SQL", "System Basics"],
                    "duration": "2 weeks",
                },
            ],
        },
        "python-developer": {
            "name": "Python Developer",
            "description": "Master Python backend development and production-ready APIs.",
            "steps": [
                {
                    "step": 1,
                    "title": "Python Fundamentals",
                    "skills": ["Python", "OOP", "Data Structures"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 2,
                    "title": "Git & GitHub",
                    "skills": ["Git", "GitHub", "Branching"],
                    "duration": "3-5 days",
                },
                {
                    "step": 3,
                    "title": "Django / Flask",
                    "skills": ["Django", "Flask", "Routing", "Authentication"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 4,
                    "title": "REST APIs",
                    "skills": ["REST API", "JSON", "HTTP", "JWT"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 5,
                    "title": "Testing",
                    "skills": ["Pytest", "Unit Testing", "API Testing"],
                    "duration": "1 week",
                },
                {
                    "step": 6,
                    "title": "Build a Production Project",
                    "skills": ["Database", "Authentication", "Deployment"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 7,
                    "title": "Interview Preparation",
                    "skills": ["Python", "DSA", "SQL", "Backend Concepts"],
                    "duration": "2 weeks",
                },
            ],
        },
        "frontend-developer": {
            "name": "Frontend Developer",
            "description": "Create modern, responsive and production-ready web applications.",
            "steps": [
                {
                    "step": 1,
                    "title": "Web Fundamentals",
                    "skills": ["HTML", "CSS", "Responsive Design"],
                    "duration": "1 week",
                },
                {
                    "step": 2,
                    "title": "JavaScript",
                    "skills": ["JavaScript", "ES6+", "DOM", "Async Programming"],
                    "duration": "2 weeks",
                },
                {
                    "step": 3,
                    "title": "React",
                    "skills": ["React", "Hooks", "Components", "State Management"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 4,
                    "title": "Git & APIs",
                    "skills": ["Git", "GitHub", "REST API", "JSON"],
                    "duration": "1 week",
                },
                {
                    "step": 5,
                    "title": "TypeScript",
                    "skills": ["TypeScript", "Types", "Interfaces"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 6,
                    "title": "Build Portfolio Projects",
                    "skills": ["React", "API Integration", "Responsive UI"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 7,
                    "title": "Interview Preparation",
                    "skills": ["JavaScript", "React", "DSA", "Web Fundamentals"],
                    "duration": "2 weeks",
                },
            ],
        },
        "data-analyst": {
            "name": "Data Analyst",
            "description": "Develop strong analytical, visualization and business intelligence skills.",
            "steps": [
                {
                    "step": 1,
                    "title": "SQL Fundamentals",
                    "skills": ["SQL", "Joins", "Subqueries", "Aggregations"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 2,
                    "title": "Excel",
                    "skills": ["Excel", "Pivot Tables", "Lookups", "Charts"],
                    "duration": "1 week",
                },
                {
                    "step": 3,
                    "title": "Python for Data",
                    "skills": ["Python", "Pandas", "NumPy"],
                    "duration": "2 weeks",
                },
                {
                    "step": 4,
                    "title": "Data Visualization",
                    "skills": ["Data Visualization", "Charts", "Dashboards"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 5,
                    "title": "Power BI",
                    "skills": ["Power BI", "DAX", "Dashboard Design"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 6,
                    "title": "Build Data Projects",
                    "skills": ["Data Cleaning", "EDA", "Visualization"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 7,
                    "title": "Interview Preparation",
                    "skills": ["SQL", "Excel", "Statistics", "Case Studies"],
                    "duration": "2 weeks",
                },
            ],
        },
        "machine-learning-engineer": {
            "name": "Machine Learning Engineer",
            "description": "Build practical machine learning systems from data preparation to deployment.",
            "steps": [
                {
                    "step": 1,
                    "title": "Python for ML",
                    "skills": ["Python", "NumPy", "Pandas"],
                    "duration": "2 weeks",
                },
                {
                    "step": 2,
                    "title": "Machine Learning",
                    "skills": ["Machine Learning", "Regression", "Classification"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 3,
                    "title": "Data Processing",
                    "skills": ["Pandas", "NumPy", "Data Cleaning", "Feature Engineering"],
                    "duration": "1-2 weeks",
                },
                {
                    "step": 4,
                    "title": "Scikit-learn",
                    "skills": ["Scikit-learn", "Model Training", "Evaluation"],
                    "duration": "2 weeks",
                },
                {
                    "step": 5,
                    "title": "Deep Learning",
                    "skills": ["Deep Learning", "Neural Networks", "Model Optimization"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 6,
                    "title": "Build ML Projects",
                    "skills": ["ML Pipeline", "Deployment", "Model Serving"],
                    "duration": "2-3 weeks",
                },
                {
                    "step": 7,
                    "title": "Interview Preparation",
                    "skills": ["ML Concepts", "Python", "Statistics", "DSA"],
                    "duration": "2 weeks",
                },
            ],
        },
    }

    if role not in roadmap_data:
        return Response(
            {
                "detail": "Invalid role.",
                "available_roles": list(roadmap_data.keys()),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    roadmap = roadmap_data[role]

    resume_text = (resume.extracted_text or "").lower()

    completed_steps = 0
    personalized_steps = []

    for item in roadmap["steps"]:
        step_skills = item["skills"]

        matched = [
            skill
            for skill in step_skills
            if skill.lower() in resume_text
        ]

        missing = [
            skill
            for skill in step_skills
            if skill.lower() not in resume_text
        ]

        if not missing:
            status_name = "completed"
            completed_steps += 1

        elif matched:
            status_name = "in-progress"

        else:
            status_name = "recommended"

        personalized_steps.append(
            {
                **item,
                "status": status_name,
                "matched_skills": matched,
                "missing_skills": missing,
            }
        )

    completion_percentage = round(
        (completed_steps / len(roadmap["steps"])) * 100
    )

    return Response(
        {
            "resume_id": resume.id,
            "role": roadmap["name"],
            "description": roadmap["description"],
            "completion_percentage": completion_percentage,
            "completed_steps": completed_steps,
            "total_steps": len(roadmap["steps"]),
            "steps": personalized_steps,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def create_job_description(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = JobDescriptionSerializer(data=request.data)

    if serializer.is_valid():
        job_description = serializer.save(user=request.user)

        return Response(
            {
                "id": job_description.id,
                "title": job_description.title,
                "company": job_description.company,
                "description": job_description.description,
                "created_at": job_description.created_at,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
def job_description_list(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    job_descriptions = request.user.job_descriptions.all().order_by(
        "-created_at"
    )

    serializer = JobDescriptionSerializer(
        job_descriptions,
        many=True,
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def job_description_match(request, resume_id, job_id):
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

    try:
        job_description = request.user.job_descriptions.get(id=job_id)

    except JobDescription.DoesNotExist:
        return Response(
            {"detail": "Job description not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    resume_text = (resume.extracted_text or "").lower()
    jd_text = (job_description.description or "").lower()

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
        "spring boot",
        "hibernate",
        "rest api",
        "docker",
        "aws",
        "machine learning",
        "deep learning",
        "data science",
        "pandas",
        "numpy",
        "scikit-learn",
        "typescript",
        "flutter",
        "android",
        "c",
        "c++",
    ]

    jd_skills = []
    matched_skills = []
    missing_skills = []

    for skill in skill_keywords:
        if skill in jd_text:
            jd_skills.append(skill)

            if skill in resume_text:
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

    if len(jd_skills) > 0:
        match_percentage = round(
            (len(matched_skills) / len(jd_skills)) * 100
        )
    else:
        match_percentage = 0

    return Response(
        {
            "resume_id": resume.id,
            "job_id": job_description.id,
            "job_title": job_description.title,
            "company": job_description.company,
            "match_percentage": match_percentage,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "required_skills": jd_skills,
            "total_required_skills": len(jd_skills),
            "matched_skill_count": len(matched_skills),
            "missing_skill_count": len(missing_skills),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def generate_interview_questions(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    resume_id = request.data.get("resume_id")
    job_id = request.data.get("job_id")

    question_type = str(
        request.data.get("question_type", "mixed")
    ).strip().lower()

    difficulty = str(
        request.data.get("difficulty", "medium")
    ).strip().lower()

    try:
        question_count = int(
            request.data.get(
                "question_count",
                request.data.get("count", 5),
            )
        )
    except (TypeError, ValueError):
        question_count = 5

    question_count = max(
        1,
        min(question_count, 15),
    )

    allowed_types = [
        "technical",
        "hr",
        "mixed",
    ]

    allowed_difficulties = [
        "easy",
        "medium",
        "hard",
    ]

    if question_type not in allowed_types:
        return Response(
            {
                "detail": "Invalid question_type.",
                "available_types": allowed_types,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if difficulty not in allowed_difficulties:
        return Response(
            {
                "detail": "Invalid difficulty.",
                "available_difficulties": allowed_difficulties,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not resume_id:
        return Response(
            {"detail": "resume_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resume = request.user.resumes.get(id=resume_id)

    except Resume.DoesNotExist:
        return Response(
            {"detail": "Resume not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    job_description = None

    if job_id:
        try:
            job_description = request.user.job_descriptions.get(
                id=job_id
            )

        except JobDescription.DoesNotExist:
            return Response(
                {"detail": "Job description not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    resume_text = (
        resume.extracted_text or ""
    ).lower()

    jd_text = (
        (job_description.description or "").lower()
        if job_description
        else ""
    )

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
        "spring boot",
        "hibernate",
        "rest api",
        "docker",
        "aws",
        "machine learning",
        "deep learning",
        "data science",
        "pandas",
        "numpy",
        "scikit-learn",
        "typescript",
        "flutter",
        "android",
        "c",
        "c++",
    ]

    resume_skills = [
        skill
        for skill in skill_keywords
        if skill in resume_text
    ]

    jd_skills = [
        skill
        for skill in skill_keywords
        if skill in jd_text
    ]

    matched_jd_skills = [
        skill
        for skill in jd_skills
        if skill in resume_text
    ]

    missing_jd_skills = [
        skill
        for skill in jd_skills
        if skill not in resume_text
    ]

    technical_templates = {
        "easy": [
            "What is {skill}, and where have you used it in your projects?",
            "Can you explain the basic concepts of {skill}?",
            "Why is {skill} useful in software development?",
        ],
        "medium": [
            "How would you use {skill} in a real-world application?",
            "What are the important concepts of {skill} that an entry-level developer should know?",
            "Describe a practical problem you can solve using {skill}.",
        ],
        "hard": [
            "What are the common challenges when using {skill} in a production application, and how would you handle them?",
            "How would you optimize or troubleshoot a system built using {skill}?",
            "Explain the design or architectural considerations you would make when using {skill} in a large application.",
        ],
    }

    hr_questions = [
        "Tell me about yourself and your technical background.",
        "Walk me through your most important project.",
        "Why are you interested in this role?",
        "What was the most difficult problem you solved in a project?",
        "Tell me about a time you had to learn a new technology quickly.",
        "How do you handle a situation when your code does not work as expected?",
        "What are your strengths as a software developer?",
        "What technical skill are you currently working to improve?",
    ]

    generated_questions = []

    def add_technical_question(skill, template_index):
        templates = technical_templates[difficulty]

        template = templates[
            template_index % len(templates)
        ]

        generated_questions.append(
            {
                "question": template.format(
                    skill=skill.title()
                ),
                "question_type": "technical",
                "difficulty": difficulty,
            }
        )

    if question_type == "technical":

        technical_skills = (
            jd_skills
            or resume_skills
            or ["software development"]
        )

        for index in range(question_count):

            skill = technical_skills[
                index % len(technical_skills)
            ]

            add_technical_question(
                skill,
                index,
            )

    elif question_type == "hr":

        for index in range(question_count):

            question = hr_questions[
                index % len(hr_questions)
            ]

            generated_questions.append(
                {
                    "question": question,
                    "question_type": "hr",
                    "difficulty": difficulty,
                }
            )

    elif question_type == "mixed":

        technical_count = (
            question_count + 1
        ) // 2

        hr_count = (
            question_count - technical_count
        )

        technical_skills = (
            jd_skills
            or resume_skills
            or ["software development"]
        )

        for index in range(technical_count):

            skill = technical_skills[
                index % len(technical_skills)
            ]

            add_technical_question(
                skill,
                index,
            )

        for index in range(hr_count):

            question = hr_questions[
                index % len(hr_questions)
            ]

            generated_questions.append(
                {
                    "question": question,
                    "question_type": "hr",
                    "difficulty": difficulty,
                }
            )

    saved_questions = []

    for item in generated_questions:

        interview_question = InterviewQuestion.objects.create(
            user=request.user,
            resume=resume,
            job_description=job_description,
            question=item["question"],
            question_type=item["question_type"],
            difficulty=item["difficulty"],
        )

        saved_questions.append(
            interview_question
        )

    serializer = InterviewQuestionSerializer(
        saved_questions,
        many=True,
    )

    return Response(
        {
            "resume_id": resume.id,
            "job_id": (
                job_description.id
                if job_description
                else None
            ),
            "question_type": question_type,
            "difficulty": difficulty,
            "requested_count": question_count,
            "generated_count": len(saved_questions),
            "resume_skills": resume_skills,
            "job_required_skills": jd_skills,
            "matched_job_skills": matched_jd_skills,
            "missing_job_skills": missing_jd_skills,
            "questions": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def interview_question_list(request):
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    questions = (
        request.user.interview_questions
        .all()
        .order_by("-created_at")
    )

    resume_id = request.GET.get("resume_id")
    job_id = request.GET.get("job_id")

    if resume_id:
        questions = questions.filter(
            resume_id=resume_id
        )

    if job_id:
        questions = questions.filter(
            job_description_id=job_id
        )

    serializer = InterviewQuestionSerializer(
        questions,
        many=True,
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# AI INTERVIEW ANSWER EVALUATION
# ============================================================

@api_view(["POST"])
def evaluate_interview_answer(request):
    """
    Evaluate a user's answer to a generated interview question.

    Expected request:
    {
        "question_id": 10,
        "answer": "Java is an object-oriented programming language..."
    }

    Returns:
    - score out of 10
    - feedback
    - strengths
    - improvement tips
    - model answer guidance
    """

    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    question_id = request.data.get("question_id")
    answer = str(
        request.data.get("answer", "")
    ).strip()

    if not question_id:
        return Response(
            {"detail": "question_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not answer:
        return Response(
            {"detail": "answer is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        interview_question = (
            request.user.interview_questions.get(
                id=question_id
            )
        )

    except InterviewQuestion.DoesNotExist:
        return Response(
            {"detail": "Interview question not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # --------------------------------------------------------
    # Basic answer analysis
    # --------------------------------------------------------

    words = answer.split()
    word_count = len(words)

    answer_lower = answer.lower()

    # Technical keywords gathered from the question.
    technical_keywords = [
        "java",
        "python",
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
        "spring boot",
        "hibernate",
        "rest api",
        "docker",
        "aws",
        "machine learning",
        "deep learning",
        "data science",
        "pandas",
        "numpy",
        "scikit-learn",
        "typescript",
        "flutter",
        "android",
        "c++",
    ]

    question_lower = (
        interview_question.question or ""
    ).lower()

    relevant_keywords = [
        keyword
        for keyword in technical_keywords
        if keyword in question_lower
    ]

    mentioned_keywords = [
        keyword
        for keyword in relevant_keywords
        if keyword in answer_lower
    ]

    # --------------------------------------------------------
    # Score calculation
    # --------------------------------------------------------

    score = 0

    # Answer length / completeness
    if word_count >= 5:
        score += 2

    if word_count >= 15:
        score += 2

    if word_count >= 30:
        score += 1

    # Technical relevance
    if relevant_keywords:
        if mentioned_keywords:
            score += 2

            if len(mentioned_keywords) >= 2:
                score += 1
        else:
            score += 0
    else:
        # For HR questions, a reasonably detailed answer
        # receives relevance credit.
        if word_count >= 15:
            score += 2
        elif word_count >= 5:
            score += 1

    # Structured explanation indicators
    structure_words = [
        "because",
        "for example",
        "for instance",
        "first",
        "then",
        "finally",
        "however",
        "therefore",
        "when",
        "used",
        "project",
        "experience",
    ]

    structure_count = sum(
        1
        for word in structure_words
        if word in answer_lower
    )

    if structure_count >= 1:
        score += 1

    if structure_count >= 3:
        score += 1

    score = max(0, min(score, 10))

    # --------------------------------------------------------
    # Feedback generation
    # --------------------------------------------------------

    strengths = []

    if word_count >= 15:
        strengths.append(
            "Your answer provides enough detail to show your understanding."
        )
    elif word_count >= 5:
        strengths.append(
            "You have given a basic explanation instead of a one-line answer."
        )
    else:
        strengths.append(
            "You attempted the question, but the answer needs more detail."
        )

    if mentioned_keywords:
        strengths.append(
            "Your answer is connected to the technical topic asked in the question."
        )

    if structure_count >= 2:
        strengths.append(
            "Your explanation has some logical structure."
        )

    if not strengths:
        strengths.append(
            "You made an attempt to answer the interview question."
        )

    improvements = []

    if word_count < 15:
        improvements.append(
            "Add more explanation and give a clear example."
        )

    if word_count < 30:
        improvements.append(
            "Try explaining the concept with a real project or practical use case."
        )

    if relevant_keywords and not mentioned_keywords:
        improvements.append(
            "Use important technical terms directly related to the question."
        )

    if structure_count < 2:
        improvements.append(
            "Structure your answer using a simple flow: concept → example → result."
        )

    if interview_question.question_type == "hr":
        improvements.append(
            "For HR questions, support your answer with a specific personal or project example."
        )

    if not improvements:
        improvements.append(
            "Keep the answer concise while adding measurable results or practical examples."
        )

    # --------------------------------------------------------
    # Overall feedback
    # --------------------------------------------------------

    if score >= 9:
        overall_feedback = (
            "Excellent answer. It is relevant, detailed and reasonably well structured."
        )
    elif score >= 7:
        overall_feedback = (
            "Good answer. The main idea is clear, but you can improve it with stronger examples and more precise details."
        )
    elif score >= 5:
        overall_feedback = (
            "Average answer. You have addressed the question, but the explanation needs more depth and structure."
        )
    elif score >= 3:
        overall_feedback = (
            "The answer shows an initial understanding, but it needs clearer explanation and stronger supporting details."
        )
    else:
        overall_feedback = (
            "The answer needs significant improvement. Focus on directly addressing the question and explaining your reasoning."
        )

    # --------------------------------------------------------
    # Model-answer guidance
    # --------------------------------------------------------

    if interview_question.question_type == "technical":
        model_answer_guidance = (
            "A strong technical answer should define the concept, "
            "explain how it works, mention a practical use case, "
            "and connect it to a project or real-world scenario."
        )
    else:
        model_answer_guidance = (
            "A strong HR answer should be concise, genuine and specific. "
            "Use a real example from your education, project or internship "
            "and explain what you learned from the experience."
        )

    # Save evaluation
    interview_question.answer = answer
    interview_question.score = score
    interview_question.feedback = overall_feedback
    interview_question.save(
        update_fields=[
            "answer",
            "score",
            "feedback",
        ]
    )

    return Response(
        {
            "question_id": interview_question.id,
            "question": interview_question.question,
            "question_type": interview_question.question_type,
            "difficulty": interview_question.difficulty,
            "answer": interview_question.answer,
            "score": score,
            "feedback": overall_feedback,
            "strengths": strengths,
            "improvement_tips": improvements,
            "mentioned_keywords": mentioned_keywords,
            "model_answer_guidance": model_answer_guidance,
            "word_count": word_count,
        },
        status=status.HTTP_200_OK,
    )