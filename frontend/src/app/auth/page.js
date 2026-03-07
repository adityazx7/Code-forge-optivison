'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Zap, Mail, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login, register } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, username, password);
            }
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-gradient" />
            <div className="auth-container">
                <AnimatedLogo 
                    href="/" 
                    className="auth-logo" 
                    iconSize={28} 
                    textSize="1.8rem" 
                    style={{ margin: '0 0 2rem 0', justifyContent: 'center' }}
                />

                <div className="auth-card">
                    <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="auth-subtitle">
                        {mode === 'login'
                            ? 'Sign in to access your analytics dashboard'
                            : 'Join OptiVision AI — AI-powered market intelligence'}
                    </p>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); }}
                        >Sign In</button>
                        <button
                            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); }}
                        >Register</button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                id="auth-email"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input
                                    id="auth-username"
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        100% FOSS — No third-party auth services
                    </p>
                </div>
            </div>
        </div>
    );
}
