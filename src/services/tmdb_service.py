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
    
    @staticmethod
    def get_recommendations(tmdb_ids: List[int], limit: int = 20) -> List[Dict]:
        """
        Get movie recommendations based on a list of liked movie IDs.
        Shuffles seed movies and uses random TMDB pages so each call
        returns a different set of recommendations.
        
        Args:
            tmdb_ids: List of TMDB movie IDs to base recommendations on
            limit: Maximum number of results (default 20)
            
        Returns:
            List of recommended movie dictionaries
        """
        import random
        
        TMDBService._configure_api()
        seen_ids = set(tmdb_ids)  # Exclude source movies
        pool = []  # Collect a large pool then sample from it
        
        # Shuffle seed order so different favorites drive recommendations each time
        shuffled_ids = list(tmdb_ids)
        random.shuffle(shuffled_ids)
        
        try:
            for movie_id in shuffled_ids:
                try:
                    movie = tmdb.Movies(movie_id)
                    # Pick a random page (1-3) so we get different results each time
                    page = random.randint(1, 3)
                    recs = movie.recommendations(page=page)
                    
                    # If random page is empty, fall back to page 1
                    results = recs.get('results', [])
                    if not results and page > 1:
                        recs = movie.recommendations(page=1)
                        results = recs.get('results', [])
                    
                    for m in results:
                        if m['id'] not in seen_ids:
                            seen_ids.add(m['id'])
                            pool.append({
                                'tmdb_id': m['id'],
                                'title': m['title'],
                                'release_date': m.get('release_date', ''),
                                'vote_average': m.get('vote_average', 0),
                                'overview': m.get('overview', ''),
                                'poster_url': f"{TMDB_IMAGE_BASE}{m['poster_path']}" if m.get('poster_path') else None
                            })
                except Exception:
                    continue
                
                # Collect enough for a good random sample
                if len(pool) >= limit * 3:
                    break
            
            # Randomly sample from the pool instead of just taking top-rated
            if len(pool) <= limit:
                selected = pool
            else:
                selected = random.sample(pool, limit)
            
            # Sort the final selection by rating for a nice display order
            selected.sort(key=lambda x: x.get('vote_average', 0), reverse=True)
            return selected
        except Exception as e:
            print(f"Error fetching recommendations: {e}")
            return []

