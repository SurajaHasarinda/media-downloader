from typing import List
from fastapi import APIRouter, HTTPException

from src.database import Database, FavoriteItem
from src.services import TMDBService


router = APIRouter(prefix="/favorites", tags=["Favorites"])
db = Database()
tmdb = TMDBService()


@router.get("", response_model=List[FavoriteItem])
async def get_favorites():
    """Get all favorite/liked movies."""
    return await db.get_favorites()


@router.get("/ids", response_model=List[int])
async def get_favorite_ids():
    """Get all TMDB IDs of favorite movies (for quick lookup)."""
    return await db.get_favorite_tmdb_ids()


@router.post("/{tmdb_id}")
async def toggle_favorite(tmdb_id: int):
    """Toggle a movie as favorite. If already favorited, removes it; otherwise adds it."""
    # Check if already in favorites
    existing = await db.get_favorite_item(tmdb_id)
    if existing:
        # Remove from favorites (toggle off)
        await db.remove_from_favorites(tmdb_id)
        return {"action": "removed", "tmdb_id": tmdb_id}
    
    # Get movie details from TMDB
    details = tmdb.get_movie_details(tmdb_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found on TMDB")
    
    # Create favorite item
    item = FavoriteItem(
        tmdb_id=details['tmdb_id'],
        imdb_id=details.get('imdb_id'),
        title=details['title'],
        release_date=details.get('release_date'),
        overview=details.get('overview'),
        genres=details.get('genres'),
        poster_url=details.get('poster_url'),
        vote_average=details.get('vote_average'),
    )
    
    await db.add_to_favorites(item)
    favorite = await db.get_favorite_item(tmdb_id)
    return {"action": "added", "favorite": favorite}


@router.delete("/{tmdb_id}")
async def remove_from_favorites(tmdb_id: int):
    """Remove a movie from favorites."""
    deleted = await db.remove_from_favorites(tmdb_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Movie not in favorites")
    return {"message": f"Movie {tmdb_id} removed from favorites"}
