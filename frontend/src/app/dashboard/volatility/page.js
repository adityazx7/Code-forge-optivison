'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Box, Waves, Map } from 'lucide-react';
import { getPlotlyLayout, IV_SURFACE_COLORSCALE, VOLUME_SURFACE_COLORSCALE } from '@/lib/chartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function VolatilityPage() {
    const [surfaceData, setSurfaceData] = useState([]); const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        setTheme(localStorage.getItem('optivision-theme') || 'dark');
        api.getVolatilitySurface().then(d => { setSurfaceData(d.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const plotLayout = getPlotlyLayout(theme);
    const isDark = theme === 'dark';
    if (loading) return <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Computing volatility surface...</p></div>;

    const strikes = [...new Set(surfaceData.map(d => d.strike))].sort((a, b) => a - b);
    const dtes = [...new Set(surfaceData.map(d => Math.round(d.days_to_expiry * 10) / 10))].sort((a, b) => a - b);
    const zIV = strikes.map(s => dtes.map(d => { const p = surfaceData.find(x => x.strike === s && Math.abs(x.days_to_expiry - d) < 0.15); return p ? p.iv_proxy : null; }));
    const zVol = strikes.map(s => dtes.map(d => { const p = surfaceData.find(x => x.strike === s && Math.abs(x.days_to_expiry - d) < 0.15); return p ? Math.log10(p.total_volume + 1) : null; }));

    const scn = { xaxis: { title: 'Days to Expiry', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' }, yaxis: { title: 'Strike (₹)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' }, bgcolor: 'transparent' };

    return (
        <div>
            <div className="page-header"><div className="page-header-icon"><Waves /></div><div className="page-header-text"><h2>3D Volatility Surface</h2><p>Multi-dimensional IV visualization across strikes and time</p></div></div>
            <div className="charts-grid">
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Box /> IV Proxy Surface</div></div>
                    <Plot data={[{ z: zIV, x: dtes, y: strikes, type: 'surface', colorscale: IV_SURFACE_COLORSCALE, opacity: 0.92, contours: { z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: true } } }, hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>IV: %{z:.2f}%<extra></extra>' }]} layout={{ ...plotLayout, height: 550, scene: { ...scn, zaxis: { title: 'IV Proxy (%)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' }, camera: { eye: { x: 1.8, y: -1.8, z: 0.8 } } }, margin: { t: 10, r: 10, b: 10, l: 10 } }} config={{ displayModeBar: true, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Box /> Volume Surface (Log)</div></div>
                    <Plot data={[{ z: zVol, x: dtes, y: strikes, type: 'surface', colorscale: VOLUME_SURFACE_COLORSCALE, opacity: 0.88, hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>Log Vol: %{z:.2f}<extra></extra>' }]} layout={{ ...plotLayout, height: 500, scene: { ...scn, zaxis: { title: 'Log10(Vol)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' }, camera: { eye: { x: 1.6, y: -2, z: 0.9 } } }, margin: { t: 10, r: 10, b: 10, l: 10 } }} config={{ displayModeBar: true, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Map /> IV Contour Map</div></div>
                    <Plot data={[{ z: zIV, x: dtes, y: strikes, type: 'contour', colorscale: IV_SURFACE_COLORSCALE, contours: { coloring: 'heatmap', showlabels: true, labelfont: { size: 10, color: isDark ? '#fff' : '#0f172a' } }, hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>IV: %{z:.2f}%<extra></extra>' }]} layout={{ ...plotLayout, height: 400, margin: { t: 20, r: 20, b: 60, l: 70 }, xaxis: { title: 'Days to Expiry' }, yaxis: { title: 'Strike (₹)' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
            </div>
        </div>
    );
}
