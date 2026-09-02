import { useState } from 'react'
import Dashboard from './Dashboard'
import Login from './Login'
import './App.css'

function App() {
  // Always start from Home page
  const [page, setPage] = useState('home')

  const handleLogin = () => {
    setPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setPage('home')
  }

  if (page === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onBackHome={() => setPage('home')}
      />
    )
  }

  if (page === 'dashboard') {
    return (
      <Dashboard
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <div className="logo">
          Career<span>Sense</span> AI
        </div>

        <div className="nav-links">

          <a href="#features">
            Features
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <button
            className="login-btn"
            onClick={() => setPage('login')}
          >
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() => setPage('login')}
          >
            Get Started
          </button>

        </div>

      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="hero-section">

          <div className="hero-content">

            <div className="badge">
              AI-POWERED CAREER INTELLIGENCE
            </div>

            <h1>
              Build the career
              <span>you are meant for.</span>
            </h1>

            <p>
              CareerSense AI analyzes your resume, identifies your
              skill gaps, and helps you prepare for the roles you
              actually want.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={() => setPage('login')}
              >
                Start Your Journey →
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }
              >
                Explore Platform
              </button>

            </div>

          </div>

          {/* =================================================
              HERO AI CARD
          ================================================= */}

          <div className="hero-card">

            <div className="card-header">

              <div>
                <small>
                  RESUME INTELLIGENCE
                </small>

                <h3>
                  AI Analysis Complete
                </h3>
              </div>

              <div className="score">
                82
              </div>

            </div>

            <div className="progress">
              <div className="progress-bar" />
            </div>

            <div className="skills">

              <div className="skill">
                <span>Java</span>
                <b>92%</b>
              </div>

              <div className="skill">
                <span>JavaScript</span>
                <b>86%</b>
              </div>

              <div className="skill">
                <span>SQL</span>
                <b>81%</b>
              </div>

              <div className="skill">
                <span>AI / ML</span>
                <b>74%</b>
              </div>

            </div>

            <div className="recommendation">

              <strong>
                AI RECOMMENDATION
              </strong>

              <p>
                Strengthen Machine Learning & Backend skills
                to improve your target-role match.
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            FEATURES
        =================================================== */}

        <section
          id="features"
          className="features-section"
        >

          <div className="section-heading">

            <span>
              CORE INTELLIGENCE
            </span>

            <h2>
              Everything you need for placement preparation.
            </h2>

            <p>
              One intelligent platform for resume analysis,
              skill discovery and career preparation.
            </p>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                ✦
              </div>

              <h3>
                Resume Intelligence
              </h3>

              <p>
                Analyze your resume and understand your
                strengths, weaknesses and ATS readiness.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ⌁
              </div>

              <h3>
                Skill Gap Analysis
              </h3>

              <p>
                Discover which skills you need to become
                stronger for your target role.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ◈
              </div>

              <h3>
                Career Roadmap
              </h3>

              <p>
                Follow an AI-assisted roadmap from your
                current skills to your desired career.
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          id="how-it-works"
          className="steps-section"
        >

          <div className="section-heading">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              From resume to career direction.
            </h2>

          </div>

          <div className="steps">

            <div className="step">

              <div className="step-number">
                01 / UPLOAD
              </div>

              <h3>
                Upload your resume
              </h3>

              <p>
                Give CareerSense AI your existing resume and
                let the intelligence engine process it.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                02 / ANALYZE
              </div>

              <h3>
                Understand your profile
              </h3>

              <p>
                Your skills, resume score and career signals
                are analyzed to create your profile.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                03 / IMPROVE
              </div>

              <h3>
                Build your roadmap
              </h3>

              <p>
                Identify gaps and work towards the skills
                required for your target role.
              </p>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <p>
          © 2026 CareerSense AI — Career Intelligence Platform
        </p>

        <p>
          AI-powered placement preparation
        </p>

      </footer>

    </div>
  )
}

export default App
