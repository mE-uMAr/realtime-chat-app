import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the secret key from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# The token to decode
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtZWhhciIsInVzZXJfaWQiOjEsImV4cCI6MTc0MzkzMTczMn0.dmCt2P5JrfKSW50k4lQIA0AsqFcZPJ8coxK4S8jYb7A"

try:
    # Decode the token
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    print("Token decoded successfully!")
    print("Payload:", payload)
except jwt.PyJWTError as e:
    print(f"Error decoding token: {e}") 