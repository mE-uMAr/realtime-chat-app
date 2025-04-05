"use client"

import { useState } from "react"
import { Send, Paperclip, Smile } from "lucide-react"

const ChatInput = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const handleChange = (e) => {
    setMessage(e.target.value)
    if (onTyping) {
      onTyping()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex items-center">
        <button type="button" className="text-gray-500 hover:text-gray-700 mr-2" disabled={disabled}>
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={disabled ? "Select a chat to start messaging" : "Type a message..."}
          className="flex-1 border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />

        <button type="button" className="text-gray-500 hover:text-gray-700 mx-2" disabled={disabled}>
          <Smile size={20} />
        </button>

        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`${
            disabled || !message.trim() ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          } text-white rounded-lg p-2`}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  )
}

export default ChatInput

