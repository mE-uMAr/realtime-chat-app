import { API_URL } from "../config"

const getAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export const getUsers = async (token) => {
  const response = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch users")
  }

  return response.json()
}

export const getGroups = async (token) => {
  const response = await fetch(`${API_URL}/groups`, {
    headers: getAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch groups")
  }

  return response.json()
}

export const getGroup = async (token, groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    headers: getAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch group")
  }

  return response.json()
}

export const createGroup = async (token, groupData) => {
  const response = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(groupData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create group")
  }

  return response.json()
}

export const getMessages = async (token, chatType, chatId) => {
  const response = await fetch(`${API_URL}/messages/${chatType}/${chatId}`, {
    headers: getAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch messages")
  }

  return response.json()
}

export const sendMessage = async (token, messageData) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(messageData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to send message")
  }

  return response.json()
}

