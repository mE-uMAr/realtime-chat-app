"use client"

import { useState, useEffect, useRef } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { getUsers, getGroups, createGroup } from "../services/api-service"
import { createWebSocketConnection } from "../services/websocket-service"
import Sidebar from "../components/sidebar"
import ChatWindow from "../components/chat-window"
import EmptyState from "../components/empty-state"
import toast from "react-hot-toast"

const ChatPage = () => {
  const { token, user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState({})
  const [typingUsers, setTypingUsers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const navigate = useNavigate()

  // Initialize data and WebSocket
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedUsers, fetchedGroups] = await Promise.all([
          getUsers(token),
          getGroups(token),
        ]);

        setUsers(fetchedUsers);
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load data");
        if (error.message.includes("401")) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    const initWebSocket = () => {
      console.log("Initializing WebSocket connection");
      
      // Only create a new connection if we don't have one
      if (!socket || !socket.socket || socket.socket.readyState !== WebSocket.OPEN) {
        const connection = createWebSocketConnection(
          token,
          handleWebSocketMessage,
          handleWebSocketOpen,
          handleWebSocketClose,
          handleWebSocketError,
        );

        setSocket(connection);
      }

      return () => {
        // Don't close the connection here, let the WebSocket service handle it
        console.log("Cleanup function called, but not closing WebSocket connection");
      };
    };

    fetchInitialData();
    const cleanup = initWebSocket();

    return cleanup;
  }, [token, logout]);

  // WebSocket event handlers
  const handleWebSocketMessage = (data) => {
    console.log("WebSocket message received in chat page:", data)
    
    switch (data.type) {
      case "user_status":
        setOnlineUsers((prev) => ({
          ...prev,
          [data.data.user_id]: data.data.status === "online",
        }))
        break

      case "typing":
        const { user_id, chat_id } = data.data
        setTypingUsers((prev) => ({
          ...prev,
          [chat_id]: {
            ...prev[chat_id],
            [user_id]: Date.now(),
          },
        }))

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const chatTyping = prev[chat_id] || {}
            const { [user_id]: _, ...rest } = chatTyping
            return {
              ...prev,
              [chat_id]: rest,
            }
          })
        }, 3000)
        break

      case "new_message":
        // Let the ChatWindow component handle new messages
        console.log("New message received in chat page:", data.data)
        break

      case "group_created":
        toast.success(`You've been added to group: ${data.data.name}`)
        // Refresh groups
        getGroups(token)
          .then((fetchedGroups) => setGroups(fetchedGroups))
          .catch((error) => console.error("Error fetching groups:", error))
        break
    }
  }

  const handleWebSocketOpen = () => {
    console.log("WebSocket connected")
    setIsConnected(true)
  }

  const handleWebSocketClose = (event) => {
    setIsConnected(false)
    if (event.code !== 1000) {
      toast.error("Connection lost. Attempting to reconnect...")
    }
  }

  const handleWebSocketError = () => {
    setIsConnected(false)
    toast.error("WebSocket error. Attempting to reconnect...")
  }

  // Handle group creation
  const handleCreateGroup = async (newGroup) => {
    try {
      const createdGroup = await createGroup(token, newGroup)
      setGroups((prev) => [...prev, createdGroup])
      navigate(`/chat/group/${createdGroup.id}`)
      toast.success("Group created successfully!")
      return createdGroup
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group")
      throw error
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        users={users}
        groups={groups}
        onlineUsers={onlineUsers}
        currentUser={user}
        onCreateGroup={handleCreateGroup}
        onLogout={logout}
        isLoading={isLoading}
      />

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route
            path="/private/:userId"
            element={
              <ChatWindow
                chatType="private"
                users={users}
                currentUser={user}
                socket={socket}
                typingUsers={typingUsers}
                token={token}
              />
            }
          />
          <Route
            path="/group/:groupId"
            element={
              <ChatWindow
                chatType="group"
                users={users}
                groups={groups}
                currentUser={user}
                socket={socket}
                typingUsers={typingUsers}
                token={token}
              />
            }
          />
        </Routes>
      </div>
    </div>
  )
}

export default ChatPage

