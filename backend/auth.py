"""
Auth Module — OptiVision AI
JWT-based authentication (100% FOSS, replaces Clerk).
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import bcrypt

from backend.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Config ---
SECRET_KEY = "optivision-ai-secret-key-change-in-production-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# --- Models ---
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    username: str


# --- Helpers ---
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """FastAPI dependency to get the current authenticated user."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    conn = get_db()
    user = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)


# --- Endpoints ---
@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    conn = get_db()

    # Check if email or username already exists
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ? OR username = ?",
        (req.email, req.username),
    ).fetchone()

    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email or username already registered")

    hashed = hash_password(req.password)
    cursor = conn.execute(
        "INSERT INTO users (email, username, hashed_password) VALUES (?, ?, ?)",
        (req.email, req.username, hashed),
    )
    user_id = cursor.lastrowid

    # Create default settings
    conn.execute(
        "INSERT INTO user_settings (user_id, notifications_enabled) VALUES (?, 0)",
        (user_id,),
    )
    conn.commit()

    token = create_access_token({"user_id": user_id, "email": req.email})

    user = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return TokenResponse(
        access_token=token,
        user=dict(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    conn = get_db()
    user = conn.execute(
        "SELECT id, email, username, hashed_password FROM users WHERE email = ?",
        (req.email,),
    ).fetchone()
    conn.close()

    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user["id"], "email": user["email"]})

    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "username": user["username"]},
    )


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return user
