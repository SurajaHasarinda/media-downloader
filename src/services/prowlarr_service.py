import re
from typing import List, Optional
from dataclasses import dataclass
import prowlarr
from prowlarr.rest import ApiException
from src.core.config import get_setting_sync


# Quality patterns to extract from torrent titles
QUALITY_PATTERNS = [
    (r'\b2160p\b', '2160p', 2160),
    (r'\b4K\b', '4K', 2160),
    (r'\b1080p\b', '1080p', 1080),
    (r'\b720p\b', '720p', 720),
    (r'\b480p\b', '480p', 480),
]

SOURCE_PATTERNS = [
    (r'\bBluRay\b', 'BluRay'),
    (r'\bWEBRip\b', 'WEBRip'),
    (r'\bWEB-DL\b', 'WEB-DL'),
    (r'\bHDRip\b', 'HDRip'),
]


@dataclass
class TorrentResult:
    """A torrent search result."""
    title: str
    size_gb: float
    seeders: int
    quality: str
    source: str
    download_url: Optional[str]
    magnet_url: Optional[str]


class ProwlarrService:
    """Service for searching torrents via Prowlarr."""
    
    def __init__(self):
        pass
    
    def _get_client(self):
        """Create a Prowlarr API client with current settings."""
        prowlarr_url = get_setting_sync("PROWLARR_URL", "http://localhost:9696")
        api_key = get_setting_sync("PROWLARR_API_KEY", "")
        configuration = prowlarr.Configuration(host=prowlarr_url)
        configuration.api_key['X-Api-Key'] = api_key
        return prowlarr.ApiClient(configuration)
    
    @staticmethod
    def _extract_quality(title: str) -> tuple[str, int]:
        """Extract quality from torrent title."""
        for pattern, label, rank in QUALITY_PATTERNS:
            if re.search(pattern, title, re.IGNORECASE):
                return label, rank
        return 'Unknown', 0
    
    @staticmethod
    def _extract_source(title: str) -> str:
        """Extract source from torrent title."""
        for pattern, label in SOURCE_PATTERNS:
            if re.search(pattern, title, re.IGNORECASE):
                return label
        return 'Unknown'
    
    def search_by_imdb(
        self, 
        imdb_id: str,
        max_size_gb: float = 3.0,
        min_quality: int = 720
    ) -> List[TorrentResult]:
        """
        Search torrents by IMDB ID.
        
        Args:
            imdb_id: The IMDB ID (e.g., 'tt0848228')
            max_size_gb: Maximum file size in GB
            min_quality: Minimum quality (720 = 720p)
            
        Returns:
            List of matching torrents, sorted by seeders
        """
        # Ensure IMDB ID has 'tt' prefix
        if not imdb_id.startswith("tt"):
            imdb_id = f"tt{imdb_id}"
        
        query = f"{{imdbid:{imdb_id}}}"
        
        try:
            with self._get_client() as api_client:
                search_api = prowlarr.SearchApi(api_client)
                results = search_api.list_search(
                    query=query,
                    categories=[2000],  # Movies
                    type="search"
                )
                
                filtered = []
                for result in results:
                    title = result.title or 'Unknown'
                    size_gb = (result.size or 0) / (1024**3)
                    quality, quality_rank = self._extract_quality(title)
                    
                    # Apply filters
                    if size_gb > max_size_gb:
                        continue
                    if quality_rank < min_quality and quality_rank != 0:
                        continue
                    
                    filtered.append(TorrentResult(
                        title=title,
                        size_gb=round(size_gb, 2),
                        seeders=result.seeders or 0,
                        quality=quality,
                        source=self._extract_source(title),
                        download_url=result.download_url,
                        magnet_url=getattr(result, 'magnet_url', None)
                    ))
                
                # Sort by seeders (most first)
                filtered.sort(key=lambda x: -x.seeders)
                return filtered
                
        except ApiException as e:
            print(f"Prowlarr API error: {e}")
            return []
        except Exception as e:
            print(f"Error: {e}")
            return []
    
    def find_best_torrent(
        self,
        imdb_id: str,
        max_size_gb: float = 3.0,
        preferred_quality: int = 720
    ) -> Optional[TorrentResult]:
        """
        Find the best torrent for a movie.
        
        Returns the torrent with most seeders that matches criteria.
        """
        results = self.search_by_imdb(imdb_id, max_size_gb, preferred_quality)
        return results[0] if results else None
