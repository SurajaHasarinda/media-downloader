from typing import List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from src.database import Database
from src.database.models import MovieStatus, DownloadResult, ProcessResult
from src.services import ProwlarrService, QBittorrentService


router = APIRouter(prefix="/download", tags=["Downloads"])
db = Database()
prowlarr = ProwlarrService()
qbittorrent = QBittorrentService()


@router.post("/process", response_model=ProcessResult)
async def process_wishlist(
    max_size_gb: float = Query(3.0, description="Maximum torrent size in GB"),
    min_quality: int = Query(720, description="Minimum quality (720 = 720p)")
):
    """
    Process the wishlist and queue torrents for pending movies.
    
    Goes through each pending movie, searches for torrents via Prowlarr,
    and queues the best match in qBittorrent.
    """
    # Get pending movies
    pending = await db.get_wishlist(MovieStatus.PENDING, MovieStatus.NOT_FOUND)
    
    results = []
    queued_count = 0
    not_found_count = 0
    
    for movie in pending:
        if not movie.imdb_id:
            results.append(DownloadResult(
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                status="error",
                message="No IMDB ID available"
            ))
            continue
        
        # Search for torrent
        torrent = prowlarr.find_best_torrent(
            movie.imdb_id,
            max_size_gb=max_size_gb,
            preferred_quality=min_quality
        )
        
        if not torrent:
            await db.update_status(movie.tmdb_id, MovieStatus.NOT_FOUND)
            not_found_count += 1
            results.append(DownloadResult(
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                status="not_found",
                message="No torrent found matching criteria"
            ))
            continue
        
        # Get download URL (prefer magnet)
        download_url = torrent.magnet_url or torrent.download_url
        print(f"Original URL: {download_url}")
        
        if not download_url:
            results.append(DownloadResult(
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                status="error",
                message="Torrent found but no download URL"
            ))
            continue
        
        # Replace localhost with host.docker.internal for Docker containers
        # This allows qBittorrent (in Docker) to access Prowlarr (on host)
        if "localhost" in download_url:
            download_url = download_url.replace("localhost", "host.docker.internal")
            print(f"Docker-fixed URL: {download_url}")
        
        # Add to qBittorrent
        success, msg = qbittorrent.add_torrent(download_url, category="movies")
        
        if success:
            await db.update_status(movie.tmdb_id, MovieStatus.QUEUED)
            queued_count += 1
            results.append(DownloadResult(
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                status="queued",
                message=f"Queued: {torrent.title} ({torrent.quality}, {torrent.size_gb}GB)"
            ))
        else:
            results.append(DownloadResult(
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                status="error",
                message=f"Failed to add to qBittorrent: {msg}"
            ))
    
    return ProcessResult(
        processed=len(pending),
        queued=queued_count,
        not_found=not_found_count,
        results=results
    )


@router.get("/status")
async def get_download_status():
    """Get current download status from qBittorrent."""
    connection_info = qbittorrent.get_connection_info()
    
    if not connection_info["connected"]:
        raise HTTPException(
            status_code=503, 
            detail=f"qBittorrent not connected at {connection_info['host']}"
        )
    
    downloads = qbittorrent.get_downloads(category="movies")
    return {
        "connected": True,
        "host": connection_info["host"],
        "count": len(downloads),
        "downloads": downloads
    }


@router.get("/search/{imdb_id}")
async def preview_torrent_search(
    imdb_id: str,
    max_size_gb: float = Query(3.0, description="Maximum size in GB"),
    min_quality: int = Query(720, description="Minimum quality")
):
    """Preview available torrents for an IMDB ID (without downloading)."""
    results = prowlarr.search_by_imdb(imdb_id, max_size_gb, min_quality)
    return {
        "imdb_id": imdb_id,
        "count": len(results),
        "results": [
            {
                "title": r.title,
                "size_gb": r.size_gb,
                "seeders": r.seeders,
                "quality": r.quality,
                "source": r.source
            }
            for r in results
        ]
    }


# ============ Torrent Control Endpoints ============

@router.post("/pause/{torrent_hash}")
async def pause_download(torrent_hash: str):
    """Pause a specific torrent by its hash."""
    success, message = qbittorrent.pause_torrent(torrent_hash)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}


@router.post("/resume/{torrent_hash}")
async def resume_download(torrent_hash: str):
    """Resume a paused torrent by its hash."""
    success, message = qbittorrent.resume_torrent(torrent_hash)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}


@router.delete("/{torrent_hash}")
async def delete_download(
    torrent_hash: str,
    delete_files: bool = Query(False, description="Also delete downloaded files")
):
    """Delete a torrent from qBittorrent."""
    success, message = qbittorrent.delete_torrent(torrent_hash, delete_files)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}


@router.post("/pause-all")
async def pause_all_downloads():
    """Pause all torrents."""
    success, message = qbittorrent.pause_all()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}


@router.post("/resume-all")
async def resume_all_downloads():
    """Resume all torrents."""
    success, message = qbittorrent.resume_all()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}
