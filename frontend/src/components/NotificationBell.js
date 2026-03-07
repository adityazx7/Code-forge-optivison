'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationBell() {
    const { token, isAuthenticated } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const bellRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        function connect() {
            const ws = new WebSocket(`ws://localhost:8000/ws/alerts/${token}`);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                console.log('[WS] Connected to alert stream');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'pong') return;
                    if (data.type === 'anomaly_alert') {
                        setAlerts(prev => [data.data, ...prev].slice(0, 20));
                        // Animate bell
                        if (bellRef.current) {
                            bellRef.current.classList.add('ring');
                            setTimeout(() => bellRef.current?.classList.remove('ring'), 1000);
                        }
                    }
                } catch { }
            };

            ws.onclose = () => {
                setConnected(false);
                // Reconnect after 5s
                setTimeout(connect, 5000);
            };

            ws.onerror = () => {
                ws.close();
            };

            // Ping every 30s to keep alive
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 30000);

            return () => {
                clearInterval(pingInterval);
                ws.close();
            };
        }

        const cleanup = connect();
        return () => {
            if (cleanup) cleanup();
            if (wsRef.current) wsRef.current.close();
        };
    }, [isAuthenticated, token]);

    if (!isAuthenticated) return null;

    const unreadCount = alerts.length;

    return (
        <div className="notification-wrapper">
            <button
                ref={bellRef}
                className={`notification-bell ${unreadCount > 0 ? 'has-alerts' : ''}`}
                onClick={() => setShowPanel(!showPanel)}
                id="notification-bell"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
                <span className={`connection-dot ${connected ? 'connected' : ''}`} />
            </button>

            {showPanel && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <h3>Market Alerts</h3>
                        <div className="notification-panel-actions">
                            {alerts.length > 0 && (
                                <button className="clear-btn" onClick={() => setAlerts([])}>Clear</button>
                            )}
                            <button className="close-btn" onClick={() => setShowPanel(false)}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="notification-list">
                        {alerts.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={24} />
                                <p>No alerts yet</p>
                                <span>Enable notifications in Settings to receive real-time market alerts</span>
                            </div>
                        ) : (
                            alerts.map((alert, i) => (
                                <div key={i} className={`notification-item severity-${alert.severity?.toLowerCase()}`}>
                                    <div className="notification-message">{alert.message}</div>
                                    <div className="notification-meta">
                                        <span className={`severity-badge ${alert.severity?.toLowerCase()}`}>
                                            {alert.severity}
                                        </span>
                                        <span>Strike ₹{alert.strike?.toLocaleString()}</span>
                                    </div>
                                    {alert.reasons && (
                                        <div className="notification-reasons">
                                            {alert.reasons.map((r, j) => (
                                                <span key={j} className="reason-tag">{r}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
