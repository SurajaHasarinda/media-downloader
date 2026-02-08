from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from src.database import Database, WishlistItem, MovieStatus
from src.services import TMDBService


router = APIRouter(prefix="/wishlist", tags=["Wishlist"])
db = Database()
tmdb = TMDBService()


@router.get("", response_model=List[WishlistItem])
async def get_wishlist(
    status: Optional[MovieStatus] = Query(None, description="Filter by status")
):
    """Get all movies in the wishlist."""
    if status:
        return await db.get_wishlist(status)
    return await db.get_wishlist()


@router.post("/{tmdb_id}", response_model=WishlistItem)
async def add_to_wishlist(tmdb_id: int):
    """Add a movie to the wishlist by TMDB ID."""
    # Check if already in wishlist
    existing = await db.get_wishlist_item(tmdb_id)
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in wishlist")
    
    # Get movie details from TMDB
    details = tmdb.get_movie_details(tmdb_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found on TMDB")
    
    # Create wishlist item
    item = WishlistItem(
        tmdb_id=details['tmdb_id'],
        imdb_id=details.get('imdb_id'),
        title=details['title'],
        release_date=details.get('release_date'),
        overview=details.get('overview'),
        genres=details.get('genres'),
        poster_url=details.get('poster_url'),
        vote_average=details.get('vote_average'),
        status=MovieStatus.PENDING
    )
    
    await db.add_to_wishlist(item)
    return await db.get_wishlist_item(tmdb_id)


@router.delete("/{tmdb_id}")
async def remove_from_wishlist(tmdb_id: int):
    """Remove a movie from the wishlist."""
    deleted = await db.remove_from_wishlist(tmdb_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Movie not in wishlist")
    return {"message": f"Movie {tmdb_id} removed from wishlist"}
