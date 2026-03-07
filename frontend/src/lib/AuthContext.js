'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('optivision-token');
        if (savedToken) {
            setToken(savedToken);
            fetchMe(savedToken);
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchMe(t) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setToken(t);
            } else {
                localStorage.removeItem('optivision-token');
                setToken(null);
                setUser(null);
            }
        } catch {
            localStorage.removeItem('optivision-token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function register(email, username, password) {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        localStorage.setItem('optivision-token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return data;
    }

    async function login(email, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        localStorage.setItem('optivision-token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return data;
    }

    function logout() {
        localStorage.removeItem('optivision-token');
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated: !!user,
            register,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
