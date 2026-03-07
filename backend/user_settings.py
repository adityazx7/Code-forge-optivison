"""
User Settings Module — OptiVision AI
Manage user preferences including notification toggles.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsResponse(BaseModel):
    notifications_enabled: bool


class SettingsUpdate(BaseModel):
    notifications_enabled: bool


@router.get("", response_model=SettingsResponse)
def get_settings(user: dict = Depends(get_current_user)):
    conn = get_db()
    settings = conn.execute(
        "SELECT notifications_enabled FROM user_settings WHERE user_id = ?",
        (user["id"],),
    ).fetchone()
    conn.close()

    if not settings:
        return SettingsResponse(notifications_enabled=False)

    return SettingsResponse(notifications_enabled=bool(settings["notifications_enabled"]))


@router.put("", response_model=SettingsResponse)
def update_settings(req: SettingsUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()

    # Upsert settings
    conn.execute(
        """INSERT INTO user_settings (user_id, notifications_enabled, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id)
           DO UPDATE SET notifications_enabled = ?, updated_at = CURRENT_TIMESTAMP""",
        (user["id"], int(req.notifications_enabled), int(req.notifications_enabled)),
    )
    conn.commit()
    conn.close()

    return SettingsResponse(notifications_enabled=req.notifications_enabled)
