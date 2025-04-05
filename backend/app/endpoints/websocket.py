import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from app.utils.websocket import manager
from app.config import settings
import logging
import traceback
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "chat_app")

# MongoDB client
client = None

router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("New WebSocket connection attempt")
    
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        logger.warning("WebSocket connection rejected: Missing token")
        await websocket.close(code=1008, reason="Missing token")
        return
    
    # Validate token
    try:
        logger.info(f"Validating token: {token[:10]}...")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        user_id = str(payload.get("user_id"))
        
        logger.info(f"Token payload: username={username}, user_id={user_id}")
        
        if not username or not user_id:
            logger.warning(f"WebSocket connection rejected: Invalid token payload - username: {username}, user_id: {user_id}")
            await websocket.close(code=1008, reason="Invalid token")
            return
            
        logger.info(f"WebSocket connection authenticated for user: {username} (ID: {user_id})")
        
        # Accept the WebSocket connection before proceeding
        await websocket.accept()
        
        # Connect to WebSocket manager
        await manager.connect(websocket, user_id)
        logger.info(f"WebSocket connection established for user: {user_id}")
        
        # Notify other users that this user is online
        await manager.broadcast(
            {
                "type": "user_status",
                "data": {
                    "user_id": user_id,
                    "status": "online"
                }
            },
            exclude=user_id
        )
        logger.info(f"Broadcast sent: user {user_id} is online")
        
        # Connect to MongoDB
        global client
        if client is None:
            client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DB_NAME]
        
        try:
            while True:
                # Wait for messages from the client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                logger.info(f"Received message from user {user_id}: {message_data.get('type', 'unknown')}")
                
                # Handle different message types
                if message_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif message_data.get("type") == "typing":
                    chat_id = message_data.get("chat_id")
                    chat_type = message_data.get("chat_type")
                    
                    if chat_type == "private":
                        # Notify the other user
                        await manager.send_personal_message(
                            {
                                "type": "typing",
                                "data": {
                                    "user_id": user_id,
                                    "chat_id": chat_id
                                }
                            },
                            chat_id
                        )
                    elif chat_type == "group":
                        # Notify all group members
                        group = await db.groups.find_one({"_id": ObjectId(chat_id)})
                        if group and "member_ids" in group:
                            for member_id in group["member_ids"]:
                                if str(member_id) != user_id:  # Convert member_id to string for comparison
                                    await manager.send_personal_message(
                                        {
                                            "type": "typing",
                                            "data": {
                                                "user_id": user_id,
                                                "chat_id": chat_id
                                            }
                                        },
                                        str(member_id)  # Convert member_id to string
                                    )
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user: {user_id}")
            manager.disconnect(user_id)
            # Notify other users that this user is offline
            await manager.broadcast(
                {
                    "type": "user_status",
                    "data": {
                        "user_id": user_id,
                        "status": "offline"
                    }
                },
                exclude=user_id
            )
            logger.info(f"Broadcast sent: user {user_id} is offline")
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {str(e)}")
            logger.error(traceback.format_exc())
        finally:
            logger.info(f"WebSocket connection closed for user: {user_id}")
    except JWTError as e:
        logger.error(f"WebSocket connection rejected: Token validation failed - {str(e)}")
        logger.error(traceback.format_exc())
        await websocket.close(code=1008, reason="Invalid token")
        return
    except Exception as e:
        logger.error(f"Unexpected error during WebSocket connection: {str(e)}")
        logger.error(traceback.format_exc())
        await websocket.close(code=1011, reason="Internal server error")
        return

