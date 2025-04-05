import { formatDistanceToNow } from "date-fns"

const MessageList = ({ messages, currentUser, users, isLoading, typingIndicators, messagesEndRef }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Unknown time"
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">No messages yet. Start the conversation!</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUser?.id

        return (
          <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
            {!isCurrentUser && (
              <div className="flex flex-col items-center mr-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  {message.sender?.username?.charAt(0) || "?"}
                </div>
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {!isCurrentUser && message.sender && (
                <p className="text-xs font-semibold mb-1">{message.sender.username}</p>
              )}
              <p className="break-words">{message.content}</p>
              <span className="text-xs opacity-70 block mt-1">{formatTime(message.created_at)}</span>
            </div>

            {isCurrentUser && (
              <div className="flex flex-col items-center ml-2">
                <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center">
                  {currentUser.username.charAt(0)}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {typingIndicators.length > 0 && (
        <div className="flex justify-start">
          <div className="flex flex-col items-center mr-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              {typingIndicators[0].charAt(0)}
            </div>
          </div>
          <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
            <div className="flex items-center">
              <span className="text-sm">
                {typingIndicators.length === 1
                  ? `${typingIndicators[0]} is typing...`
                  : `${typingIndicators.length} people are typing...`}
              </span>
              <span className="ml-2 flex">
                <span className="animate-bounce mx-0.5">.</span>
                <span className="animate-bounce animation-delay-200 mx-0.5">.</span>
                <span className="animate-bounce animation-delay-400 mx-0.5">.</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList

