from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from datetime import datetime, timedelta
import logging

from ..settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer(auto_error=False)


def create_access_token(data: dict) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.APP_SECRET, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, settings.APP_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/login")
async def login(pin_data: dict):
    """
    Authenticate with household PIN.

    Expected payload: {"pin": "1234"}
    Returns JWT token for API access.
    """
    pin = pin_data.get("pin")

    if not pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN is required"
        )

    if pin != settings.HOUSEHOLD_PIN:
        logger.warning(f"Invalid login attempt with PIN: {pin[:2]}***")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    # Create token
    token_data = {"sub": "household", "type": "access"}
    access_token = create_access_token(token_data)

    response = JSONResponse(
        content={
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    )

    # Set HTTP-only cookie for web client
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )

    logger.info("Successful household login")
    return response


@router.post("/logout")
async def logout():
    """Logout by clearing the authentication cookie."""
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="access_token")
    return response


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user information."""
    # クッキーからトークンを取得
    token = request.cookies.get("access_token")

    if not token:
        # Authorizationヘッダーからも確認
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided"
        )

    payload = verify_token(token)
    return {
        "user_type": "household",
        "authenticated": True,
        "expires_at": payload.get("exp")
    }
