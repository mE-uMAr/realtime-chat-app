import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.endpoints import auth, users, groups, messages, websocket
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import os
import json
import jwt
from dotenv import load_dotenv
import asyncio
import logging
from passlib.context import CryptContext
from app.config import settings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(messages.router)
app.include_router(websocket.router)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "chat_app")

# JWT settings - using settings from app.config
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# MongoDB client
client = None

# WebSocket connection manager
class ConnectionManager:
  def __init__(self):
      self.active_connections: Dict[str, WebSocket] = {}
  
  async def connect(self, websocket: WebSocket, user_id: str):
      await websocket.accept()
      self.active_connections[user_id] = websocket
      logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
  
  def disconnect(self, user_id: str):
      if user_id in self.active_connections:
          del self.active_connections[user_id]
          logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
  
  async def send_personal_message(self, message: dict, user_id: str):
      if user_id in self.active_connections:
          await self.active_connections[user_id].send_json(message)
  
  async def broadcast(self, message: dict, exclude: Optional[str] = None):
      for user_id, connection in self.active_connections.items():
          if user_id != exclude:
              await connection.send_json(message)

# Create a global connection manager
manager = ConnectionManager()

# Helper for ObjectId conversion
class PyObjectId(ObjectId):
  @classmethod
  def __get_validators__(cls):
      yield cls.validate
  
  @classmethod
  def validate(cls, v):
      if not ObjectId.is_valid(v):
          raise ValueError("Invalid ObjectId")
      return ObjectId(v)
  
  @classmethod
  def __get_pydantic_json_schema__(cls, _schema_generator):
      return {"type": "string"}

# Models
class UserBase(BaseModel):
  username: str
  email: str
  full_name: Optional[str] = None
  
class UserCreate(UserBase):
  password: str

class UserInDB(UserBase):
  id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
  hashed_password: str
  created_at: datetime = Field(default_factory=datetime.utcnow)
  updated_at: datetime = Field(default_factory=datetime.utcnow)
  
  class Config:
      validate_by_name = True
      arbitrary_types_allowed = True
      json_schema_extra = {"json_encoders": {ObjectId: str}}

class User(UserBase):
  id: str
  created_at: datetime
  updated_at: datetime
  
  class Config:
      from_attributes = True

class UserPublic(BaseModel):
  id: str
  username: str
  full_name: Optional[str] = None
  
  class Config:
      from_attributes = True

class Token(BaseModel):
  access_token: str
  token_type: str
  user: UserPublic

class TokenData(BaseModel):
  username: Optional[str] = None
  user_id: Optional[str] = None

class MessageBase(BaseModel):
  content: str
  chat_id: str
  chat_type: str  # "private" or "group"

class MessageCreate(MessageBase):
  pass

class Message(MessageBase):
  id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
  sender_id: str
  created_at: datetime = Field(default_factory=datetime.utcnow)
  
  class Config:
      validate_by_name = True
      arbitrary_types_allowed = True
      json_schema_extra = {"json_encoders": {ObjectId: str}}

class MessageOut(BaseModel):
  id: str
  content: str
  sender_id: str
  chat_id: str
  chat_type: str
  created_at: datetime
  sender: Optional[UserPublic] = None
  
  class Config:
      from_attributes = True

class GroupBase(BaseModel):
  name: str
  description: Optional[str] = None

class GroupCreate(GroupBase):
  member_ids: List[str]

class Group(GroupBase):
  id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
  creator_id: str
  member_ids: List[str]
  created_at: datetime = Field(default_factory=datetime.utcnow)
  updated_at: datetime = Field(default_factory=datetime.utcnow)
  
  class Config:
      validate_by_name = True
      arbitrary_types_allowed = True
      json_schema_extra = {"json_encoders": {ObjectId: str}}

class GroupOut(BaseModel):
  id: str
  name: str
  description: Optional[str] = None
  creator_id: str
  member_ids: List[str]
  created_at: datetime
  updated_at: datetime
  members: Optional[List[UserPublic]] = None
  
  class Config:
      from_attributes = True

class WSMessage(BaseModel):
  type: str
  data: Dict[str, Any]

# Database connection
@app.on_event("startup")
async def startup_db_client():
  global client
  client = AsyncIOMotorClient(MONGODB_URL)
  app.mongodb = client[DB_NAME]
  
  # Create indexes
  await app.mongodb["users"].create_index("username", unique=True)
  await app.mongodb["users"].create_index("email", unique=True)

@app.on_event("shutdown")
async def shutdown_db_client():
  global client
  if client:
      client.close()

# Authentication functions
def verify_password(plain_password, hashed_password):
  return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
  return pwd_context.hash(password)

async def get_user(username: str):
  user = await app.mongodb["users"].find_one({"username": username})
  if user:
      return UserInDB(**user)

async def get_user_by_id(user_id: str):
  if not ObjectId.is_valid(user_id):
      return None
  user = await app.mongodb["users"].find_one({"_id": ObjectId(user_id)})
  if user:
      return UserInDB(**user)

async def authenticate_user(username: str, password: str):
  user = await get_user(username)
  if not user:
      return False
  if not verify_password(password, user.hashed_password):
      return False
  return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  to_encode = data.copy()
  if expires_delta:
      expire = datetime.utcnow() + expires_delta
  else:
      expire = datetime.utcnow() + timedelta(minutes=15)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
  credentials_exception = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
  )
  try:
      payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      username: str = payload.get("sub")
      user_id: str = payload.get("user_id")
      if username is None or user_id is None:
          raise credentials_exception
      token_data = TokenData(username=username, user_id=user_id)
  except jwt.PyJWTError:
      raise credentials_exception
  user = await get_user(username=token_data.username)
  if user is None:
      raise credentials_exception
  return user

@app.get("/")
async def root():
  return {"message": "Welcome to the Chat API"}

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

