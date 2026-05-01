import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  })
  const [files, setFiles] = useState({ avatar: null, coverImage: null })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e, fileType) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((prev) => ({ ...prev, [fileType]: file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.username || !formData.fullName || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!files.avatar) {
      setError('Avatar is required')
      return
    }

    setIsLoading(true)

    try {
      await register(formData.email, formData.username, formData.fullName, formData.password, files)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-wrapper">
      <div className="register-container">
        <div className="register-header">
          <div className="register-icon">▶</div>
          <h1 className="register-title">VideoTube</h1>
          <p className="register-subtitle">Create your account</p>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label className="register-form-label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="register-form-input" required />
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="register-form-input" required />
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="register-form-input" required />
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="register-form-input" required />
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="register-form-input" required />
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Avatar *</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="register-form-input" required />
            {files.avatar && <p className="register-file-success">✓ {files.avatar.name}</p>}
          </div>

          <div className="register-form-group">
            <label className="register-form-label">Cover Image (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverImage')} className="register-form-input" />
            {files.coverImage && <p className="register-file-success">✓ {files.coverImage.name}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="register-submit-btn">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <a href="/login" className="register-footer-link">
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}