"""
Media Downloader - FastAPI Application

A simple API to:
- Search movies from TMDB
- Add movies to a wishlist
- Trigger download processing (searches torrents and queues them)
- Schedule automatic processing
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from src.database import Database
from src.services import QBittorrentService
from src.services.scheduler_service import SchedulerService
from src.controllers import movies_router, wishlist_router, downloads_router, storage_router, auth_router, settings_router
from src.controllers.schedules import router as schedules_router
from src.core.auth import get_password_hash
from src.core.deps import get_current_user


# ============ App Setup ============

db = Database()
qbittorrent = QBittorrentService()
scheduler = SchedulerService.get_instance()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database, settings cache, and scheduler on startup."""
    from src.core.config import load_settings_from_db
    
    await db.initialize()
    await load_settings_from_db()  # Load settings from DB into cache
    
    # Create default admin user if not exists
    admin_user = await db.get_user_by_username("admin")
    if not admin_user:
        await db.create_user(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_default=True
        )
        print("Default admin user created - Please change credentials on first login")
    
    await scheduler.initialize()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Media Downloader",
    description="Search movies, manage wishlist, schedule downloads",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Include Routers ============

app.include_router(auth_router, prefix="/api")  # Auth first (no auth required for login)
app.include_router(movies_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(wishlist_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(downloads_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(schedules_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(storage_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(settings_router, prefix="/api", dependencies=[Depends(get_current_user)])


# ============ Health Check ============

@app.get("/health", tags=["System"])
async def health_check():
    """Check API and service health."""
    return {
        "status": "ok",
        "qbittorrent_connected": qbittorrent.is_connected()
    }


# ============ Static Files (Frontend) ============

# Serve frontend static files if available (for production/docker)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8095)

