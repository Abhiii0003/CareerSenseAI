import { useState } from 'react'
import './Login.css'

function Login({ onLogin, onBackHome }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    setError('')

    if (!username || !password) {
      setError('Please enter username and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Invalid username or password.')
        return
      }

      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)

      // App.jsx ko batayega ki login successful hai
      onLogin()
    } catch (error) {
      console.error(error)

      setError(
        'Unable to connect to the backend. Make sure Django server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <button
          type="button"
          className="login-back"
          onClick={onBackHome}
        >
          ← Back to Home
        </button>

        <div className="login-brand">
          Career<span>Sense</span> AI
        </div>

        <div className="login-status">
          <span className="status-dot"></span>
          AI Career Intelligence Platform
        </div>

        <h1>Welcome back</h1>

        <p className="login-subtitle">
          Sign in to continue your personalized career journey.
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Login to CareerSense AI'}
          </button>

        </form>

        <p className="register-text">
          Don't have an account? <span>Register</span>
        </p>

        <div className="login-footer">
          <span>SECURE JWT AUTHENTICATION</span>
          <span>•</span>
          <span>CAREER INTELLIGENCE</span>
        </div>

      </div>
    </div>
  )
}

export default Login
