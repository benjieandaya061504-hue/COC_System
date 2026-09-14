import { Navigate } from 'react-router-dom'
import { useAuth } from '../Modules/Login/authContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isCheckingSession } = useAuth()

  if (isCheckingSession) {
    return null
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}