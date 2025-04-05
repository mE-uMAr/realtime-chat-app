# Real-Time Chat Application

A modern real-time chat application built with React and WebSockets, featuring private messaging, group chats, and user status updates.

## Features

- **Real-time Communication**: Instant messaging powered by WebSockets
- **User Authentication**: Secure login and registration system
- **Private Messaging**: One-on-one conversations between users
- **Group Chats**: Create and participate in group conversations
- **User Status**: See when users are online or offline
- **Typing Indicators**: Know when someone is typing a message
- **Message History**: View past conversations
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js
- **Backend**: Python with FastAPI
- **Real-time Communication**: WebSockets
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MongoDB
- **Styling**: CSS/SCSS

## Project Structure

```
chat-app/
├── frontend/               # React frontend application
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── services/       # API and WebSocket services
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── config.js       # Configuration settings
│   └── package.json        # Frontend dependencies
│
├── backend/                # Python FastAPI backend server
│   ├── app/                # Application modules
│   ├── main.py             # Main application entry point
│   ├── decode_token.py     # Token decoding utilities
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
│
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher) for frontend
- Python (v3.8 or higher) for backend
- npm or yarn
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chat-app.git
   cd chat-app
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your_jwt_secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn main:app --reload
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## WebSocket Implementation

The application uses WebSockets for real-time communication. The WebSocket service (`websocket-service.jsx`) handles:

- Connection establishment and authentication
- Automatic reconnection on connection loss
- Ping/pong mechanism to keep connections alive
- Message sending and receiving
- Typing indicators
- User status updates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React team for the amazing frontend library
- FastAPI team for the excellent Python web framework
- All contributors who have helped with this project 