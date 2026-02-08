import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import aiosqlite
from pathlib import Path

from src.database import Database, MovieStatus
from src.services.prowlarr_service import ProwlarrService
from src.services.qbittorrent_service import QBittorrentService

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "data" / "media_downloader.db"


class SchedulerService:
    """Manages scheduled wishlist processing jobs."""
    
    _instance: Optional['SchedulerService'] = None
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.db_path = DB_PATH
        self.db = Database()
        self.prowlarr = ProwlarrService()
        self.qbittorrent = QBittorrentService()
        self._initialized = False
    
    @classmethod
    def get_instance(cls) -> 'SchedulerService':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def initialize(self):
        """Initialize scheduler and load saved schedules."""
        if self._initialized:
            return
            
        # Create schedules table
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    cron_hour INTEGER NOT NULL,
                    cron_minute INTEGER NOT NULL,
                    max_size_gb REAL DEFAULT 2.0,
                    min_quality INTEGER DEFAULT 720,
                    enabled INTEGER DEFAULT 1,
                    last_run TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
        
        # Load and start existing schedules
        schedules = await self.get_schedules()
        for schedule in schedules:
            if schedule['enabled']:
                self._add_job(schedule)
        
        if not self.scheduler.running:
            self.scheduler.start()
        
        self._initialized = True
    
    def _add_job(self, schedule: Dict[str, Any]):
        """Add a job to the scheduler."""
        job_id = f"schedule_{schedule['id']}"
        
        # Remove existing job if present
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        # Add new job with cron trigger
        self.scheduler.add_job(
            self._run_processing,
            CronTrigger(hour=schedule['cron_hour'], minute=schedule['cron_minute']),
            id=job_id,
            args=[schedule['id'], schedule['max_size_gb'], schedule['min_quality']],
            replace_existing=True
        )
    
    async def _run_processing(self, schedule_id: int, max_size_gb: float, min_quality: int):
        """Execute the wishlist processing for a schedule."""
        print(f"[Scheduler] Running scheduled processing (ID: {schedule_id})")
        
        try:
            # Get pending and not_found movies
            pending = await self.db.get_wishlist(MovieStatus.PENDING, MovieStatus.NOT_FOUND)
            
            queued_count = 0
            for movie in pending:
                if not movie.imdb_id:
                    continue
                
                # Search for torrent
                torrent = self.prowlarr.find_best_torrent(
                    movie.imdb_id,
                    max_size_gb=max_size_gb,
                    preferred_quality=min_quality
                )
                
                if torrent:
                    # Get download URL (prefer magnet)
                    download_url = torrent.magnet_url or torrent.download_url
                    
                    if download_url:
                        # Replace localhost with host.docker.internal for Docker containers
                        if "localhost" in download_url:
                            download_url = download_url.replace("localhost", "host.docker.internal")
                        
                        # Add to qBittorrent
                        success = self.qbittorrent.add_torrent(download_url)
                        if success:
                            await self.db.update_status(movie.tmdb_id, MovieStatus.QUEUED)
                            queued_count += 1
                            print(f"[Scheduler] Queued: {movie.title}")
                else:
                    await self.db.update_status(movie.tmdb_id, MovieStatus.NOT_FOUND)
            
            # Update last run time
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    "UPDATE schedules SET last_run = ? WHERE id = ?",
                    (datetime.now().isoformat(), schedule_id)
                )
                await db.commit()
            
            print(f"[Scheduler] Completed: {queued_count} movies queued")
            
        except Exception as e:
            print(f"[Scheduler] Error during processing: {e}")
    
    async def get_schedules(self) -> List[Dict[str, Any]]:
        """Get all schedules."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM schedules ORDER BY created_at DESC")
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def get_schedule(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific schedule."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def create_schedule(
        self,
        name: str,
        hour: int,
        minute: int,
        max_size_gb: float = 2.0,
        min_quality: int = 720,
        enabled: bool = True
    ) -> Dict[str, Any]:
        """Create a new schedule."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO schedules (name, cron_hour, cron_minute, max_size_gb, min_quality, enabled)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, hour, minute, max_size_gb, min_quality, 1 if enabled else 0))
            await db.commit()
            schedule_id = cursor.lastrowid
        
        schedule = await self.get_schedule(schedule_id)
        
        if enabled:
            self._add_job(schedule)
        
        return schedule
    
    async def update_schedule(
        self,
        schedule_id: int,
        name: Optional[str] = None,
        hour: Optional[int] = None,
        minute: Optional[int] = None,
        max_size_gb: Optional[float] = None,
        min_quality: Optional[int] = None,
        enabled: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing schedule."""
        schedule = await self.get_schedule(schedule_id)
        if not schedule:
            return None
        
        # Build update query
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if hour is not None:
            updates.append("cron_hour = ?")
            params.append(hour)
        if minute is not None:
            updates.append("cron_minute = ?")
            params.append(minute)
        if max_size_gb is not None:
            updates.append("max_size_gb = ?")
            params.append(max_size_gb)
        if min_quality is not None:
            updates.append("min_quality = ?")
            params.append(min_quality)
        if enabled is not None:
            updates.append("enabled = ?")
            params.append(1 if enabled else 0)
        
        if updates:
            params.append(schedule_id)
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    f"UPDATE schedules SET {', '.join(updates)} WHERE id = ?",
                    params
                )
                await db.commit()
        
        updated_schedule = await self.get_schedule(schedule_id)
        
        # Update or remove job
        job_id = f"schedule_{schedule_id}"
        if updated_schedule['enabled']:
            self._add_job(updated_schedule)
        elif self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        return updated_schedule
    
    async def delete_schedule(self, schedule_id: int) -> bool:
        """Delete a schedule."""
        job_id = f"schedule_{schedule_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
            await db.commit()
            return cursor.rowcount > 0
    
    async def run_now(self, schedule_id: int) -> bool:
        """Manually trigger a schedule to run now."""
        schedule = await self.get_schedule(schedule_id)
        if not schedule:
            return False
        
        # Run in background
        asyncio.create_task(self._run_processing(
            schedule_id,
            schedule['max_size_gb'],
            schedule['min_quality']
        ))
        return True
    
    def get_next_run(self, schedule_id: int) -> Optional[datetime]:
        """Get the next scheduled run time for a schedule."""
        job = self.scheduler.get_job(f"schedule_{schedule_id}")
        if job:
            return job.next_run_time
        return None
    
    def shutdown(self):
        """Shutdown the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
