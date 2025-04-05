import { API_URL } from "../config"

export const loginUser = async (username, password) => {
  const formData = new FormData()
  formData.append("username", username)
  formData.append("password", password)

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to login")
  }

  return response.json()
}

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to register")
  }

  return response.json()
}

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get user data")
  }

  return response.json()
}

