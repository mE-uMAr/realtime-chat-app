import { WS_URL } from "../config"

// Singleton instance
let instance = null;
let pingInterval = null;
let isConnecting = false;

export const createWebSocketConnection = (token, onMessage, onOpen, onClose, onError) => {
  // If we already have an instance, return it
  if (instance && instance.socket && instance.socket.readyState === WebSocket.OPEN) {
    console.log("Using existing WebSocket connection");
    return instance;
  }
  
  // If we're already connecting, wait for that to complete
  if (isConnecting) {
    console.log("Connection already in progress, waiting...");
    return instance;
  }
  
  // If we have an instance but it's not open, close it
  if (instance) {
    console.log("Closing existing WebSocket connection");
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    instance.close();
  }

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  
  const connectWebSocket = () => {
    if (isConnecting) {
      console.log("Connection already in progress, skipping");
      return instance;
    }
    
    isConnecting = true;
    console.log("Creating new WebSocket connection");
    
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = (event) => {
      console.log("WebSocket connection established");
      isConnecting = false;
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Start ping interval only if it doesn't exist
      if (!pingInterval) {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      }
      
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      isConnecting = false;
      
      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      
      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(connectWebSocket, reconnectDelay);
      }
      
      if (onClose) onClose(event);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      isConnecting = false;
      if (onError) onError(error);
    };

    instance = {
      socket: ws,
      send: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        } else {
          console.error("WebSocket is not open");
          // Attempt to reconnect if connection is lost
          if (ws.readyState === WebSocket.CLOSED && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(connectWebSocket, reconnectDelay);
          }
        }
      },
      close: () => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (ws) {
          ws.close(1000, "Normal closure");
        }
        instance = null;
        isConnecting = false;
      },
      sendTyping: (chatId, chatType) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "typing",
            chat_id: chatId,
            chat_type: chatType
          }));
        }
      }
    };

    return instance;
  };

  return connectWebSocket();
};

// Mock WebSocket service

// Create a mock WebSocket connection
export const mockWebSocketConnection = (token, onMessage) => {
  console.log("Connecting to WebSocket with token:", token)

  // Create a mock connection object
  const connection = {
    connected: true,

    // Send a message to the server
    send: (data) => {
      console.log("Sending message:", data)

      // Simulate server responses based on message type
      switch (data.type) {
        case "send_message":
          simulateMessageResponse(data, onMessage)
          break
        case "get_chat_history":
          simulateChatHistoryResponse(data, onMessage)
          break
        case "join_group":
          simulateJoinGroupResponse(data, onMessage)
          break
        case "leave_group":
          simulateLeaveGroupResponse(data, onMessage)
          break
        default:
          console.log("Unknown message type:", data.type)
      }
    },

    // Disconnect from the server
    disconnect: () => {
      console.log("Disconnecting from WebSocket")
      connection.connected = false
      clearInterval(connection.pingInterval)
    },
  }

  // Simulate periodic status updates
  connection.pingInterval = setInterval(() => {
    if (connection.connected) {
      const randomUser = `user${Math.floor(Math.random() * 3) + 1}`
      const randomStatus = Math.random() > 0.7 ? "offline" : "online"

      onMessage({
        data: {
          type: "user_status",
          userId: randomUser,
          status: randomStatus,
        },
      })
    }
  }, 10000)

  return connection
}

// Simulate a response to a message
const simulateMessageResponse = (data, onMessage) => {
  // For private chats, simulate the other user typing
  if (data.chatType === "private") {
    setTimeout(() => {
      onMessage({
        data: {
          type: "typing",
          chatId: data.chatId,
          userId: data.chatId,
        },
      })
    }, 500)

    // Then simulate a response
    setTimeout(() => {
      onMessage({
        data: {
          type: "message",
          chatId: data.chatId,
          message: {
            id: Date.now().toString(),
            content: getRandomResponse(data.content),
            sender: { id: data.chatId, name: getUserNameById(data.chatId) },
            timestamp: new Date(),
            chatId: data.chatId,
            chatType: "private",
          },
        },
      })
    }, 2000)
  }
}

// Simulate a response to a chat history request
const simulateChatHistoryResponse = (data, onMessage) => {
  // This is handled in the App component for simplicity
}

// Simulate a response to joining a group
const simulateJoinGroupResponse = (data, onMessage) => {
  setTimeout(() => {
    onMessage({
      data: {
        type: "system_message",
        chatId: data.groupId,
        message: {
          id: Date.now().toString(),
          content: `User has joined the group.`,
          sender: { id: "system", name: "System" },
          timestamp: new Date(),
          chatId: data.groupId,
          chatType: "group",
        },
      },
    })
  }, 500)
}

// Simulate a response to leaving a group
const simulateLeaveGroupResponse = (data, onMessage) => {
  setTimeout(() => {
    onMessage({
      data: {
        type: "system_message",
        chatId: data.groupId,
        message: {
          id: Date.now().toString(),
          content: `User has left the group.`,
          sender: { id: "system", name: "System" },
          timestamp: new Date(),
          chatId: data.groupId,
          chatType: "group",
        },
      },
    })
  }, 500)
}

// Helper function to get a random response
const getRandomResponse = (message) => {
  const responses = [
    "That's interesting!",
    "I see what you mean.",
    "Thanks for sharing that.",
    "Could you tell me more?",
    `I understand. In response to "${message.substring(0, 20)}...", I think we should discuss this further.`,
    "Let me think about that for a moment.",
    "Great point!",
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

// Helper function to get a user name by ID
const getUserNameById = (userId) => {
  const users = {
    user1: "John Doe",
    user2: "Jane Smith",
    user3: "Mike Johnson",
  }

  return users[userId] || "Unknown User"
}

