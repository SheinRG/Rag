"""
Nexus — Auth Routes
Wraps Supabase Auth for signup, login, and user info.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from supabase_auth.errors import AuthApiError

from database import supabase
from auth_middleware import get_current_user
from models.schemas import AuthRequest, AuthResponse, UserResponse, MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=MessageResponse)
async def register(body: AuthRequest):
    """Register a new user via Supabase Auth."""
    try:
        response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })

        # Supabase returns user even if email already exists (with no session)
        if response.user and response.session is None:
            # Check if it's because the user already exists (identities empty)
            if hasattr(response.user, 'identities') and len(response.user.identities) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists.",
                )

        return MessageResponse(
            message="Account created! Check your email to confirm your account."
        )

    except HTTPException:
        raise
    except AuthApiError as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again.",
        )


@router.post("/login", response_model=AuthResponse)
async def login(body: AuthRequest):
    """Log in an existing user and return an access token."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })

        return AuthResponse(
            access_token=response.session.access_token,
            user={
                "id": str(response.user.id),
                "email": response.user.email,
            },
        )

    except AuthApiError as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again.",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
    )
