'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard, BarChart3, AlertTriangle, Box, TrendingUp, Layers, Zap, Sun, Moon } from 'lucide-react';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/options-chain', icon: Layers, label: 'Options Chain' },
    { path: '/dashboard/anomalies', icon: AlertTriangle, label: 'Anomaly Detection' },
    { path: '/dashboard/volatility', icon: Box, label: 'Volatility Surface' },
    { path: '/dashboard/volume', icon: BarChart3, label: 'Volume Analysis' },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('optivision-theme') || 'dark';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('optivision-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon"><Zap /></div>
                    <div>
                        <h1>OptiVision AI</h1>
                        <span>Options Intelligence Suite</span>
                    </div>
                </Link>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Analytics</div>
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            href={path}
                            className={`nav-item ${pathname === path ? 'active' : ''}`}
                        >
                            <Icon />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>

                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="sidebar-footer">
                    <div style={{ marginBottom: 8 }}><UserButton afterSignOutUrl="/" /></div>
                    Built with FOSS<br />
                    <a href="https://github.com/HarshadPanchal12/codeforge_optiVisionAI" target="_blank" rel="noreferrer">Team Antigravity</a>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
