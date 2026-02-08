"""
TMDB Service - Simple movie search and details
"""

from typing import List, Dict, Optional
import tmdbsimple as tmdb
from src.core.config import get_setting_sync

TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"


class TMDBService:
    """Service for searching and getting movie details from TMDB."""
    
    @staticmethod
    def _configure_api():
        """Configure TMDB API key before each request."""
        tmdb.API_KEY = get_setting_sync("TMDB_API_KEY", "")
    
    @staticmethod
    def search_movies(query: str, limit: int = 10) -> List[Dict]:
        """
        Search for movies by name.
        
        Args:
            query: Movie name to search for
            limit: Maximum number of results (default 10)
            
        Returns:
            List of movie dictionaries with basic info
        """
        TMDBService._configure_api()
        try:
            search = tmdb.Search()
            search.movie(query=query)
            
            results = []
            for movie in search.results[:limit]:
                results.append({
                    'tmdb_id': movie['id'],
                    'title': movie['title'],
                    'release_date': movie.get('release_date', ''),
                    'vote_average': movie.get('vote_average', 0),
                    'overview': movie.get('overview', ''),
                    'poster_url': f"{TMDB_IMAGE_BASE}{movie['poster_path']}" if movie.get('poster_path') else None
                })
            
            return results
        except Exception as e:
            print(f"Error searching movies: {e}")
            return []
    
    @staticmethod
    def get_movie_details(tmdb_id: int) -> Optional[Dict]:
        """
        Get full movie details including IMDB ID.
        
        Args:
            tmdb_id: The TMDB movie ID
            
        Returns:
            Dictionary with movie information or None if not found
        """
        TMDBService._configure_api()
        try:
            movie = tmdb.Movies(tmdb_id)
            info = movie.info()
            external_ids = movie.external_ids()
            
            return {
                'tmdb_id': info['id'],
                'imdb_id': external_ids.get('imdb_id'),
                'title': info['title'],
                'overview': info.get('overview'),
                'release_date': info.get('release_date'),
                'runtime': info.get('runtime'),
                'genres': ', '.join([g['name'] for g in info.get('genres', [])]),
                'vote_average': info.get('vote_average'),
                'poster_url': f"{TMDB_IMAGE_BASE}{info['poster_path']}" if info.get('poster_path') else None
            }
        except Exception:
            return None
    
    @staticmethod
    def get_popular_movies(limit: int = 20) -> List[Dict]:
        """Get currently popular movies."""
        TMDBService._configure_api()
        try:
            movies = tmdb.Movies()
            popular = movies.popular()
            
            results = []
            for m in popular.get('results', [])[:limit]:
                results.append({
                    'tmdb_id': m['id'],
                    'title': m['title'],
                    'release_date': m.get('release_date', ''),
                    'vote_average': m.get('vote_average', 0),
                    'overview': m.get('overview', ''),
                    'poster_url': f"{TMDB_IMAGE_BASE}{m['poster_path']}" if m.get('poster_path') else None
                })
            
            return results
        except Exception as e:
            print(f"Error fetching popular movies: {e}")
            return []
