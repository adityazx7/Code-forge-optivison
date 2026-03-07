'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const API_BASE = 'http://localhost:8000';

export default function SettingsPage() {
    const { token } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/api/settings`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                setNotificationsEnabled(data.notifications_enabled);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token]);

    async function toggleNotifications() {
        const newVal = !notificationsEnabled;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notifications_enabled: newVal }),
            });
            if (res.ok) {
                setNotificationsEnabled(newVal);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error('Failed to update settings:', err);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading settings...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-icon"><Settings /></div>
                <div className="page-header-text">
                    <h2>Settings</h2>
                    <p>Manage your notification preferences</p>
                </div>
            </div>

            <div className="settings-grid">
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-item-header">
                                {notificationsEnabled
                                    ? <Bell className="settings-icon active" />
                                    : <BellOff className="settings-icon" />
                                }
                                <h3>Real-Time Market Notifications</h3>
                            </div>
                            <p>
                                Receive instant alerts when our AI detects unusual market activity —
                                sudden IV spikes, extreme volume, anomalous OI buildup, or PCR deviations.
                                Alerts are powered by the Isolation Forest anomaly detection engine.
                            </p>
                            {notificationsEnabled && (
                                <div className="settings-active-indicator">
                                    <span className="pulse-dot" />
                                    Monitoring active — alerts will appear in real-time
                                </div>
                            )}
                        </div>
                        <div className="settings-item-action">
                            <button
                                className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}
                                onClick={toggleNotifications}
                                disabled={saving}
                                id="notifications-toggle"
                            >
                                {saving ? (
                                    <Loader2 className="spinner" size={16} />
                                ) : (
                                    <div className="toggle-knob" />
                                )}
                            </button>
                            {saved && <span className="save-indicator">✓ Saved</span>}
                        </div>
                    </div>
                </div>

                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <h3>🤖 AI Chatbot</h3>
                            <p>
                                The OptiVision AI Assistant uses a local Ollama (Llama 3) model for
                                data narrative generation. It analyzes market data via RAG and explains
                                volatility surfaces, unusual clusters, and strategy insights in plain English.
                            </p>
                            <div className="tech-badges-row">
                                <span className="tech-badge">Ollama</span>
                                <span className="tech-badge">Llama 3</span>
                                <span className="tech-badge">RAG</span>
                                <span className="tech-badge">DuckDB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <h3>🔓 FOSS Stack</h3>
                            <p>
                                OptiVision AI is built entirely with Free and Open Source Software.
                                Authentication uses JWT (python-jose + bcrypt), analytics run on DuckDB,
                                and the AI engine uses locally-hosted Ollama — no paid APIs or services.
                            </p>
                            <div className="tech-badges-row">
                                <span className="tech-badge">FastAPI</span>
                                <span className="tech-badge">DuckDB</span>
                                <span className="tech-badge">Plotly</span>
                                <span className="tech-badge">Scikit-learn</span>
                                <span className="tech-badge">Next.js</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
