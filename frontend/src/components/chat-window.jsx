"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { getMessages, sendMessage } from "../services/api-service"
import ChatHeader from "./chat-header"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import toast from "react-hot-toast"

const ChatWindow = ({ chatType, users, groups, currentUser, socket, typingUsers, token }) => {
  const { userId, groupId } = useParams()
  const chatId = chatType === "private" ? userId : groupId

  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)

  const messagesEndRef = useRef(null)

  // Get chat details
  const getChatDetails = () => {
    if (chatType === "private") {
      return users.find((u) => u.id === userId) || { username: "User" }
    } else {
      return groups.find((g) => g.id === groupId) || { name: "Group Chat" }
    }
  }

  const chatDetails = getChatDetails()

  // Define scrollToBottom function before it's used
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true)
      try {
        const fetchedMessages = await getMessages(token, chatType, chatId)
        setMessages(fetchedMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
        toast.error("Failed to load messages")
      } finally {
        setIsLoading(false)
      }
    }

    if (chatId) {
      loadMessages()
    }
  }, [chatId, chatType, token])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Listen for new messages from WebSocket
  useEffect(() => {
    if (!socket || !socket.socket) return;

    const handleNewMessage = (data) => {
      console.log("ChatWindow received message:", data);
      if (data.type === "new_message") {
        const newMessage = data.data;
        // Check if message belongs to current chat
        if (
          (chatType === "private" && newMessage.chat_id === chatId) ||
          (chatType === "group" && newMessage.chat_id === groupId)
        ) {
          console.log("Adding new message to chat:", newMessage);
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      }
    };

    // Add event listener
    const originalOnMessage = socket.socket.onmessage;
    socket.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleNewMessage(data);
        // Call original handler if it exists
        if (originalOnMessage) {
          originalOnMessage(event);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      // Restore original handler
      if (socket.socket) {
        socket.socket.onmessage = originalOnMessage;
      }
    };
  }, [socket, chatId, chatType, userId, groupId]);

  const handleSendMessage = async (content) => {
    if (!content.trim()) return

    try {
      const messageData = {
        content,
        chat_id: chatId,
        chat_type: chatType,
      }

      const sentMessage = await sendMessage(token, messageData)

      // Add message to state immediately for better UX
      setMessages((prev) => [...prev, sentMessage])

      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        setTypingTimeout(null)
      }
      setIsTyping(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true)
      socket.sendTyping(chatId, chatType)
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false)
    }, 3000)

    setTypingTimeout(timeout)
  }

  // Get typing indicators
  const getTypingIndicators = () => {
    if (!typingUsers || !typingUsers[chatId]) return []

    const typingUserIds = Object.keys(typingUsers[chatId] || {})
    return typingUserIds.map((id) => {
      const user = users.find((u) => u.id === id)
      return user ? user.username : "Someone"
    })
  }

  return (
    <>
      <ChatHeader chatType={chatType} chatDetails={chatDetails} users={users} />

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col bg-white rounded-lg shadow">
          <MessageList
            messages={messages}
            currentUser={currentUser}
            users={users}
            isLoading={isLoading}
            typingIndicators={getTypingIndicators()}
            messagesEndRef={messagesEndRef}
          />

          <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} disabled={isLoading} />
        </div>
      </div>
    </>
  )
}

export default ChatWindow

