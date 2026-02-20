from .movies import router as movies_router
from .wishlist import router as wishlist_router
from .favorites import router as favorites_router
from .downloads import router as downloads_router
from .storage import router as storage_router
from .auth import router as auth_router
from .settings import router as settings_router

__all__ = ["movies_router", "wishlist_router", "favorites_router", "downloads_router", "storage_router", "auth_router", "settings_router"]

