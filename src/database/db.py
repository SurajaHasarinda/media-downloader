import aiosqlite
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from src.database.models import WishlistItem, MovieStatus, User, FavoriteItem

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "data" / "media_downloader.db"


class Database:
    """Simple async database handler for wishlist operations."""
    
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Create the wishlist, users, and settings tables if they don't exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS wishlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tmdb_id INTEGER UNIQUE,
                    imdb_id TEXT,
                    title TEXT NOT NULL,
                    release_date TEXT,
                    overview TEXT,
                    genres TEXT,
                    poster_url TEXT,
                    vote_average REAL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create users table for authentication
            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    is_default BOOLEAN DEFAULT 1
                )
            """)
            
            # Create favorites table for liked movies (recommendations)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tmdb_id INTEGER UNIQUE,
                    imdb_id TEXT,
                    title TEXT NOT NULL,
                    release_date TEXT,
                    overview TEXT,
                    genres TEXT,
                    poster_url TEXT,
                    vote_average REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create app_settings table for configurable settings
            await db.execute("""
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
    
    async def add_to_wishlist(self, item: WishlistItem) -> int:
        """Add a movie to the wishlist. Returns the new ID."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT OR REPLACE INTO wishlist 
                (tmdb_id, imdb_id, title, release_date, overview, genres, 
                 poster_url, vote_average, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.tmdb_id, item.imdb_id, item.title, item.release_date,
                item.overview, item.genres, item.poster_url,
                item.vote_average, item.status.value
            ))
            await db.commit()
            return cursor.lastrowid
    
    async def get_wishlist(self, *statuses: MovieStatus) -> List[WishlistItem]:
        """Get all wishlist items, optionally filtered by one or more statuses."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            
            if statuses:
                placeholders = ','.join(['?' for _ in statuses])
                cursor = await db.execute(
                    f"SELECT * FROM wishlist WHERE status IN ({placeholders}) ORDER BY created_at DESC",
                    [s.value for s in statuses]
                )
            else:
                cursor = await db.execute(
                    "SELECT * FROM wishlist ORDER BY created_at DESC"
                )
            
            rows = await cursor.fetchall()
            return [WishlistItem(
                id=row['id'],
                tmdb_id=row['tmdb_id'],
                imdb_id=row['imdb_id'],
                title=row['title'],
                release_date=row['release_date'],
                overview=row['overview'],
                genres=row['genres'],
                poster_url=row['poster_url'],
                vote_average=row['vote_average'],
                status=MovieStatus(row['status']),
                created_at=row['created_at']
            ) for row in rows]
    
    async def get_wishlist_item(self, tmdb_id: int) -> Optional[WishlistItem]:
        """Get a specific wishlist item by TMDB ID."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM wishlist WHERE tmdb_id = ?",
                (tmdb_id,)
            )
            row = await cursor.fetchone()
            
            if row:
                return WishlistItem(
                    id=row['id'],
                    tmdb_id=row['tmdb_id'],
                    imdb_id=row['imdb_id'],
                    title=row['title'],
                    release_date=row['release_date'],
                    overview=row['overview'],
                    genres=row['genres'],
                    poster_url=row['poster_url'],
                    vote_average=row['vote_average'],
                    status=MovieStatus(row['status']),
                    created_at=row['created_at']
                )
            return None
    
    async def update_status(self, tmdb_id: int, status: MovieStatus):
        """Update the status of a wishlist item."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE wishlist SET status = ? WHERE tmdb_id = ?",
                (status.value, tmdb_id)
            )
            await db.commit()
    
    async def remove_from_wishlist(self, tmdb_id: int) -> bool:
        """Remove a movie from the wishlist. Returns True if deleted."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "DELETE FROM wishlist WHERE tmdb_id = ?", 
                (tmdb_id,)
            )
            await db.commit()
            return cursor.rowcount > 0
    
    # ============ Favorites Management ============
    
    async def add_to_favorites(self, item: FavoriteItem) -> int:
        """Add a movie to favorites. Returns the new ID."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT OR REPLACE INTO favorites 
                (tmdb_id, imdb_id, title, release_date, overview, genres, 
                 poster_url, vote_average)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.tmdb_id, item.imdb_id, item.title, item.release_date,
                item.overview, item.genres, item.poster_url,
                item.vote_average
            ))
            await db.commit()
            return cursor.lastrowid
    
    async def get_favorites(self) -> List[FavoriteItem]:
        """Get all favorite movies."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM favorites ORDER BY created_at DESC"
            )
            rows = await cursor.fetchall()
            return [FavoriteItem(
                id=row['id'],
                tmdb_id=row['tmdb_id'],
                imdb_id=row['imdb_id'],
                title=row['title'],
                release_date=row['release_date'],
                overview=row['overview'],
                genres=row['genres'],
                poster_url=row['poster_url'],
                vote_average=row['vote_average'],
                created_at=row['created_at']
            ) for row in rows]
    
    async def get_favorite_item(self, tmdb_id: int) -> Optional[FavoriteItem]:
        """Get a specific favorite item by TMDB ID."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM favorites WHERE tmdb_id = ?",
                (tmdb_id,)
            )
            row = await cursor.fetchone()
            if row:
                return FavoriteItem(
                    id=row['id'],
                    tmdb_id=row['tmdb_id'],
                    imdb_id=row['imdb_id'],
                    title=row['title'],
                    release_date=row['release_date'],
                    overview=row['overview'],
                    genres=row['genres'],
                    poster_url=row['poster_url'],
                    vote_average=row['vote_average'],
                    created_at=row['created_at']
                )
            return None
    
    async def is_favorite(self, tmdb_id: int) -> bool:
        """Check if a movie is in favorites."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT 1 FROM favorites WHERE tmdb_id = ? LIMIT 1",
                (tmdb_id,)
            )
            row = await cursor.fetchone()
            return row is not None
    
    async def remove_from_favorites(self, tmdb_id: int) -> bool:
        """Remove a movie from favorites. Returns True if deleted."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "DELETE FROM favorites WHERE tmdb_id = ?", 
                (tmdb_id,)
            )
            await db.commit()
            return cursor.rowcount > 0
    
    async def get_favorite_tmdb_ids(self) -> List[int]:
        """Get all TMDB IDs from favorites (for quick lookup)."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT tmdb_id FROM favorites")
            rows = await cursor.fetchall()
            return [row[0] for row in rows]
    
    # ============ User Management ============
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM users WHERE username = ?",
                (username,)
            )
            row = await cursor.fetchone()
            
            if row:
                return User(
                    id=row['id'],
                    username=row['username'],
                    hashed_password=row['hashed_password'],
                    is_default=bool(row['is_default'])
                )
            return None
    
    async def create_user(self, username: str, hashed_password: str, is_default: bool = True) -> int:
        """Create a new user. Returns the new ID."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "INSERT INTO users (username, hashed_password, is_default) VALUES (?, ?, ?)",
                (username, hashed_password, is_default)
            )
            await db.commit()
            return cursor.lastrowid
    
    async def update_user(self, username: str, **updates) -> bool:
        """Update user fields. Returns True if updated."""
        if not updates:
            return False
        
        set_clauses = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [username]
        
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                f"UPDATE users SET {set_clauses} WHERE username = ?",
                values
            )
            await db.commit()
            return cursor.rowcount > 0
    
    async def update_username(self, current_username: str, new_username: str, is_default: bool | None = None) -> bool:
        """Update username and optionally is_default flag. Returns True if updated."""
        async with aiosqlite.connect(self.db_path) as db:
            if is_default is not None:
                cursor = await db.execute(
                    "UPDATE users SET username = ?, is_default = ? WHERE username = ?",
                    (new_username, is_default, current_username)
                )
            else:
                cursor = await db.execute(
                    "UPDATE users SET username = ? WHERE username = ?",
                    (new_username, current_username)
                )
            await db.commit()
            return cursor.rowcount > 0
    
    async def check_non_default_user_exists(self) -> bool:
        """Check if there's a non-default user in the system."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT 1 FROM users WHERE is_default = 0 LIMIT 1"
            )
            row = await cursor.fetchone()
            return row is not None
    
    # ============ Settings Methods ============
    
    async def get_setting(self, key: str) -> Optional[str]:
        """Get a setting value by key."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT value FROM app_settings WHERE key = ?",
                (key,)
            )
            row = await cursor.fetchone()
            return row[0] if row else None
    
    async def set_setting(self, key: str, value: str) -> None:
        """Set a setting value (insert or update)."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """INSERT INTO app_settings (key, value, updated_at) 
                   VALUES (?, ?, CURRENT_TIMESTAMP)
                   ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP""",
                (key, value, value)
            )
            await db.commit()
    
    async def get_all_settings(self) -> dict:
        """Get all settings as a dictionary."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT key, value FROM app_settings")
            rows = await cursor.fetchall()
            return {row[0]: row[1] for row in rows}

