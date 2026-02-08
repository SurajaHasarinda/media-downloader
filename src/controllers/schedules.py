from typing import List, Optional
from fastapi import APIRouter, HTTPException

from src.database.models import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from src.services.scheduler_service import SchedulerService


router = APIRouter(prefix="/schedules", tags=["Schedules"])


# ============ Helper ============

def get_scheduler() -> SchedulerService:
    """Get scheduler instance."""
    return SchedulerService.get_instance()


def format_schedule(schedule: dict) -> ScheduleResponse:
    """Format schedule dict to response model."""
    scheduler = get_scheduler()
    next_run = scheduler.get_next_run(schedule['id'])
    
    return ScheduleResponse(
        id=schedule['id'],
        name=schedule['name'],
        cron_hour=schedule['cron_hour'],
        cron_minute=schedule['cron_minute'],
        max_size_gb=schedule['max_size_gb'],
        min_quality=schedule['min_quality'],
        enabled=bool(schedule['enabled']),
        last_run=schedule.get('last_run'),
        next_run=next_run.isoformat() if next_run else None,
        created_at=schedule.get('created_at')
    )


@router.get("", response_model=List[ScheduleResponse])
async def list_schedules():
    """Get all schedules."""
    scheduler = get_scheduler()
    schedules = await scheduler.get_schedules()
    return [format_schedule(s) for s in schedules]


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(schedule_id: int):
    """Get a specific schedule."""
    scheduler = get_scheduler()
    schedule = await scheduler.get_schedule(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return format_schedule(schedule)


@router.post("", response_model=ScheduleResponse)
async def create_schedule(data: ScheduleCreate):
    """Create a new schedule."""
    scheduler = get_scheduler()
    schedule = await scheduler.create_schedule(
        name=data.name,
        hour=data.hour,
        minute=data.minute,
        max_size_gb=data.max_size_gb,
        min_quality=data.min_quality,
        enabled=data.enabled
    )
    return format_schedule(schedule)


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(schedule_id: int, data: ScheduleUpdate):
    """Update an existing schedule."""
    scheduler = get_scheduler()
    schedule = await scheduler.update_schedule(
        schedule_id=schedule_id,
        name=data.name,
        hour=data.hour,
        minute=data.minute,
        max_size_gb=data.max_size_gb,
        min_quality=data.min_quality,
        enabled=data.enabled
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return format_schedule(schedule)


@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int):
    """Delete a schedule."""
    scheduler = get_scheduler()
    deleted = await scheduler.delete_schedule(schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": f"Schedule {schedule_id} deleted"}


@router.post("/{schedule_id}/run")
async def run_schedule_now(schedule_id: int):
    """Manually trigger a schedule to run immediately."""
    scheduler = get_scheduler()
    success = await scheduler.run_now(schedule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Processing started"}


@router.post("/{schedule_id}/toggle", response_model=ScheduleResponse)
async def toggle_schedule(schedule_id: int):
    """Toggle a schedule's enabled status."""
    scheduler = get_scheduler()
    schedule = await scheduler.get_schedule(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    updated = await scheduler.update_schedule(
        schedule_id=schedule_id,
        enabled=not schedule['enabled']
    )
    return format_schedule(updated)
