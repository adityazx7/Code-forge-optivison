'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, BarChart3, AlertTriangle, Box, TrendingUp, Layers, Zap, Sun, Moon, Settings, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import ChatBot from '@/components/ChatBot';
import AnimatedLogo from '@/components/AnimatedLogo';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/options-chain', icon: Layers, label: 'Options Chain' },
    { path: '/dashboard/anomalies', icon: AlertTriangle, label: 'Anomaly Detection' },
    { path: '/dashboard/volatility', icon: Box, label: 'Volatility Surface' },
    { path: '/dashboard/volume', icon: BarChart3, label: 'Volume Analysis' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, loading, logout } = useAuth();
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('optivision-theme') || 'dark';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [loading, isAuthenticated, router]);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('optivision-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    function handleLogout() {
        logout();
        router.push('/');
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ padding: '0 1rem', marginBottom: '2rem' }}>
                    <AnimatedLogo className="sidebar-logo" iconSize={24} textSize="1.4rem" />
                    <span style={{ 
                        display: 'block', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)', 
                        marginTop: '0.5rem',
                        marginLeft: '3rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        Options Intelligence
                    </span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Analytics</div>
                    {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            href={path}
                            className={`nav-item ${pathname === path ? 'active' : ''}`}
                        >
                            <Icon />
                            <span>{label}</span>
                        </Link>
                    ))}

                    <div className="nav-section-label" style={{ marginTop: 16 }}>Account</div>
                    <Link
                        href="/dashboard/settings"
                        className={`nav-item ${pathname === '/dashboard/settings' ? 'active' : ''}`}
                    >
                        <Settings />
                        <span>Settings</span>
                    </Link>
                </nav>

                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.username || 'User'}</span>
                            <span className="sidebar-user-email">{user?.email || ''}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="topbar">
                    <div />
                    <div className="topbar-actions">
                        <NotificationBell />
                    </div>
                </div>
                {children}
            </main>

            <ChatBot />
        </div>
    );
}
