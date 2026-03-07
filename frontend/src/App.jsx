import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, AlertTriangle, Box, TrendingUp, Layers } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import OptionsChain from './pages/OptionsChain';
import AnomalyDetection from './pages/AnomalyDetection';
import VolatilitySurface from './pages/VolatilitySurface';
import VolumeAnalysis from './pages/VolumeAnalysis';
import './index.css';

function App() {
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
            <div className="logo-icon">⚡</div>
            <div>
              <h1>OptiVision AI</h1>
              <span>Options Intelligence Suite</span>
            </div>
          </div>

          <nav className="sidebar-nav">
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

          <div className="sidebar-footer">
            Built with FOSS ❤️<br />
            <a href="https://github.com" target="_blank" rel="noreferrer">Team Antigravity</a>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/options-chain" element={<OptionsChain />} />
            <Route path="/anomalies" element={<AnomalyDetection />} />
            <Route path="/volatility" element={<VolatilitySurface />} />
            <Route path="/volume" element={<VolumeAnalysis />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
