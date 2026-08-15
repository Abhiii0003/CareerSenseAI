import { useState } from 'react'
import './App.css'
import Login from './Login'

function App() {
  const [showLogin, setShowLogin] = useState(false)

  // Login page show karna
  if (showLogin) {
    return <Login />
  }

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          Career<span>Sense</span>AI
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>

          <button
            className="login-btn"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() => setShowLogin(true)}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main>

        <section className="hero-section">

          <div className="hero-content">

            <div className="badge">
              AI-Powered Career Assistant
            </div>

            <h1>
              Turn Your Resume Into Your
              <span> Career Roadmap.</span>
            </h1>

            <p>
              Upload your resume and let CareerSenseAI analyze your
              skills, identify gaps, and help you discover the career
              path that fits you best.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={() => setShowLogin(true)}
              >
                Analyze My Resume →
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Explore Features
              </button>

            </div>

          </div>

          {/* RESUME ANALYSIS CARD */}
          <div className="hero-card">

            <div className="card-header">

              <div>
                <small>Resume Analysis</small>
                <h3>Career Readiness</h3>
              </div>

              <div className="score">
                82
              </div>

            </div>

            <div className="progress">
              <div className="progress-bar"></div>
            </div>

            <div className="skills">

              <div className="skill">
                <span>Python</span>
                <b>Strong</b>
              </div>

              <div className="skill">
                <span>Django</span>
                <b>Good</b>
              </div>

              <div className="skill">
                <span>React</span>
                <b>Improve</b>
              </div>

              <div className="skill">
                <span>Data Structures</span>
                <b>Good</b>
              </div>

            </div>

            <div className="recommendation">
              <strong>AI Recommendation</strong>
              <p>Improve React &amp; SQL skills</p>
            </div>

          </div>

        </section>

        {/* FEATURES */}
        <section
          className="features-section"
          id="features"
        >

          <div className="section-heading">

            <span>WHY CAREERSENSEAI</span>

            <h2>
              Everything you need to move
              your career forward.
            </h2>

            <p>
              CareerSenseAI combines your resume data with AI-powered
              analysis to give you practical career guidance.
            </p>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                📄
              </div>

              <h3>
                Resume Analysis
              </h3>

              <p>
                Upload your resume and automatically extract important
                information about your education, experience and skills.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                🧠
              </div>

              <h3>
                Skill Gap Detection
              </h3>

              <p>
                Discover which skills you already have and which skills
                you should develop for your target career.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                🚀
              </div>

              <h3>
                Career Recommendations
              </h3>

              <p>
                Get personalized career suggestions based on your
                profile, skills and resume.
              </p>

            </div>

          </div>

        </section>

        {/* HOW IT WORKS */}
        <section
          className="steps-section"
          id="how-it-works"
        >

          <div className="section-heading">

            <span>HOW IT WORKS</span>

            <h2>
              Your career journey starts in three steps.
            </h2>

          </div>

          <div className="steps">

            <div className="step">

              <div className="step-number">
                01 — UPLOAD
              </div>

              <h3>
                Upload your resume
              </h3>

              <p>
                Upload your existing resume securely to CareerSenseAI.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                02 — ANALYZE
              </div>

              <h3>
                Let AI analyze it
              </h3>

              <p>
                Our system extracts your resume information and
                analyzes your skills and experience.
              </p>

            </div>

            <div className="step">

              <div className="step-number">
                03 — IMPROVE
              </div>

              <h3>
                Build your roadmap
              </h3>

              <p>
                Follow personalized recommendations to improve your
                skills and reach your career goals.
              </p>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer>

        <div className="logo">
          Career<span>Sense</span>AI
        </div>

        <p>
          © 2026 CareerSenseAI. Built for smarter careers.
        </p>

      </footer>

    </div>
  )
}

export default App