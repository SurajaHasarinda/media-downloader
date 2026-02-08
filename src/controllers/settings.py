from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from src.database import Database
from src.database.models import ServiceSettings
from src.core.deps import get_current_user
from src.core.config import load_settings_from_db

router = APIRouter(prefix="/settings", tags=["settings"])
db = Database()


@router.get("", response_model=ServiceSettings)
async def get_settings(current_user: str = Depends(get_current_user)):
    """Get all service settings."""
    settings_dict = await db.get_all_settings()
    
    return ServiceSettings(
        tmdb_api_key=settings_dict.get("TMDB_API_KEY", ""),
        prowlarr_url=settings_dict.get("PROWLARR_URL", "http://localhost:9696"),
        prowlarr_api_key=settings_dict.get("PROWLARR_API_KEY", ""),
        qbittorrent_host=settings_dict.get("QBITTORRENT_HOST", "http://localhost:8080"),
        qbittorrent_username=settings_dict.get("QBITTORRENT_USERNAME", ""),
        qbittorrent_password=settings_dict.get("QBITTORRENT_PASSWORD", ""),
        download_path=settings_dict.get("DOWNLOAD_PATH", "./downloads"),
    )


@router.put("")
async def update_settings(
    settings: ServiceSettings,
    current_user: str = Depends(get_current_user)
):
    """Update service settings."""
    # Only update non-None values
    if settings.tmdb_api_key is not None:
        await db.set_setting("TMDB_API_KEY", settings.tmdb_api_key)
    
    if settings.prowlarr_url is not None:
        await db.set_setting("PROWLARR_URL", settings.prowlarr_url)
    
    if settings.prowlarr_api_key is not None:
        await db.set_setting("PROWLARR_API_KEY", settings.prowlarr_api_key)
    
    if settings.qbittorrent_host is not None:
        await db.set_setting("QBITTORRENT_HOST", settings.qbittorrent_host)
    
    if settings.qbittorrent_username is not None:
        await db.set_setting("QBITTORRENT_USERNAME", settings.qbittorrent_username)
    
    if settings.qbittorrent_password is not None:
        await db.set_setting("QBITTORRENT_PASSWORD", settings.qbittorrent_password)
    
    if settings.download_path is not None:
        await db.set_setting("DOWNLOAD_PATH", settings.download_path)
    
    # Refresh the settings cache so services pick up new values
    await load_settings_from_db()
    
    return {"msg": "Settings updated successfully"}

