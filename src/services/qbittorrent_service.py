import time
from typing import Optional, List, Tuple
from dataclasses import dataclass
import qbittorrentapi
from src.core.config import get_setting_sync


@dataclass
class DownloadStatus:
    """Status of a download in qBittorrent."""
    name: str
    hash: str
    progress: float  # 0-100
    state: str
    size_gb: float
    download_speed: int
    eta: int


class QBittorrentService:
    """Service for adding torrents to qBittorrent."""
    
    def __init__(self):
        self._client = None
        self._last_host = None
    
    def _get_client(self) -> qbittorrentapi.Client:
        """Get qBittorrent client connection with current settings."""
        host = get_setting_sync("QBITTORRENT_HOST", "http://localhost:8080")
        username = get_setting_sync("QBITTORRENT_USERNAME", "")
        password = get_setting_sync("QBITTORRENT_PASSWORD", "")
        
        # Reconnect if settings changed
        if self._client is None or self._last_host != host:
            self._client = qbittorrentapi.Client(
                host=host,
                username=username,
                password=password
            )
            self._client.auth_log_in()
            self._last_host = host
        return self._client
    
    def is_connected(self) -> bool:
        """Check if connected to qBittorrent."""
        try:
            self._get_client().app.version
            return True
        except Exception as e:
            print(f"qBittorrent connection error: {e}")
            return False
    
    def get_torrent_count(self) -> int:
        """Get current number of torrents."""
        try:
            return len(self._get_client().torrents_info())
        except Exception:
            return -1
    
    def add_torrent(
        self, 
        url: str, 
        category: str = "movies"
    ) -> Tuple[bool, str]:
        """
        Add a torrent by URL (magnet or .torrent URL).
        
        Args:
            url: Magnet link or torrent URL
            category: Category name in qBittorrent
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            client = self._get_client()
            
            # Get torrent count before adding
            count_before = len(client.torrents_info())
            
            # Create category if it doesn't exist
            try:
                if category not in client.torrent_categories.categories:
                    client.torrent_categories.create_category(name=category)
            except Exception as e:
                print(f"Warning: Could not create category: {e}")
            
            # Add the torrent
            result = client.torrents_add(urls=url, category=category)
            print(f"qBittorrent add result: {result}")
            
            # Wait a moment for torrent to be added
            time.sleep(1)
            
            # Verify torrent was actually added by checking count
            count_after = len(client.torrents_info())
            
            if count_after > count_before:
                return True, "Torrent added successfully"
            elif result == "Ok.":
                return True, "Torrent add reported success"
            else:
                # Check if it might be a duplicate
                return False, f"Torrent may not have been added. Response: {result}"
            
        except qbittorrentapi.LoginFailed as e:
            msg = f"Login failed: {e}"
            print(msg)
            return False, msg
        except qbittorrentapi.APIConnectionError as e:
            msg = f"Connection error: {e}"
            print(msg)
            return False, msg
        except Exception as e:
            msg = f"Error adding torrent: {e}"
            print(msg)
            return False, msg
    
    def get_downloads(self, category: Optional[str] = None) -> List[DownloadStatus]:
        """Get list of current downloads."""
        try:
            client = self._get_client()
            
            if category:
                torrents = client.torrents_info(category=category)
            else:
                torrents = client.torrents_info()
            
            return [
                DownloadStatus(
                    name=t.name,
                    hash=t.hash,
                    progress=round(t.progress * 100, 1),
                    state=t.state,
                    size_gb=round(t.size / (1024**3), 2),
                    download_speed=t.dlspeed,
                    eta=t.eta
                )
                for t in torrents
            ]
            
        except Exception as e:
            print(f"Error getting downloads: {e}")
            return []
    
    def get_connection_info(self) -> dict:
        """Get connection info for debugging."""
        return {
            "host": get_setting_sync("QBITTORRENT_HOST", "http://localhost:8080"),
            "username": get_setting_sync("QBITTORRENT_USERNAME", ""),
            "connected": self.is_connected()
        }
    
    def pause_torrent(self, torrent_hash: str) -> Tuple[bool, str]:
        """Pause a torrent by hash."""
        try:
            client = self._get_client()
            client.torrents_pause(torrent_hashes=torrent_hash)
            return True, "Torrent paused"
        except Exception as e:
            return False, f"Error pausing: {e}"
    
    def resume_torrent(self, torrent_hash: str) -> Tuple[bool, str]:
        """Resume a paused torrent by hash."""
        try:
            client = self._get_client()
            client.torrents_resume(torrent_hashes=torrent_hash)
            return True, "Torrent resumed"
        except Exception as e:
            return False, f"Error resuming: {e}"
    
    def delete_torrent(self, torrent_hash: str, delete_files: bool = False) -> Tuple[bool, str]:
        """
        Delete a torrent.
        
        Args:
            torrent_hash: The torrent hash
            delete_files: If True, also delete downloaded files
        """
        try:
            client = self._get_client()
            client.torrents_delete(torrent_hashes=torrent_hash, delete_files=delete_files)
            return True, "Torrent deleted"
        except Exception as e:
            return False, f"Error deleting: {e}"
    
    def pause_all(self) -> Tuple[bool, str]:
        """Pause all torrents."""
        try:
            client = self._get_client()
            client.torrents_pause(torrent_hashes="all")
            return True, "All torrents paused"
        except Exception as e:
            return False, f"Error: {e}"
    
    def resume_all(self) -> Tuple[bool, str]:
        """Resume all torrents."""
        try:
            client = self._get_client()
            client.torrents_resume(torrent_hashes="all")
            return True, "All torrents resumed"
        except Exception as e:
            return False, f"Error: {e}"
