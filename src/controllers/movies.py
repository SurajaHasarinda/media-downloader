from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from src.database.models import MovieSearchResult
from src.services import TMDBService
from src.database import Database


router = APIRouter(prefix="/movies", tags=["Movies"])
tmdb = TMDBService()
db = Database()


@router.get("/search", response_model=List[MovieSearchResult])
async def search_movies(
    query: str = Query(..., description="Movie name to search"),
    limit: int = Query(10, ge=1, le=50, description="Max results")
):
    """Search for movies by name."""
    results = tmdb.search_movies(query, limit)
    return results


@router.get("/popular", response_model=List[MovieSearchResult])
async def get_popular_movies(
    limit: int = Query(20, ge=1, le=50, description="Max results")
):
    """Get currently popular movies."""
    results = tmdb.get_popular_movies(limit)
    return results


@router.get("/recommendations")
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50, description="Max results")
):
    """Get movie recommendations based on the user's favorite movies."""
    favorite_ids = await db.get_favorite_tmdb_ids()
    if not favorite_ids:
        return []
    
    recommendations = tmdb.get_recommendations(favorite_ids, limit)
    return recommendations


@router.get("/{tmdb_id}")
async def get_movie_details(tmdb_id: int):
    """Get full details for a movie by TMDB ID."""
    details = tmdb.get_movie_details(tmdb_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found")
    return details
