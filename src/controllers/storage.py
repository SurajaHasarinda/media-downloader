import os
import shutil
from fastapi import APIRouter, HTTPException
from typing import List

from src.core.config import settings, get_setting
from src.database.models import FolderItem, DeleteResponse


router = APIRouter(prefix="/storage", tags=["storage"])


async def get_download_path() -> str:
    """Get download path from settings (DB first, then env)."""
    # Requires get_setting from src.core.config
    return await get_setting("DOWNLOAD_PATH", settings.DOWNLOAD_PATH)


def get_folder_size(path: str) -> float:
    """Calculate folder size in GB."""
    total = 0
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total += os.path.getsize(filepath)
    except Exception:
        pass
    return round(total / (1024 ** 3), 2)


@router.get("", response_model=List[FolderItem])
async def get_folders():
    """Get all folders in the downloads directory."""
    download_path = await get_download_path()
    
    if not os.path.exists(download_path):
        return []
    
    folders = []
    try:
        for name in os.listdir(download_path):
            path = os.path.join(download_path, name)
            if os.path.isdir(path):
                size = get_folder_size(path)
                folders.append(FolderItem(name=name, size_gb=size))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Sort by name
    folders.sort(key=lambda x: x.name.lower())
    return folders


@router.delete("/{folder_name}", response_model=DeleteResponse)
async def delete_folder(folder_name: str):
    """Delete a folder from the downloads directory."""
    download_path = await get_download_path()
    path = os.path.join(download_path, folder_name)
    
    # Security check - prevent path traversal
    if ".." in folder_name or "/" in folder_name or "\\" in folder_name:
        raise HTTPException(status_code=400, detail="Invalid folder name")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Not a folder")
    
    try:
        shutil.rmtree(path)
        return DeleteResponse(success=True, message=f"Deleted {folder_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

