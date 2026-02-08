from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends

from src.database import Database
from src.core.auth import verify_password, get_password_hash, create_access_token
from src.core.config import settings
from src.core.deps import get_current_user
from src.database.models import LoginRequest, Token, ChangePassword, ChangeUsername, Msg

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database instance
db = Database()


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Login endpoint to get access token.
    """
    user = await db.get_user_by_username(login_data.username)
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if there's a non-default user in the system
    non_default_user_exists = await db.check_non_default_user_exists()
    
    # If a non-default user exists and current user is trying to login with default account, block it
    if non_default_user_exists and user.is_default:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Default credentials are no longer valid. Please use your custom credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/change-password", response_model=Msg)
async def change_password(
    password_data: ChangePassword,
    current_user: str = Depends(get_current_user)
):
    """
    Change current user's password.
    """
    user = await db.get_user_by_username(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    new_hashed_password = get_password_hash(password_data.new_password)
    
    # Update password and mark as non-default if it was default
    updates = {"hashed_password": new_hashed_password}
    if user.is_default:
        updates["is_default"] = False
    
    await db.update_user(current_user, **updates)
    return {"msg": "Password updated successfully"}


@router.post("/change-username", response_model=Msg)
async def change_username(
    username_data: ChangeUsername,
    current_user: str = Depends(get_current_user)
):
    """
    Change the username (single user system).
    """
    user = await db.get_user_by_username(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(username_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    
    # Update username and mark as non-default if it was default
    new_username = username_data.new_username
    is_default = False if user.is_default else None
    
    await db.update_username(current_user, new_username, is_default)
    return {"msg": "Username updated successfully"}
