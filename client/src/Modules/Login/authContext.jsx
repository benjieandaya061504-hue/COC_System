import { createContext, useContext, useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let cancelled = false

    axiosClient
      .get('/session')
      .then((res) => {
        if (cancelled) return
        if (res.data.authenticated) {
          setIsLoggedIn(true)
        }
      })
      .catch(() => {
        // Not authenticated — that's fine, stay logged out
      })
      .finally(() => {
        if (!cancelled) setIsCheckingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (username, password) => {
    const res = await axiosClient.post('/login', { username, password })
    setIsLoggedIn(true)
    setUser(username)
    return res.data
  }

  const logout = async () => {
    try {
      await axiosClient.post('/logout')
    } catch {
      // Log out locally even if the network call fails
    }
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isCheckingSession, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}