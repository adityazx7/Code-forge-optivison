"""
WebSocket Manager — OptiVision AI
Manages real-time WebSocket connections for alert notifications.
"""

import json
from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    """Manages WebSocket connections per user."""

    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"[WS] User {user_id} connected. Total connections: {self._total_connections()}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"[WS] User {user_id} disconnected. Total connections: {self._total_connections()}")

    async def send_alert_to_user(self, user_id: int, alert: dict):
        """Send an alert to a specific user's connections."""
        if user_id not in self.active_connections:
            return

        dead_connections = []
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_json(alert)
            except Exception:
                dead_connections.append(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self.active_connections[user_id].remove(ws)

    async def broadcast_to_enabled_users(self, alert: dict, enabled_user_ids: list[int]):
        """Send alert only to users who have notifications enabled."""
        for user_id in enabled_user_ids:
            await self.send_alert_to_user(user_id, alert)

    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    def get_connected_user_ids(self) -> list[int]:
        return list(self.active_connections.keys())


# Singleton instance
ws_manager = ConnectionManager()
