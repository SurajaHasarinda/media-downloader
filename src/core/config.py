from pydantic_settings import BaseSettings
from typing import Optional, Dict
import aiosqlite
from pathlib import Path


class Settings(BaseSettings):
    """Application settings from environment."""
    
    PROJECT_NAME: str = "Media Downloader API"
    
    # Authentication
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # TMDB API
    TMDB_API_KEY: str = ""
    
    # Prowlarr Configuration
    PROWLARR_URL: str = "http://localhost:9696"
    PROWLARR_API_KEY: str = ""
    
    # qBittorrent Configuration
    QBITTORRENT_HOST: str = "http://localhost:8080"
    QBITTORRENT_USERNAME: str = ""
    QBITTORRENT_PASSWORD: str = ""
    
    # Download Directory
    DOWNLOAD_PATH: str = "./downloads"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


# Static settings from .env
settings = Settings()

# Database path for dynamic settings
DB_PATH = Path(__file__).parent.parent.parent / "data" / "media_downloader.db"

# In-memory cache for database settings
_settings_cache: Dict[str, str] = {}


async def load_settings_from_db() -> None:
    """Load all settings from database into cache."""
    global _settings_cache
    if not DB_PATH.exists():
        return
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("SELECT key, value FROM app_settings")
            rows = await cursor.fetchall()
            _settings_cache = {row[0]: row[1] for row in rows if row[1]}
    except Exception:
        pass


async def get_db_setting(key: str) -> Optional[str]:
    """Get a setting from the database."""
    if not DB_PATH.exists():
        return None
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(
                "SELECT value FROM app_settings WHERE key = ?",
                (key,)
            )
            row = await cursor.fetchone()
            return row[0] if row else None
    except Exception:
        return None


async def get_setting(key: str, default: str = "") -> str:
    """Get a setting - checks database first, then falls back to env/default."""
    # First check database
    db_value = await get_db_setting(key)
    if db_value is not None and db_value != "":
        return db_value
    
    # Fall back to environment/static settings
    return getattr(settings, key, default)


def get_setting_sync(key: str, default: str = "") -> str:
    """
    Get a setting synchronously.
    First checks cache, then falls back to env/default.
    Cache is populated by load_settings_from_db() on app startup.
    """
    # Check cache first
    if key in _settings_cache and _settings_cache[key]:
        return _settings_cache[key]
    
    # Fall back to environment/static settings
    return getattr(settings, key, default)



