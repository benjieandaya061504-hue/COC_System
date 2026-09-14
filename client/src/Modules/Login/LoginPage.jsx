import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './authContext.jsx'
import './LoginPage.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      setIsLoading(false)
      return
    }

    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.error || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>COC System</h1>
        <p className="login-subtitle">Local Event &amp; Transaction Management</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}