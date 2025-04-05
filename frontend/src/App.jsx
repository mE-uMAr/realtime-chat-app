"use client"
import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { useAuth } from "./contexts/auth-context"
import LoginPage from "./pages/login-page"
import RegisterPage from "./pages/register-page"
import ChatPage from "./pages/chat-page"
import ProtectedRoute from "./components/protected-route"
import LoadingScreen from "./components/loading-screen"
import "./App.css"

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/chat/*"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App

