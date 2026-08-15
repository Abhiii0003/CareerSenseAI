import { useState } from 'react'
import './Login.css'
import Dashboard from './Dashboard'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

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
            username: username,
            password: password,
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

      setLoggedIn(true)

    } catch (error) {
      console.error(error)

      setError(
        'Unable to connect to the backend. Make sure Django server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loggedIn) {
    return <Dashboard />
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          Career<span>Sense</span>AI
        </div>

        <h1>Welcome back</h1>

        <p className="login-subtitle">
          Login to continue your career journey.
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
              onChange={(event) =>
                setUsername(event.target.value)
              }
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
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </div>

          {error && (
            <p
              style={{
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '15px',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="register-text">
          Don't have an account? <span>Register</span>
        </p>

      </div>
    </div>
  )
}

export default Login