import { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'

const API = 'http://127.0.0.1:8000'

function Dashboard({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [resumes, setResumes] = useState([])
  const [analysis, setAnalysis] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedResumeId, setSelectedResumeId] = useState(null)

  const [profileLoading, setProfileLoading] = useState(true)
  const [resumesLoading, setResumesLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [message, setMessage] = useState('')

  // =========================================================
  // SKILL GAP + CAREER ROADMAP
  // =========================================================

  const [targetRole, setTargetRole] = useState('java-developer')

  const [skillGap, setSkillGap] = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [skillGapMessage, setSkillGapMessage] = useState('')

  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapMessage, setRoadmapMessage] = useState('')

  // =========================================================
  // JD MATCHING
  // =========================================================

  const [jobDescriptions, setJobDescriptions] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jdMatch, setJdMatch] = useState(null)
  const [jdLoading, setJdLoading] = useState(false)
  const [jdMessage, setJdMessage] = useState('')

  // =========================================================
  // AI INTERVIEW
  // =========================================================

  const [interviewType, setInterviewType] = useState('mixed')
  const [interviewDifficulty, setInterviewDifficulty] = useState('medium')
  const [interviewCount, setInterviewCount] = useState(5)

  const [interviewQuestions, setInterviewQuestions] = useState([])
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewMessage, setInterviewMessage] = useState('')
  const [interviewMeta, setInterviewMeta] = useState(null)

  // =========================================================
  // AI INTERVIEW ANSWER EVALUATION
  // =========================================================

  const [interviewAnswers, setInterviewAnswers] = useState({})
  const [evaluationResults, setEvaluationResults] = useState({})
  const [evaluationLoading, setEvaluationLoading] = useState({})
  const [evaluationMessages, setEvaluationMessages] = useState({})

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const getAccessToken = () => {
    return localStorage.getItem('access_token')
  }

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')

    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(
        `${API}/api/token/refresh/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      )

      if (!response.ok) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return null
      }

      const data = await response.json()

      if (!data.access) {
        return null
      }

      localStorage.setItem('access_token', data.access)

      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  const authenticatedFetch = async (url, options = {}) => {
    let accessToken = getAccessToken()

    if (!accessToken) {
      return null
    }

    const makeRequest = async (token) => {
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      })
    }

    let response = await makeRequest(accessToken)

    if (response.status === 401) {
      const newAccessToken = await refreshAccessToken()

      if (!newAccessToken) {
        return response
      }

      response = await makeRequest(newAccessToken)
    }

    return response
  }

  // =========================================================
  // SESSION EXPIRED
  // =========================================================

  const handleSessionExpired = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    setMessage(
      'Your session has expired. Please login again.'
    )

    if (onLogout) {
      onLogout()
    }
  }

  // =========================================================
  // LOAD PROFILE + RESUMES + JOB DESCRIPTIONS
  // =========================================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authenticatedFetch(
          `${API}/profile/`
        )

        if (!response) {
          return
        }

        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else if (response.status === 401) {
          handleSessionExpired()
        }
      } catch (error) {
        console.error('Profile error:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    const loadResumes = async () => {
      try {
        const response = await authenticatedFetch(
          `${API}/resume/`
        )

        if (!response) {
          return
        }

        if (response.ok) {
          const data = await response.json()

          setResumes(data)

          if (data.length > 0) {
            setSelectedResumeId(data[0].id)
            loadAnalysis(data[0].id)
          }
        } else if (response.status === 401) {
          handleSessionExpired()
        }
      } catch (error) {
        console.error('Resume error:', error)
      } finally {
        setResumesLoading(false)
      }
    }

    loadProfile()
    loadResumes()
    loadJobDescriptions()
  }, [])

  // =========================================================
  // RESUME ANALYSIS
  // =========================================================

  const loadAnalysis = async (resumeId) => {
    if (!resumeId) {
      return
    }

    if (!getAccessToken()) {
      return
    }

    setAnalysisLoading(true)

    try {
      const response = await authenticatedFetch(
        `${API}/resume/${resumeId}/analysis/`
      )

      if (!response) {
        return
      }

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data)
      } else if (response.status === 401) {
        handleSessionExpired()
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalysisLoading(false)
    }
  }

  // =========================================================
  // LOAD JOB DESCRIPTIONS
  // =========================================================

  const loadJobDescriptions = async () => {
    try {
      const response = await authenticatedFetch(
        `${API}/jd/`
      )

      if (!response) {
        return
      }

      if (response.ok) {
        const data = await response.json()

        setJobDescriptions(data)

        if (data.length > 0) {
          setSelectedJobId(String(data[0].id))
        }
      } else if (response.status === 401) {
        handleSessionExpired()
      }
    } catch (error) {
      console.error('Job description error:', error)
    }
  }

  // =========================================================
  // SKILL GAP ANALYSIS
  // =========================================================

  const handleSkillGapAnalysis = async () => {
    if (!selectedResumeId) {
      setSkillGap(null)
      setSkillGapMessage(
        'Upload a resume before running skill gap analysis.'
      )
      return
    }

    if (!getAccessToken()) {
      setSkillGap(null)
      setSkillGapMessage(
        'Your session has expired. Please login again.'
      )
      return
    }

    setSkillGapLoading(true)
    setSkillGapMessage('')
    setSkillGap(null)

    try {
      const response = await authenticatedFetch(
        `${API}/resume/${selectedResumeId}/skill-gap/?role=${encodeURIComponent(
          targetRole
        )}`
      )

      if (!response) {
        setSkillGapMessage(
          'Your session has expired. Please login again.'
        )
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setSkillGapMessage(
          data.detail || 'Unable to analyze skill gap.'
        )

        return
      }

      setSkillGap(data)
    } catch (error) {
      console.error('Skill gap error:', error)

      setSkillGapMessage(
        'Unable to connect to Django server.'
      )
    } finally {
      setSkillGapLoading(false)
    }
  }

  // =========================================================
  // CAREER ROADMAP
  // =========================================================

  const handleCareerRoadmap = async () => {
    if (!selectedResumeId) {
      setRoadmap(null)
      setRoadmapMessage(
        'Upload a resume before generating your career roadmap.'
      )
      return
    }

    if (!getAccessToken()) {
      setRoadmap(null)
      setRoadmapMessage(
        'Your session has expired. Please login again.'
      )
      return
    }

    setRoadmapLoading(true)
    setRoadmapMessage('')
    setRoadmap(null)

    try {
      const response = await authenticatedFetch(
        `${API}/resume/${selectedResumeId}/roadmap/?role=${encodeURIComponent(
          targetRole
        )}`
      )

      if (!response) {
        setRoadmapMessage(
          'Your session has expired. Please login again.'
        )
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setRoadmapMessage(
          data.detail ||
            'Unable to generate career roadmap.'
        )

        return
      }

      setRoadmap(data)
    } catch (error) {
      console.error('Roadmap error:', error)

      setRoadmapMessage(
        'Unable to connect to Django server.'
      )
    } finally {
      setRoadmapLoading(false)
    }
  }

  // =========================================================
  // JD MATCHING
  // =========================================================

  const handleJDMatch = async () => {
    if (!selectedResumeId) {
      setJdMatch(null)
      setJdMessage(
        'Upload a resume before running JD matching.'
      )
      return
    }

    if (!selectedJobId) {
      setJdMatch(null)
      setJdMessage(
        'Select a Job Description first.'
      )
      return
    }

    if (!getAccessToken()) {
      setJdMatch(null)
      setJdMessage(
        'Your session has expired. Please login again.'
      )
      return
    }

    setJdLoading(true)
    setJdMessage('')
    setJdMatch(null)

    try {
      const response = await authenticatedFetch(
        `${API}/resume/${selectedResumeId}/jd-match/${selectedJobId}/`
      )

      if (!response) {
        setJdMessage(
          'Your session has expired. Please login again.'
        )
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setJdMessage(
          data.detail ||
            'Unable to analyze JD match.'
        )

        return
      }

      setJdMatch(data)
    } catch (error) {
      console.error('JD matching error:', error)

      setJdMessage(
        'Unable to connect to Django server.'
      )
    } finally {
      setJdLoading(false)
    }
  }

  // =========================================================
  // AI INTERVIEW GENERATION
  // =========================================================

  const handleGenerateInterview = async () => {
    if (!selectedResumeId) {
      setInterviewQuestions([])
      setInterviewMeta(null)
      setInterviewMessage(
        'Upload a resume before generating interview questions.'
      )
      return
    }

    if (!selectedJobId) {
      setInterviewQuestions([])
      setInterviewMeta(null)
      setInterviewMessage(
        'Select a Job Description first.'
      )
      return
    }

    if (!getAccessToken()) {
      setInterviewQuestions([])
      setInterviewMeta(null)
      setInterviewMessage(
        'Your session has expired. Please login again.'
      )
      return
    }

    setInterviewLoading(true)
    setInterviewMessage('')
    setInterviewQuestions([])
    setInterviewMeta(null)
    setInterviewAnswers({})
    setEvaluationResults({})
    setEvaluationLoading({})
    setEvaluationMessages({})

    try {
      const response = await authenticatedFetch(
        `${API}/interview/generate/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resume_id: Number(selectedResumeId),
            job_id: Number(selectedJobId),
            question_type: interviewType,
            difficulty: interviewDifficulty,
            question_count: Number(interviewCount),
          }),
        }
      )

      if (!response) {
        setInterviewMessage(
          'Your session has expired. Please login again.'
        )
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setInterviewMessage(
          data.detail ||
            data.error ||
            'Unable to generate interview questions.'
        )

        return
      }

      setInterviewQuestions(data.questions || [])

      setInterviewMeta({
        requestedCount: data.requested_count,
        generatedCount: data.generated_count,
        questionType: data.question_type,
        difficulty: data.difficulty,
        matchedSkills: data.matched_job_skills || [],
        missingSkills: data.missing_job_skills || [],
      })

      if (
        !data.questions ||
        data.questions.length === 0
      ) {
        setInterviewMessage(
          'No interview questions were generated.'
        )
      }
    } catch (error) {
      console.error(
        'Interview generation error:',
        error
      )

      setInterviewMessage(
        'Unable to connect to Django server.'
      )
    } finally {
      setInterviewLoading(false)
    }
  }

  // =========================================================
  // INTERVIEW ANSWER CHANGE
  // =========================================================

  const handleInterviewAnswerChange = (
    questionId,
    value
  ) => {
    setInterviewAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }))

    setEvaluationMessages((previous) => ({
      ...previous,
      [questionId]: '',
    }))
  }

  // =========================================================
  // EVALUATE INTERVIEW ANSWER
  // =========================================================

  const handleEvaluateAnswer = async (questionId) => {
    const answer = (
      interviewAnswers[questionId] || ''
    ).trim()

    if (!answer) {
      setEvaluationMessages((previous) => ({
        ...previous,
        [questionId]:
          'Write your answer before evaluating it.',
      }))
      return
    }

    if (!getAccessToken()) {
      setEvaluationMessages((previous) => ({
        ...previous,
        [questionId]:
          'Your session has expired. Please login again.',
      }))
      return
    }

    setEvaluationLoading((previous) => ({
      ...previous,
      [questionId]: true,
    }))

    setEvaluationMessages((previous) => ({
      ...previous,
      [questionId]: '',
    }))

    try {
      const response = await authenticatedFetch(
        `${API}/interview/evaluate/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: Number(questionId),
            answer,
          }),
        }
      )

      if (!response) {
        setEvaluationMessages((previous) => ({
          ...previous,
          [questionId]:
            'Your session has expired. Please login again.',
        }))
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setEvaluationMessages((previous) => ({
          ...previous,
          [questionId]:
            data.detail ||
            'Unable to evaluate your answer.',
        }))

        return
      }

      setEvaluationResults((previous) => ({
        ...previous,
        [questionId]: data,
      }))
    } catch (error) {
      console.error(
        'Interview answer evaluation error:',
        error
      )

      setEvaluationMessages((previous) => ({
        ...previous,
        [questionId]:
          'Unable to connect to Django server.',
      }))
    } finally {
      setEvaluationLoading((previous) => ({
        ...previous,
        [questionId]: false,
      }))
    }
  }

  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      setSelectedFile(null)
      setMessage('Please select a PDF resume.')
      return
    }

    setSelectedFile(file)
    setMessage('')
  }

  // =========================================================
  // UPLOAD
  // =========================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Select a PDF resume first.')
      return
    }

    if (!getAccessToken()) {
      setMessage(
        'Your session has expired. Please login again.'
      )
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    setAnalysisLoading(true)

    setMessage('Analyzing your resume...')

    try {
      const response = await authenticatedFetch(
        `${API}/resume/upload/`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response) {
        setMessage(
          'Your session has expired. Please login again.'
        )
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
        }

        setMessage(
          data.detail || 'Resume upload failed.'
        )

        return
      }

      const newResume = {
        id: data.id,
        file: data.file,
        uploaded_at: data.uploaded_at,
      }

      setResumes((previous) => [
        newResume,
        ...previous.filter(
          (resume) => resume.id !== data.id
        ),
      ])

      setSelectedResumeId(data.id)
      setSelectedFile(null)

      setSkillGap(null)
      setSkillGapMessage('')

      setRoadmap(null)
      setRoadmapMessage('')

      setJdMatch(null)
      setJdMessage('')

      setInterviewQuestions([])
      setInterviewMeta(null)
      setInterviewMessage('')
      setInterviewAnswers({})
      setEvaluationResults({})
      setEvaluationLoading({})
      setEvaluationMessages({})

      setMessage(
        'Resume analyzed successfully.'
      )

      await loadAnalysis(data.id)
    } catch (error) {
      console.error('Upload error:', error)

      setMessage(
        'Unable to connect to Django server.'
      )
    } finally {
      setUploading(false)
      setAnalysisLoading(false)
    }
  }

  // =========================================================
  // SELECT RESUME
  // =========================================================

  const handleResumeSelect = (resumeId) => {
    setSelectedResumeId(resumeId)

    setSkillGap(null)
    setSkillGapMessage('')

    setRoadmap(null)
    setRoadmapMessage('')

    setJdMatch(null)
    setJdMessage('')

    setInterviewQuestions([])
    setInterviewMeta(null)
    setInterviewMessage('')
    setInterviewAnswers({})
    setEvaluationResults({})
    setEvaluationLoading({})
    setEvaluationMessages({})

    loadAnalysis(resumeId)
  }

  // =========================================================
  // ROLE CHANGE
  // =========================================================

  const handleRoleChange = (event) => {
    const newRole = event.target.value

    setTargetRole(newRole)

    setSkillGap(null)
    setSkillGapMessage('')

    setRoadmap(null)
    setRoadmapMessage('')
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    if (onLogout) {
      onLogout()
    }
  }

  // =========================================================
  // USER DATA
  // =========================================================

  const username =
    profile?.username ||
    profile?.first_name ||
    'User'

  const firstLetter = username
    .charAt(0)
    .toUpperCase()

  const score =
    typeof analysis?.score === 'number'
      ? analysis.score
      : 0

  const skills =
    analysis?.skills?.length
      ? analysis.skills
      : []

  const skillCount =
    analysis?.skill_count ?? skills.length

  const selectedResume = resumes.find(
    (resume) => resume.id === selectedResumeId
  )

  const resumeName = selectedResume?.file
    ? selectedResume.file.split('/').pop()
    : 'No resume uploaded'

  const scoreLabel = useMemo(() => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Strong'
    if (score >= 60) return 'Good'
    if (score > 0) return 'Needs Improvement'

    return 'Awaiting Analysis'
  }, [score])

  // =========================================================
  // TARGET ROLE LABEL
  // =========================================================

  const targetRoleLabel = useMemo(() => {
    const roleMap = {
      'java-developer': 'Java Developer',
      'python-developer': 'Python Developer',
      'frontend-developer': 'Frontend Developer',
      'data-analyst': 'Data Analyst',
      'machine-learning-engineer':
        'Machine Learning Engineer',
    }

    return roleMap[targetRole] || 'Java Developer'
  }, [targetRole])

  // =========================================================
  // ROADMAP STATUS HELPERS
  // =========================================================

  const getRoadmapStatusLabel = (status) => {
    if (status === 'completed') {
      return 'COMPLETED'
    }

    if (status === 'in-progress') {
      return 'IN PROGRESS'
    }

    return 'RECOMMENDED'
  }

  // =========================================================
  // INTERVIEW TYPE LABEL
  // =========================================================

  const interviewTypeLabel = useMemo(() => {
    const typeMap = {
      technical: 'Technical',
      hr: 'HR',
      mixed: 'Mixed',
    }

    return typeMap[interviewType] || 'Mixed'
  }, [interviewType])

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">
          Career<span>Sense</span> AI
        </div>

        <div className="sidebar-status">
          <span className="online-dot"></span>
          AI SYSTEM ONLINE
        </div>

        <nav className="sidebar-nav">

          <button className="sidebar-link active">
            <span>01</span>
            Overview
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('resume-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>02</span>
            Resume Intelligence
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('skills-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>03</span>
            Skill Analysis
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('skill-gap-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>04</span>
            Skill Gap
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('jd-matching-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>05</span>
            JD Matching
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('roadmap-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>06</span>
            Career Roadmap
          </button>

          <button
            className="sidebar-link"
            onClick={() =>
              document
                .getElementById('interview-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>07</span>
            AI Interview
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="mini-user">

            <div className="avatar">
              {firstLetter}
            </div>

            <div>
              <strong>
                {username}
              </strong>

              <span>
                Candidate Profile
              </span>
            </div>

          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar">

          <div>
            <span className="eyebrow">
              CAREER INTELLIGENCE / 01
            </span>

            <h1>
              Welcome back, {username}.
            </h1>

            <p>
              Your AI career command center is ready.
            </p>
          </div>

          <div className="topbar-profile">

            <div className="topbar-avatar">
              {firstLetter}
            </div>

            <div>
              <strong>
                {username}
              </strong>

              <span>
                {profile?.branch ||
                  'Career Profile'}
              </span>
            </div>

          </div>

        </header>

        {/* ===================================================
            HERO STATS
        =================================================== */}

        <section className="dashboard-grid">

          <div className="dashboard-card score-card">

            <div className="card-label">
              RESUME SCORE
            </div>

            <div className="score-layout">

              <div
                className="score-ring"
                style={{
                  '--score': score,
                }}
              >

                <div className="score-ring-inner">

                  <strong>
                    {score}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>

              </div>

              <div className="score-info">

                <span className="score-status">
                  {scoreLabel}
                </span>

                <h2>
                  Career readiness
                </h2>

                <p>
                  Your resume intelligence score is
                  calculated from the information detected
                  in your resume.
                </p>

              </div>

            </div>

          </div>

          <div className="dashboard-card stat-card">

            <div className="card-label">
              DETECTED SKILLS
            </div>

            <div className="big-stat">
              {skillCount}
            </div>

            <p>
              technical skills identified
            </p>

            <div className="stat-line">

              <span>
                Profile intelligence
              </span>

              <strong>
                {skillCount > 0
                  ? 'ACTIVE'
                  : 'WAITING'}
              </strong>

            </div>

          </div>

          <div className="dashboard-card stat-card">

            <div className="card-label">
              RESUME STATUS
            </div>

            <div className="resume-status-icon">
              {resumes.length > 0
                ? '✓'
                : '—'}
            </div>

            <h3>
              {resumes.length > 0
                ? 'Resume Connected'
                : 'No Resume'}
            </h3>

            <p>
              {resumes.length > 0
                ? `${resumes.length} resume${
                    resumes.length > 1
                      ? 's'
                      : ''
                  } available`
                : 'Upload a PDF to begin'}
            </p>

          </div>

        </section>

        {/* ===================================================
            RESUME INTELLIGENCE
        =================================================== */}

        <section
          id="resume-section"
          className="dashboard-card resume-intelligence"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                RESUME INTELLIGENCE
              </span>

              <h2>
                Analyze your career signal.
              </h2>

              <p>
                Upload your latest resume and let
                CareerSense AI extract the skills and
                signals that matter.
              </p>

            </div>

            <div className="analysis-indicator">

              <span></span>

              {analysisLoading
                ? 'PROCESSING'
                : 'AI READY'}

            </div>

          </div>

          <div className="upload-area">

            <div className="upload-icon">
              ↑
            </div>

            <div className="upload-copy">

              <h3>
                {selectedFile
                  ? selectedFile.name
                  : 'Drop your resume here'}
              </h3>

              <p>
                PDF files only · AI-powered analysis
              </p>

            </div>

            <label className="choose-file">

              {selectedFile
                ? 'Change File'
                : 'Choose PDF'}

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />

            </label>

            <button
              className="analyze-btn"
              onClick={handleUpload}
              disabled={
                uploading ||
                !selectedFile
              }
            >
              {uploading
                ? 'Analyzing...'
                : 'Analyze Resume →'}
            </button>

          </div>

          {message && (
            <div className="dashboard-message">
              {message}
            </div>
          )}

          {selectedResume && (

            <div className="current-resume">

              <div>

                <span>
                  ACTIVE RESUME
                </span>

                <strong>
                  {resumeName}
                </strong>

              </div>

              <span>
                {analysisLoading
                  ? 'Analyzing'
                  : 'Connected'}
              </span>

            </div>

          )}

        </section>

        {/* ===================================================
            SKILLS
        =================================================== */}

        <section
          id="skills-section"
          className="dashboard-card skills-panel"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                SKILL INTELLIGENCE
              </span>

              <h2>
                What your resume tells us.
              </h2>

            </div>

            <span className="skill-count">
              {skillCount} SKILLS DETECTED
            </span>

          </div>

          {skills.length > 0 ? (

            <div className="skill-cloud">

              {skills.map(
                (skill, index) => (

                  <div
                    className="skill-pill"
                    key={`${skill}-${index}`}
                  >

                    <span className="skill-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span>
                      {skill}
                    </span>

                    <span className="skill-active">
                      ACTIVE
                    </span>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="empty-state">
              Upload a resume to discover your
              technical skills.
            </div>

          )}

        </section>

        {/* ===================================================
            SKILL GAP ANALYSIS
        =================================================== */}

        <section
          id="skill-gap-section"
          className="dashboard-card skill-gap-panel"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                TARGET ROLE INTELLIGENCE
              </span>

              <h2>
                Find your skill gap.
              </h2>

              <p>
                Select a target placement role and compare
                its required skills with your current resume.
              </p>

            </div>

            <div className="analysis-indicator">

              <span></span>

              {skillGapLoading
                ? 'ANALYZING'
                : 'ROLE READY'}

            </div>

          </div>

          <div className="skill-gap-controls">

            <div className="role-selector-wrap">

              <label htmlFor="target-role">
                TARGET ROLE
              </label>

              <select
                id="target-role"
                value={targetRole}
                onChange={handleRoleChange}
                disabled={
                  skillGapLoading ||
                  roadmapLoading
                }
              >

                <option value="java-developer">
                  Java Developer
                </option>

                <option value="python-developer">
                  Python Developer
                </option>

                <option value="frontend-developer">
                  Frontend Developer
                </option>

                <option value="data-analyst">
                  Data Analyst
                </option>

                <option value="machine-learning-engineer">
                  Machine Learning Engineer
                </option>

              </select>

            </div>

            <button
              className="skill-gap-btn"
              onClick={handleSkillGapAnalysis}
              disabled={
                skillGapLoading ||
                !selectedResumeId
              }
            >
              {skillGapLoading
                ? 'Analyzing Skill Gap...'
                : 'Analyze Skill Gap →'}
            </button>

          </div>

          {skillGapMessage && (
            <div className="dashboard-message">
              {skillGapMessage}
            </div>
          )}

          {skillGap && (

            <div className="skill-gap-result">

              <div className="skill-gap-summary">

                <div className="skill-gap-match">

                  <span>
                    ROLE MATCH
                  </span>

                  <strong>
                    {skillGap.match_percentage}%
                  </strong>

                  <small>
                    {skillGap.role}
                  </small>

                </div>

                <div className="skill-gap-progress">

                  <div className="skill-gap-progress-top">

                    <span>
                      Career alignment
                    </span>

                    <strong>
                      {skillGap.match_percentage}%
                    </strong>

                  </div>

                  <div className="skill-gap-progress-track">

                    <div
                      className="skill-gap-progress-fill"
                      style={{
                        width: `${skillGap.match_percentage}%`,
                      }}
                    ></div>

                  </div>

                  <p>
                    {skillGap.matched_skills.length} of{' '}
                    {skillGap.total_required_skills}{' '}
                    required skills detected.
                  </p>

                </div>

              </div>

              <div className="skill-gap-columns">

                <div className="skill-gap-column matched">

                  <div className="skill-gap-column-head">

                    <span>
                      MATCHED SKILLS
                    </span>

                    <strong>
                      {skillGap.matched_skills.length}
                    </strong>

                  </div>

                  {skillGap.matched_skills.length > 0 ? (

                    <div className="skill-gap-list">

                      {skillGap.matched_skills.map(
                        (skill, index) => (

                          <div
                            className="skill-gap-item"
                            key={`${skill}-${index}`}
                          >

                            <span className="skill-gap-check">
                              ✓
                            </span>

                            <span>
                              {skill}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="skill-gap-empty">
                      No required skills detected yet.
                    </div>

                  )}

                </div>

                <div className="skill-gap-column missing">

                  <div className="skill-gap-column-head">

                    <span>
                      SKILLS TO BUILD
                    </span>

                    <strong>
                      {skillGap.missing_skills.length}
                    </strong>

                  </div>

                  {skillGap.missing_skills.length > 0 ? (

                    <div className="skill-gap-list">

                      {skillGap.missing_skills.map(
                        (skill, index) => (

                          <div
                            className="skill-gap-item"
                            key={`${skill}-${index}`}
                          >

                            <span className="skill-gap-arrow">
                              +
                            </span>

                            <span>
                              {skill}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="skill-gap-empty">
                      Excellent. No skill gaps detected.
                    </div>

                  )}

                </div>

              </div>

            </div>

          )}

        </section>

        {/* ===================================================
            JD MATCHING
        =================================================== */}

        <section
          id="jd-matching-section"
          className="dashboard-card jd-matching-panel"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                JOB DESCRIPTION MATCHING
              </span>

              <h2>
                How well do you match this job?
              </h2>

              <p>
                Compare your active resume against a job
                description and discover your matching and
                missing skills.
              </p>

            </div>

            <div className="analysis-indicator">

              <span></span>

              {jdLoading
                ? 'MATCHING'
                : 'AI READY'}

            </div>

          </div>

          <div className="jd-match-controls">

            <div className="jd-selector-wrap">

              <label htmlFor="jd-resume">
                ACTIVE RESUME
              </label>

              <select
                id="jd-resume"
                value={selectedResumeId || ''}
                onChange={(event) => {
                  const resumeId =
                    Number(event.target.value)

                  handleResumeSelect(resumeId)
                }}
                disabled={
                  jdLoading ||
                  resumes.length === 0
                }
              >

                {resumes.length === 0 ? (
                  <option value="">
                    No resume available
                  </option>
                ) : (
                  resumes.map((resume) => (
                    <option
                      key={resume.id}
                      value={resume.id}
                    >
                      Resume #{resume.id}
                    </option>
                  ))
                )}

              </select>

            </div>

            <div className="jd-selector-wrap">

              <label htmlFor="job-description">
                JOB DESCRIPTION
              </label>

              <select
                id="job-description"
                value={selectedJobId}
                onChange={(event) => {

                  setSelectedJobId(
                    event.target.value
                  )

                  setJdMatch(null)
                  setJdMessage('')

                  setInterviewQuestions([])
                  setInterviewMeta(null)
                  setInterviewMessage('')
                  setInterviewAnswers({})
                  setEvaluationResults({})
                  setEvaluationLoading({})
                  setEvaluationMessages({})

                }}
                disabled={
                  jdLoading ||
                  jobDescriptions.length === 0
                }
              >

                {jobDescriptions.length === 0 ? (
                  <option value="">
                    No Job Description available
                  </option>
                ) : (
                  jobDescriptions.map((job) => (
                    <option
                      key={job.id}
                      value={job.id}
                    >
                      {job.title}
                      {job.company
                        ? ` — ${job.company}`
                        : ''}
                    </option>
                  ))
                )}

              </select>

            </div>

            <button
              className="jd-match-btn"
              onClick={handleJDMatch}
              disabled={
                jdLoading ||
                !selectedResumeId ||
                !selectedJobId
              }
            >
              {jdLoading
                ? 'Matching Resume...'
                : 'Analyze JD Match →'}
            </button>

          </div>

          {jdMessage && (
            <div className="dashboard-message">
              {jdMessage}
            </div>
          )}

          {jdMatch && (

            <div className="jd-match-result">

              <div className="jd-match-summary">

                <div className="jd-match-score-box">

                  <span>
                    JOB MATCH
                  </span>

                  <strong>
                    {jdMatch.match_percentage}%
                  </strong>

                  <small>
                    Resume compatibility
                  </small>

                </div>

                <div className="jd-match-progress-box">

                  <div className="jd-match-progress-top">

                    <span>
                      Overall job compatibility
                    </span>

                    <strong>
                      {jdMatch.match_percentage}%
                    </strong>

                  </div>

                  <div className="jd-match-progress-track">

                    <div
                      className="jd-match-progress-fill"
                      style={{
                        width: `${jdMatch.match_percentage}%`,
                      }}
                    ></div>

                  </div>

                  <p>
                    {jdMatch.matched_skill_count} of{' '}
                    {jdMatch.total_required_skills}{' '}
                    required skills matched.
                  </p>

                </div>

              </div>

              <div className="jd-match-stats">

                <div>
                  <span>
                    REQUIRED SKILLS
                  </span>

                  <strong>
                    {jdMatch.total_required_skills}
                  </strong>
                </div>

                <div>
                  <span>
                    MATCHED
                  </span>

                  <strong>
                    {jdMatch.matched_skill_count}
                  </strong>
                </div>

                <div>
                  <span>
                    MISSING
                  </span>

                  <strong>
                    {jdMatch.missing_skill_count}
                  </strong>
                </div>

              </div>

              <div className="jd-match-columns">

                <div className="jd-match-column matched">

                  <div className="jd-column-heading">

                    <div>
                      <span>
                        MATCHED SKILLS
                      </span>

                      <small>
                        Skills you already have
                      </small>
                    </div>

                    <strong>
                      {jdMatch.matched_skills?.length || 0}
                    </strong>

                  </div>

                  {jdMatch.matched_skills?.length > 0 ? (

                    <div className="jd-skill-list">

                      {jdMatch.matched_skills.map(
                        (skill, index) => (

                          <div
                            className="jd-skill-item"
                            key={`${skill}-${index}`}
                          >

                            <span className="jd-skill-icon">
                              ✓
                            </span>

                            <span>
                              {skill}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="jd-empty">
                      No matching skills detected.
                    </div>

                  )}

                </div>

                <div className="jd-match-column missing">

                  <div className="jd-column-heading">

                    <div>
                      <span>
                        SKILLS TO BUILD
                      </span>

                      <small>
                        Skills required by this job
                      </small>
                    </div>

                    <strong>
                      {jdMatch.missing_skills?.length || 0}
                    </strong>

                  </div>

                  {jdMatch.missing_skills?.length > 0 ? (

                    <div className="jd-skill-list">

                      {jdMatch.missing_skills.map(
                        (skill, index) => (

                          <div
                            className="jd-skill-item"
                            key={`${skill}-${index}`}
                          >

                            <span className="jd-skill-icon">
                              +
                            </span>

                            <span>
                              {skill}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="jd-empty">
                      Excellent. No missing skills detected.
                    </div>

                  )}

                </div>

              </div>

              {jdMatch.required_skills?.length > 0 && (

                <div className="jd-required-skills">

                  <div>
                    <span>
                      REQUIRED SKILLS
                    </span>

                    <small>
                      Skills identified from the selected JD
                    </small>
                  </div>

                  <div className="jd-required-list">

                    {jdMatch.required_skills.map(
                      (skill, index) => (

                        <span
                          key={`${skill}-${index}`}
                          className="jd-required-pill"
                        >
                          {skill}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          )}

        </section>

        {/* ===================================================
            AI INTERVIEW
        =================================================== */}

        <section
          id="interview-section"
          className="dashboard-card interview-panel"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                AI INTERVIEW SIMULATOR
              </span>

              <h2>
                Prepare for your real interview.
              </h2>

              <p>
                Generate personalized interview questions
                from your resume and the selected job
                description.
              </p>

            </div>

            <div className="analysis-indicator">

              <span></span>

              {interviewLoading
                ? 'GENERATING'
                : 'AI READY'}

            </div>

          </div>

          <div className="interview-controls">

            <div className="interview-selector-wrap">

              <label htmlFor="interview-resume">
                ACTIVE RESUME
              </label>

              <select
                id="interview-resume"
                value={selectedResumeId || ''}
                onChange={(event) => {
                  const resumeId =
                    Number(event.target.value)

                  handleResumeSelect(resumeId)
                }}
                disabled={
                  interviewLoading ||
                  resumes.length === 0
                }
              >

                {resumes.length === 0 ? (
                  <option value="">
                    No resume available
                  </option>
                ) : (
                  resumes.map((resume) => (
                    <option
                      key={resume.id}
                      value={resume.id}
                    >
                      Resume #{resume.id}
                    </option>
                  ))
                )}

              </select>

            </div>

            <div className="interview-selector-wrap">

              <label htmlFor="interview-job">
                JOB DESCRIPTION
              </label>

              <select
                id="interview-job"
                value={selectedJobId}
                onChange={(event) => {

                  setSelectedJobId(
                    event.target.value
                  )

                  setInterviewQuestions([])
                  setInterviewMeta(null)
                  setInterviewMessage('')
                  setInterviewAnswers({})
                  setEvaluationResults({})
                  setEvaluationLoading({})
                  setEvaluationMessages({})

                }}
                disabled={
                  interviewLoading ||
                  jobDescriptions.length === 0
                }
              >

                {jobDescriptions.length === 0 ? (
                  <option value="">
                    No Job Description available
                  </option>
                ) : (
                  jobDescriptions.map((job) => (
                    <option
                      key={job.id}
                      value={job.id}
                    >
                      {job.title}
                      {job.company
                        ? ` — ${job.company}`
                        : ''}
                    </option>
                  ))
                )}

              </select>

            </div>

            <div className="interview-selector-wrap">

              <label htmlFor="interview-type">
                QUESTION TYPE
              </label>

              <select
                id="interview-type"
                value={interviewType}
                onChange={(event) => {

                  setInterviewType(
                    event.target.value
                  )

                  setInterviewQuestions([])
                  setInterviewMeta(null)
                  setInterviewMessage('')
                  setInterviewAnswers({})
                  setEvaluationResults({})
                  setEvaluationLoading({})
                  setEvaluationMessages({})

                }}
                disabled={interviewLoading}
              >

                <option value="mixed">
                  Mixed — Technical + HR
                </option>

                <option value="technical">
                  Technical
                </option>

                <option value="hr">
                  HR
                </option>

              </select>

            </div>

            <div className="interview-selector-wrap">

              <label htmlFor="interview-difficulty">
                DIFFICULTY
              </label>

              <select
                id="interview-difficulty"
                value={interviewDifficulty}
                onChange={(event) => {

                  setInterviewDifficulty(
                    event.target.value
                  )

                  setInterviewQuestions([])
                  setInterviewMeta(null)
                  setInterviewMessage('')
                  setInterviewAnswers({})
                  setEvaluationResults({})
                  setEvaluationLoading({})
                  setEvaluationMessages({})

                }}
                disabled={interviewLoading}
              >

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>

              </select>

            </div>

            <div className="interview-selector-wrap interview-count-wrap">

              <label htmlFor="interview-count">
                QUESTIONS
              </label>

              <select
                id="interview-count"
                value={interviewCount}
                onChange={(event) => {

                  setInterviewCount(
                    Number(event.target.value)
                  )

                  setInterviewQuestions([])
                  setInterviewMeta(null)
                  setInterviewMessage('')
                  setInterviewAnswers({})
                  setEvaluationResults({})
                  setEvaluationLoading({})
                  setEvaluationMessages({})

                }}
                disabled={interviewLoading}
              >

                <option value={5}>
                  5 Questions
                </option>

                <option value={8}>
                  8 Questions
                </option>

                <option value={10}>
                  10 Questions
                </option>

              </select>

            </div>

            <button
              className="interview-generate-btn"
              onClick={handleGenerateInterview}
              disabled={
                interviewLoading ||
                !selectedResumeId ||
                !selectedJobId
              }
            >
              {interviewLoading
                ? 'Generating Interview...'
                : 'Generate Interview →'}
            </button>

          </div>

          {interviewMessage && (
            <div className="dashboard-message">
              {interviewMessage}
            </div>
          )}

          {interviewMeta && (

            <div className="interview-meta">

              <div className="interview-meta-item">

                <span>
                  MODE
                </span>

                <strong>
                  {interviewMeta.questionType === 'technical'
                    ? 'Technical'
                    : interviewMeta.questionType === 'hr'
                      ? 'HR'
                      : 'Mixed'}
                </strong>

              </div>

              <div className="interview-meta-item">

                <span>
                  DIFFICULTY
                </span>

                <strong>
                  {interviewMeta.difficulty
                    ? interviewMeta.difficulty
                        .charAt(0)
                        .toUpperCase() +
                      interviewMeta.difficulty.slice(1)
                    : 'Medium'}
                </strong>

              </div>

              <div className="interview-meta-item">

                <span>
                  GENERATED
                </span>

                <strong>
                  {interviewMeta.generatedCount || 0}
                </strong>

              </div>

              <div className="interview-meta-item">

                <span>
                  MATCHED SKILLS
                </span>

                <strong>
                  {interviewMeta.matchedSkills?.length || 0}
                </strong>

              </div>

            </div>

          )}

          {interviewMeta && (

            <div className="interview-skill-context">

              <div className="interview-context-block">

                <div className="interview-context-title">

                  <span>
                    JD SKILLS USED
                  </span>

                  <strong>
                    {interviewMeta.matchedSkills?.length || 0}
                  </strong>

                </div>

                {interviewMeta.matchedSkills?.length > 0 ? (

                  <div className="interview-context-list">

                    {interviewMeta.matchedSkills.map(
                      (skill, index) => (

                        <span
                          className="interview-context-pill matched"
                          key={`${skill}-${index}`}
                        >
                          ✓ {skill}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p>
                    No matched JD skills available.
                  </p>

                )}

              </div>

              <div className="interview-context-block">

                <div className="interview-context-title">

                  <span>
                    SKILLS TO PREPARE
                  </span>

                  <strong>
                    {interviewMeta.missingSkills?.length || 0}
                  </strong>

                </div>

                {interviewMeta.missingSkills?.length > 0 ? (

                  <div className="interview-context-list">

                    {interviewMeta.missingSkills.map(
                      (skill, index) => (

                        <span
                          className="interview-context-pill missing"
                          key={`${skill}-${index}`}
                        >
                          + {skill}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p>
                    No additional JD skills to prepare.
                  </p>

                )}

              </div>

            </div>

          )}

          {interviewQuestions.length > 0 && (

            <div className="interview-question-area">

              <div className="interview-question-header">

                <div>

                  <span className="interview-kicker">
                    GENERATED INTERVIEW
                  </span>

                  <h3>
                    Your personalized questions.
                  </h3>

                  <p>
                    Answer each question and let CareerSense
                    AI evaluate your response.
                  </p>

                </div>

                <div className="interview-question-count">

                  <strong>
                    {interviewQuestions.length}
                  </strong>

                  <span>
                    QUESTIONS
                  </span>

                </div>

              </div>

              <div className="interview-question-list">

                {interviewQuestions.map(
                  (question, index) => {

                    const questionId = question.id

                    const answer =
                      interviewAnswers[questionId] || ''

                    const evaluation =
                      evaluationResults[questionId]

                    const isEvaluating =
                      evaluationLoading[questionId]

                    const evaluationMessage =
                      evaluationMessages[questionId]

                    return (

                      <article
                        className="interview-question-card"
                        key={
                          question.id ||
                          `${question.question}-${index}`
                        }
                      >

                        <div className="interview-question-number">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="interview-question-content">

                          <div className="interview-question-top">

                            <span
                              className={`interview-badge ${
                                question.question_type ===
                                'technical'
                                  ? 'technical'
                                  : 'hr'
                              }`}
                            >
                              {question.question_type ===
                              'technical'
                                ? 'TECHNICAL'
                                : 'HR'}
                            </span>

                            <span className="interview-difficulty-badge">
                              {question.difficulty?.toUpperCase()}
                            </span>

                          </div>

                          <h4>
                            {question.question}
                          </h4>

                          {/* ANSWER AREA */}

                          <div className="interview-answer-area">

                            <div className="interview-answer-heading">

                              <div>
                                <span>
                                  YOUR ANSWER
                                </span>

                                <small>
                                  Answer naturally as if you are in
                                  a real interview.
                                </small>
                              </div>

                              <span className="interview-answer-count">
                                {answer.trim()
                                  ? answer.trim().split(/\s+/).length
                                  : 0}{' '}
                                WORDS
                              </span>

                            </div>

                            <textarea
                              className="interview-answer-input"
                              value={answer}
                              onChange={(event) =>
                                handleInterviewAnswerChange(
                                  questionId,
                                  event.target.value
                                )
                              }
                              placeholder={
                                question.question_type === 'hr'
                                  ? 'Type your interview answer here...'
                                  : 'Explain the concept, give an example, and connect it with practical usage...'
                              }
                              rows={6}
                              disabled={isEvaluating}
                            />

                            <div className="interview-answer-actions">

                              <button
                                className="interview-evaluate-btn"
                                onClick={() =>
                                  handleEvaluateAnswer(
                                    questionId
                                  )
                                }
                                disabled={
                                  isEvaluating ||
                                  !answer.trim()
                                }
                              >
                                {isEvaluating
                                  ? 'Evaluating Answer...'
                                  : evaluation
                                    ? 'Re-evaluate Answer →'
                                    : 'Evaluate Answer →'}
                              </button>

                              {evaluationMessage && (
                                <span className="interview-evaluation-message">
                                  {evaluationMessage}
                                </span>
                              )}

                            </div>

                          </div>

                          {/* EVALUATION RESULT */}

                          {evaluation && (

                            <div className="interview-evaluation">

                              <div className="interview-evaluation-header">

                                <div>

                                  <span className="interview-kicker">
                                    AI EVALUATION
                                  </span>

                                  <h5>
                                    Interview performance
                                  </h5>

                                </div>

                                <div className="interview-score-box">

                                  <strong>
                                    {evaluation.score}
                                  </strong>

                                  <span>
                                    /10
                                  </span>

                                </div>

                              </div>

                              <div className="interview-feedback-box">

                                <span>
                                  FEEDBACK
                                </span>

                                <p>
                                  {evaluation.feedback}
                                </p>

                              </div>

                              <div className="interview-evaluation-columns">

                                <div className="interview-evaluation-column">

                                  <div className="interview-evaluation-title">

                                    <span>
                                      ✓
                                    </span>

                                    <strong>
                                      STRENGTHS
                                    </strong>

                                  </div>

                                  {evaluation.strengths?.length > 0 ? (

                                    <ul>

                                      {evaluation.strengths.map(
                                        (strength, strengthIndex) => (

                                          <li
                                            key={strengthIndex}
                                          >
                                            {strength}
                                          </li>

                                        )
                                      )}

                                    </ul>

                                  ) : (

                                    <p>
                                      No strengths detected yet.
                                    </p>

                                  )}

                                </div>

                                <div className="interview-evaluation-column">

                                  <div className="interview-evaluation-title">

                                    <span>
                                      +
                                    </span>

                                    <strong>
                                      IMPROVEMENT TIPS
                                    </strong>

                                  </div>

                                  {evaluation.improvement_tips?.length > 0 ? (

                                    <ul>

                                      {evaluation.improvement_tips.map(
                                        (
                                          tip,
                                          tipIndex
                                        ) => (

                                          <li
                                            key={tipIndex}
                                          >
                                            {tip}
                                          </li>

                                        )
                                      )}

                                    </ul>

                                  ) : (

                                    <p>
                                      Keep practicing and refining
                                      your answer.
                                    </p>

                                  )}

                                </div>

                              </div>

                              {evaluation.mentioned_keywords?.length > 0 && (

                                <div className="interview-evaluation-keywords">

                                  <span>
                                    TOPIC SIGNALS DETECTED
                                  </span>

                                  <div>

                                    {evaluation.mentioned_keywords.map(
                                      (
                                        keyword,
                                        keywordIndex
                                      ) => (

                                        <span
                                          key={keywordIndex}
                                        >
                                          {keyword}
                                        </span>

                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                              <div className="interview-model-guidance">

                                <span>
                                  HOW TO BUILD A STRONGER ANSWER
                                </span>

                                <p>
                                  {evaluation.model_answer_guidance}
                                </p>

                              </div>

                            </div>

                          )}

                          <div className="interview-question-footer">

                            <span>
                              CAREERSENSE AI
                            </span>

                            <span>
                              {question.question_type ===
                              'technical'
                                ? 'Technical assessment'
                                : 'Behavioral assessment'}
                            </span>

                          </div>

                        </div>

                      </article>

                    )
                  }
                )}

              </div>

            </div>

          )}

          {!interviewLoading &&
            interviewQuestions.length === 0 &&
            !interviewMessage && (

              <div className="interview-empty">

                <div className="interview-empty-icon">
                  AI
                </div>

                <div>

                  <span>
                    INTERVIEW ENGINE READY
                  </span>

                  <h3>
                    Your interview simulation is waiting.
                  </h3>

                  <p>
                    Choose the interview mode, difficulty and
                    question count, then generate a personalized
                    question set from your resume and JD.
                  </p>

                </div>

              </div>

            )}

        </section>

        {/* ===================================================
            RESUME HISTORY
        =================================================== */}

        <section className="dashboard-card history-panel">

          <div className="section-top">

            <div>

              <span className="card-label">
                RESUME HISTORY
              </span>

              <h2>
                Your career documents.
              </h2>

            </div>

            <span className="history-count">
              {resumes.length} FILES
            </span>

          </div>

          {resumesLoading ? (

            <div className="history-loading">
              <span className="history-loading-dot"></span>
              Loading resume history...
            </div>

          ) : resumes.length > 0 ? (

            <div className="resume-list">

              {resumes.map(
                (resume, index) => {

                  const fileName =
                    resume.file
                      ? resume.file.split('/').pop()
                      : `Resume ${index + 1}`

                  const isActive =
                    resume.id === selectedResumeId

                  return (

                    <button
                      className={`resume-row ${
                        isActive
                          ? 'selected'
                          : ''
                      }`}
                      key={resume.id}
                      onClick={() =>
                        handleResumeSelect(
                          resume.id
                        )
                      }
                    >

                      <div className="resume-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="resume-details">

                        <strong>
                          {fileName}
                        </strong>

                        <span>
                          {resume.uploaded_at
                            ? new Date(
                                resume.uploaded_at
                              ).toLocaleString()
                            : 'Uploaded resume'}
                        </span>

                      </div>

                      <div className="resume-action">

                        {isActive
                          ? 'VIEWING'
                          : 'ANALYZE →'}

                      </div>

                    </button>

                  )
                }
              )}

            </div>

          ) : (

            <div className="empty-state">
              No resumes uploaded yet. Upload your
              first resume above.
            </div>

          )}

        </section>

        {/* ===================================================
            LIVE CAREER ROADMAP
        =================================================== */}

        <section
          id="roadmap-section"
          className="dashboard-card roadmap-panel"
        >

          <div className="section-top">

            <div>

              <span className="card-label">
                CAREER ROADMAP
              </span>

              <h2>
                Your next move.
              </h2>

              <p>
                Generate a personalized learning path from
                your resume and selected target role.
              </p>

            </div>

            <div className="roadmap-score">

              {roadmap
                ? `${roadmap.completion_percentage}% COMPLETE`
                : score > 0
                  ? `${score}% RESUME READY`
                  : 'BUILD PROFILE'}

            </div>

          </div>

          <div className="roadmap-controls">

            <div className="roadmap-target">

              <span>
                TARGET ROLE
              </span>

              <strong>
                {roadmap?.role ||
                  targetRoleLabel}
              </strong>

            </div>

            <button
              className="roadmap-generate-btn"
              onClick={handleCareerRoadmap}
              disabled={
                roadmapLoading ||
                !selectedResumeId
              }
            >

              {roadmapLoading
                ? 'Generating Roadmap...'
                : roadmap
                  ? 'Refresh Roadmap →'
                  : 'Generate My Roadmap →'}

            </button>

          </div>

          {roadmapMessage && (

            <div className="dashboard-message">
              {roadmapMessage}
            </div>

          )}

          {roadmap ? (

            <div className="live-roadmap">

              <div className="live-roadmap-header">

                <div>

                  <span className="roadmap-kicker">
                    PERSONALIZED PATH
                  </span>

                  <h3>
                    {roadmap.role}
                  </h3>

                  <p>
                    {roadmap.description}
                  </p>

                </div>

                <div className="roadmap-progress-box">

                  <strong>
                    {roadmap.completion_percentage}%
                  </strong>

                  <span>
                    {roadmap.completed_steps} /{' '}
                    {roadmap.total_steps} stages complete
                  </span>

                </div>

              </div>

              <div className="roadmap-progress">

                <div className="roadmap-progress-top">

                  <span>
                    CAREER PATH PROGRESS
                  </span>

                  <strong>
                    {roadmap.completion_percentage}%
                  </strong>

                </div>

                <div className="roadmap-progress-track">

                  <div
                    className="roadmap-progress-fill"
                    style={{
                      width: `${roadmap.completion_percentage}%`,
                    }}
                  ></div>

                </div>

              </div>

              <div className="roadmap-steps">

                {roadmap.steps.map(
                  (step) => (

                    <div
                      className={`roadmap-live-step ${step.status}`}
                      key={step.step}
                    >

                      <div className="roadmap-live-marker">

                        {step.status === 'completed'
                          ? '✓'
                          : String(
                              step.step
                            ).padStart(2, '0')}

                      </div>

                      <div className="roadmap-live-content">

                        <div className="roadmap-live-top">

                          <div>

                            <span className="roadmap-status">
                              {getRoadmapStatusLabel(
                                step.status
                              )}
                            </span>

                            <h4>
                              {step.title}
                            </h4>

                          </div>

                          <span className="roadmap-duration">
                            {step.duration}
                          </span>

                        </div>

                        <div className="roadmap-skill-tags">

                          {step.skills.map(
                            (skill, index) => {

                              const isMatched =
                                step.matched_skills?.some(
                                  (matchedSkill) =>
                                    matchedSkill
                                      .toLowerCase() ===
                                    skill.toLowerCase()
                                )

                              return (

                                <span
                                  className={
                                    isMatched
                                      ? 'roadmap-skill matched'
                                      : 'roadmap-skill'
                                  }
                                  key={`${skill}-${index}`}
                                >
                                  {isMatched
                                    ? '✓ '
                                    : '+ '}
                                  {skill}
                                </span>

                              )
                            }
                          )}

                        </div>

                        {step.missing_skills?.length > 0 && (

                          <div className="roadmap-missing">

                            <span>
                              PRIORITY:
                            </span>

                            {step.missing_skills.join(' · ')}

                          </div>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          ) : (

            <div className="roadmap-empty">

              <div className="roadmap-empty-icon">
                05
              </div>

              <div>

                <h3>
                  Your personalized roadmap is waiting.
                </h3>

                <p>
                  Select your target role above and generate
                  your AI-powered career path from the active
                  resume.
                </p>

              </div>

            </div>

          )}

        </section>

      </main>

    </div>
  )
}

export default Dashboard