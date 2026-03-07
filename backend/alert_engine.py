"""
Alert Engine — OptiVision AI
Background task that runs anomaly detection and pushes alerts via WebSocket.
"""

import asyncio
from datetime import datetime, timezone

from backend.data_loader import get_cached_data
from backend.ml_engine import detect_anomalies, get_anomaly_details
from backend.ws_manager import ws_manager
from backend.database import get_db


async def get_notification_enabled_users() -> list[int]:
    """Get IDs of users who have notifications enabled."""
    conn = get_db()
    rows = conn.execute(
        "SELECT user_id FROM user_settings WHERE notifications_enabled = 1"
    ).fetchall()
    conn.close()
    return [row["user_id"] for row in rows]


async def run_alert_cycle():
    """Run one cycle of anomaly detection and alert generation."""
    try:
        df = get_cached_data()
        df_analyzed = detect_anomalies(df)
        anomalies = get_anomaly_details(df_analyzed, limit=5)

        if not anomalies:
            return

        enabled_users = await get_notification_enabled_users()
        if not enabled_users:
            return

        # Only send alerts for HIGH severity anomalies
        high_severity = [a for a in anomalies if a["severity"] == "HIGH"]

        for anomaly in high_severity[:3]:  # Cap at 3 alerts per cycle
            alert = {
                "type": "anomaly_alert",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "strike": anomaly["strike"],
                    "severity": anomaly["severity"],
                    "reasons": anomaly["reasons"],
                    "score": anomaly["anomaly_score"],
                    "message": _generate_alert_message(anomaly),
                },
            }
            await ws_manager.broadcast_to_enabled_users(alert, enabled_users)

    except Exception as e:
        print(f"[AlertEngine] Error in alert cycle: {e}")


def _generate_alert_message(anomaly: dict) -> str:
    """Generate a human-readable alert message."""
    reasons = anomaly.get("reasons", [])
    strike = anomaly.get("strike", 0)

    if "Extreme volume spike" in reasons:
        return f"🚨 Sudden Volume Spike detected at Strike ₹{strike:,.0f}"
    elif "Unusually high OI" in reasons:
        return f"📊 Unusual OI Buildup at Strike ₹{strike:,.0f}"
    elif "Extreme PCR (bearish signal)" in reasons:
        return f"🐻 Extreme Bearish Signal — PCR spike at Strike ₹{strike:,.0f}"
    elif "Extreme low PCR (bullish signal)" in reasons:
        return f"🐂 Strong Bullish Signal — Low PCR at Strike ₹{strike:,.0f}"
    elif "High CE Volume/OI ratio" in reasons:
        return f"⚡ High Call Activity at Strike ₹{strike:,.0f} — possible IV spike"
    elif "High PE Volume/OI ratio" in reasons:
        return f"⚡ High Put Activity at Strike ₹{strike:,.0f} — hedging detected"
    else:
        return f"🔔 Unusual Market Activity detected at Strike ₹{strike:,.0f}"


async def alert_loop(interval_seconds: int = 60):
    """Background loop that periodically checks for anomalies."""
    print(f"[AlertEngine] Started — checking every {interval_seconds}s")
    while True:
        await run_alert_cycle()
        await asyncio.sleep(interval_seconds)
