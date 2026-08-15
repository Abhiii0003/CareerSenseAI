import { useState } from 'react'
import './Dashboard.css'

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')

  const handleFileChange = (event) => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      setMessage('Please select a PDF resume.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setMessage('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select your resume first.')
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setMessage('Your login session has expired. Please login again.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setMessage('Uploading and analyzing your resume...')

      const response = await fetch(
        'http://127.0.0.1:8000/resume/upload/',
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
        setMessage(
          data.detail || 'Resume upload failed.'
        )
        return
      }

      setMessage(
        'Resume uploaded and text extracted successfully!'
      )

      console.log('Resume response:', data)

    } catch (error) {
      console.error(error)

      setMessage(
        'Unable to connect to the backend.'
      )
    }
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <header className="dashboard-header">

        <div className="dashboard-logo">
          Career<span>Sense</span>AI
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.reload()
          }}
        >
          Logout
        </button>

      </header>

      {/* MAIN */}
      <main className="dashboard-main">

        <section className="welcome-section">

          <p className="dashboard-label">
            CAREERSENSEAI DASHBOARD
          </p>

          <h1>
            Build your career roadmap.
          </h1>

          <p>
            Upload your resume and let CareerSenseAI
            analyze your skills and experience.
          </p>

        </section>

        {/* RESUME UPLOAD CARD */}
        <section className="upload-card">

          <div className="upload-icon">
            📄
          </div>

          <h2>
            Upload your resume
          </h2>

          <p>
            Upload your latest resume in PDF format.
          </p>

          <label className="file-input">

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            <span>
              Choose Resume
            </span>

          </label>

          {selectedFile && (
            <p className="selected-file">
              Selected: {selectedFile.name}
            </p>
          )}

          <button
            className="upload-btn"
            onClick={handleUpload}
          >
            Analyze Resume →
          </button>

          {message && (
            <p className="upload-message">
              {message}
            </p>
          )}

        </section>

        {/* FUTURE FEATURES */}
        <section className="dashboard-grid">

          <div className="dashboard-card">
            <span>🧠</span>
            <h3>Skill Gap Analysis</h3>
            <p>
              Discover the skills you need to improve.
            </p>
          </div>

          <div className="dashboard-card">
            <span>🚀</span>
            <h3>Career Roadmap</h3>
            <p>
              Get a personalized path for your career.
            </p>
          </div>

          <div className="dashboard-card">
            <span>📊</span>
            <h3>Resume Score</h3>
            <p>
              Understand how strong your resume is.
            </p>
          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard