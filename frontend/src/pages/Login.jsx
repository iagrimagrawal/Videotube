import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!emailOrUsername || !password) {
      setError('Email/Username and password are required')
      return
    }

    setIsLoading(true)

    try {
      await login(emailOrUsername, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">▶</div>
          <h1 className="login-title">VideoTube</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-form-label">Email or Username</label>
            <input type="text" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} className="login-form-input" placeholder="Enter email or username" required />
          </div>

          <div className="login-form-group">
            <label className="login-form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-form-input"
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="login-submit-btn">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <a href="/register" className="login-footer-link">
                Sign Up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}