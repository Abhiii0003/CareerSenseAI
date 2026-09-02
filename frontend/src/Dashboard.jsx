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

  const token = localStorage.getItem('access_token')

  /* =========================================================
     LOAD PROFILE + RESUMES
  ========================================================= */

  useEffect(() => {
    if (!token) {
      setProfileLoading(false)
      setResumesLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error('Profile error:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    const loadResumes = async () => {
      try {
        const response = await fetch(`${API}/resume/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()

          setResumes(data)

          if (data.length > 0) {
            setSelectedResumeId(data[0].id)
            loadAnalysis(data[0].id)
          }
        }
      } catch (error) {
        console.error('Resume error:', error)
      } finally {
        setResumesLoading(false)
      }
    }

    loadProfile()
    loadResumes()
  }, [])

  /* =========================================================
     ANALYSIS
  ========================================================= */

  const loadAnalysis = async (resumeId) => {
    if (!resumeId || !token) return

    setAnalysisLoading(true)

    try {
      const response = await fetch(
        `${API}/resume/${resumeId}/analysis/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalysisLoading(false)
    }
  }

  /* =========================================================
     FILE SELECT
  ========================================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.type !== 'application/pdf') {
      setSelectedFile(null)
      setMessage('Please select a PDF resume.')
      return
    }

    setSelectedFile(file)
    setMessage('')
  }

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Select a PDF resume first.')
      return
    }

    if (!token) {
      setMessage('Your session has expired. Please login again.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    setAnalysisLoading(true)
    setMessage('Analyzing your resume...')

    try {
      const response = await fetch(
        `${API}/resume/upload/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.detail || 'Resume upload failed.')
        return
      }

      const newResume = {
        id: data.id,
        file: data.file,
        uploaded_at: data.uploaded_at,
      }

      setResumes((previous) => [
        newResume,
        ...previous.filter((resume) => resume.id !== data.id),
      ])

      setSelectedResumeId(data.id)
      setSelectedFile(null)
      setMessage('Resume analyzed successfully.')

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

  /* =========================================================
     SELECT RESUME
  ========================================================= */

  const handleResumeSelect = (resumeId) => {
    setSelectedResumeId(resumeId)
    loadAnalysis(resumeId)
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    if (onLogout) {
      onLogout()
    }
  }

  /* =========================================================
     USER DATA
  ========================================================= */

  const username =
    profile?.username ||
    profile?.first_name ||
    'User'

  const firstLetter =
    username.charAt(0).toUpperCase()

  const score =
    typeof analysis?.score === 'number'
      ? analysis.score
      : 0

  const skills =
    analysis?.skills?.length
      ? analysis.skills
      : []

  const skillCount =
    analysis?.skill_count ??
    skills.length

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

  /* =========================================================
     DASHBOARD
  ========================================================= */

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
                .getElementById('roadmap-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            <span>04</span>
            Career Roadmap
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="mini-user">

            <div className="avatar">
              {firstLetter}
            </div>

            <div>
              <strong>{username}</strong>
              <span>Candidate Profile</span>
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
              <strong>{username}</strong>
              <span>
                {profile?.branch || 'Career Profile'}
              </span>
            </div>

          </div>

        </header>

        {/* ===================================================
            HERO STATS
        =================================================== */}

        <section className="dashboard-grid">

          {/* SCORE CARD */}

          <div className="dashboard-card score-card">

            <div className="card-label">
              RESUME SCORE
            </div>

            <div className="score-layout">

              <div className="score-ring" style={{ '--score': score }}>

                <div className="score-ring-inner">
                  <strong>{score}</strong>
                  <span>/100</span>
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
                  Your resume intelligence score is calculated
                  from the information detected in your resume.
                </p>

              </div>

            </div>

          </div>

          {/* SKILL CARD */}

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
              <span>Profile intelligence</span>
              <strong>
                {skillCount > 0 ? 'ACTIVE' : 'WAITING'}
              </strong>
            </div>

          </div>

          {/* RESUME CARD */}

          <div className="dashboard-card stat-card">

            <div className="card-label">
              RESUME STATUS
            </div>

            <div className="resume-status-icon">
              {resumes.length > 0 ? '?' : '—'}
            </div>

            <h3>
              {resumes.length > 0
                ? 'Resume Connected'
                : 'No Resume'}
            </h3>

            <p>
              {resumes.length > 0
                ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} available`
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
                Upload your latest resume and let CareerSense AI
                extract the skills and signals that matter.
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
              ?
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
              disabled={uploading || !selectedFile}
            >
              {uploading
                ? 'Analyzing...'
                : 'Analyze Resume ?'}
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

              {skills.map((skill, index) => (
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
              ))}

            </div>

          ) : (

            <div className="empty-state">
              Upload a resume to discover your technical skills.
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

            <div className="empty-state">
              Loading resume history...
            </div>

          ) : resumes.length > 0 ? (

            <div className="resume-list">

              {resumes.map((resume, index) => {

                const fileName = resume.file
                  ? resume.file.split('/').pop()
                  : `Resume ${index + 1}`

                const isActive =
                  resume.id === selectedResumeId

                return (
                  <button
                    className={`resume-row ${
                      isActive ? 'selected' : ''
                    }`}
                    key={resume.id}
                    onClick={() =>
                      handleResumeSelect(resume.id)
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
                        : 'ANALYZE ?'}
                    </div>

                  </button>
                )
              })}

            </div>

          ) : (

            <div className="empty-state">
              No resumes uploaded yet. Upload your first resume above.
            </div>

          )}

        </section>

        {/* ===================================================
            ROADMAP
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
                Use your current profile as the starting point
                for your career growth.
              </p>
            </div>

            <div className="roadmap-score">
              {score > 0 ? `${score}% READY` : 'BUILD PROFILE'}
            </div>

          </div>

          <div className="roadmap">

            <div className="roadmap-step complete">

              <div className="roadmap-marker">
                01
              </div>

              <div>
                <span>
                  CURRENT
                </span>

                <h3>
                  Resume Intelligence
                </h3>

                <p>
                  Resume data and technical skills have been
                  processed by the platform.
                </p>
              </div>

            </div>

            <div className="roadmap-line"></div>

            <div className="roadmap-step">

              <div className="roadmap-marker">
                02
              </div>

              <div>
                <span>
                  NEXT
                </span>

                <h3>
                  Skill Gap Analysis
                </h3>

                <p>
                  Identify the skills required to become stronger
                  for your target placement role.
                </p>
              </div>

            </div>

            <div className="roadmap-line"></div>

            <div className="roadmap-step">

              <div className="roadmap-marker">
                03
              </div>

              <div>
                <span>
                  TARGET
                </span>

                <h3>
                  Placement Readiness
                </h3>

                <p>
                  Build the knowledge and confidence required
                  for your desired career path.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard

