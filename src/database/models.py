from enum import Enum
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ============ Enums ============

class MovieStatus(str, Enum):
    """Status of a movie in the wishlist."""
    PENDING = "pending"
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    NOT_FOUND = "not_found"


# ============ Authentication Models ============

class User(BaseModel):
    """User model for authentication."""
    id: Optional[int] = None
    username: str
    hashed_password: str
    is_default: bool = True  # True = default admin, False = user changed credentials

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Login request body."""
    username: str
    password: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token payload data."""
    username: Optional[str] = None


class ChangePassword(BaseModel):
    """Change password request body."""
    current_password: str
    new_password: str


class ChangeUsername(BaseModel):
    """Change username request body."""
    new_username: str
    password: str


# ============ Movie & Wishlist Models ============

class MovieBase(BaseModel):
    """Base movie information from TMDB."""
    tmdb_id: int
    title: str
    release_date: Optional[str] = None
    overview: Optional[str] = None
    vote_average: Optional[float] = None
    poster_url: Optional[str] = None


class MovieDetails(MovieBase):
    """Full movie details including IMDB ID."""
    imdb_id: Optional[str] = None
    genres: Optional[str] = None
    runtime: Optional[int] = None


class MovieSearchResult(BaseModel):
    """Movie search result from TMDB."""
    tmdb_id: int
    title: str
    release_date: Optional[str] = None
    vote_average: Optional[float] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None


class WishlistItem(BaseModel):
    """A movie in the wishlist."""
    id: Optional[int] = None
    tmdb_id: int
    imdb_id: Optional[str] = None
    title: str
    release_date: Optional[str] = None
    overview: Optional[str] = None
    genres: Optional[str] = None
    poster_url: Optional[str] = None
    vote_average: Optional[float] = None
    status: MovieStatus = MovieStatus.PENDING
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AddToWishlistRequest(BaseModel):
    """Request body for adding a movie to wishlist."""
    tmdb_id: int


# ============ Download & Torrent Models ============

class TorrentInfo(BaseModel):
    """Basic torrent information."""
    title: str
    size_gb: float
    seeders: int
    quality: str
    source: str


class DownloadResult(BaseModel):
    """Result of a torrent download attempt."""
    tmdb_id: int
    title: str
    status: str
    message: str


class ProcessResult(BaseModel):
    """Result of processing the wishlist."""
    processed: int
    queued: int
    not_found: int
    results: List[DownloadResult]


# ============ Schedule Models ============

class ScheduleCreate(BaseModel):
    """Request body for creating a schedule."""
    name: str = Field(..., min_length=1, max_length=100)
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(0, ge=0, le=59)
    max_size_gb: float = Field(2.0, ge=0.1, le=50)
    min_quality: int = Field(720, ge=480, le=2160)
    enabled: bool = True


class ScheduleUpdate(BaseModel):
    """Request body for updating a schedule."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: Optional[int] = Field(None, ge=0, le=59)
    max_size_gb: Optional[float] = Field(None, ge=0.1, le=50)
    min_quality: Optional[int] = Field(None, ge=480, le=2160)
    enabled: Optional[bool] = None


class ScheduleResponse(BaseModel):
    """Response model for a schedule."""
    id: int
    name: str
    cron_hour: int
    cron_minute: int
    max_size_gb: float
    min_quality: int
    enabled: bool
    last_run: Optional[str] = None
    next_run: Optional[str] = None
    created_at: Optional[str] = None


# ============ Settings & Storage Models ============

class ServiceSettings(BaseModel):
    """Service configuration settings."""
    # TMDB
    tmdb_api_key: Optional[str] = None
    
    # Prowlarr
    prowlarr_url: Optional[str] = None
    prowlarr_api_key: Optional[str] = None
    
    # qBittorrent
    qbittorrent_host: Optional[str] = None
    qbittorrent_username: Optional[str] = None
    qbittorrent_password: Optional[str] = None
    
    # Download path
    download_path: Optional[str] = None


class FolderItem(BaseModel):
    """A folder in the downloads directory."""
    name: str
    size_gb: float


class DeleteResponse(BaseModel):
    """Response for delete operation."""
    success: bool
    message: str


# ============ Misc Models ============

class Msg(BaseModel):
    """Simple message response."""
    msg: str
