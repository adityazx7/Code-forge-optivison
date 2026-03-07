import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, AlertTriangle, Box, TrendingUp, Layers, Zap, Sun, Moon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import OptionsChain from './pages/OptionsChain';
import AnomalyDetection from './pages/AnomalyDetection';
import VolatilitySurface from './pages/VolatilitySurface';
import VolumeAnalysis from './pages/VolumeAnalysis';
import './index.css';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('optivision-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('optivision-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/options-chain', icon: Layers, label: 'Options Chain' },
    { path: '/anomalies', icon: AlertTriangle, label: 'Anomaly Detection' },
    { path: '/volatility', icon: Box, label: 'Volatility Surface' },
    { path: '/volume', icon: BarChart3, label: 'Volume Analysis' },
  ];

  return (
    <Router>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon"><Zap /></div>
            <div>
              <h1>OptiVision AI</h1>
              <span>Options Intelligence Suite</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Analytics</div>
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={path === '/'}
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="sidebar-footer">
            Built with FOSS<br />
            <a href="https://github.com/HarshadPanchal12/codeforge_optiVisionAI" target="_blank" rel="noreferrer">Team Antigravity</a>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} />} />
            <Route path="/options-chain" element={<OptionsChain theme={theme} />} />
            <Route path="/anomalies" element={<AnomalyDetection theme={theme} />} />
            <Route path="/volatility" element={<VolatilitySurface theme={theme} />} />
            <Route path="/volume" element={<VolumeAnalysis theme={theme} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
