"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser, registerUser, getCurrentUser } from "../services/auth-service"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await getCurrentUser(token)
          setUser(userData)
        } catch (error) {
          console.error("Failed to load user:", error)
          logout()
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [token])

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password)
      localStorage.setItem("token", data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      navigate("/chat")
      return data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const newUser = await registerUser(userData)
      return newUser
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    navigate("/login")
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

