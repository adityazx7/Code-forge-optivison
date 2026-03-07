import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { Box } from 'lucide-react';

const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter', size: 12 },
    hoverlabel: { bgcolor: '#1a1f2e', bordercolor: '#00d4ff', font: { color: '#f1f5f9', size: 12 } },
};

export default function VolatilitySurface() {
    const [surfaceData, setSurfaceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getVolatilitySurface().then(data => {
            setSurfaceData(data.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Computing volatility surface...</p>
        </div>
    );

    // Prepare 3D surface data
    const strikes = [...new Set(surfaceData.map(d => d.strike))].sort((a, b) => a - b);
    const dtes = [...new Set(surfaceData.map(d => Math.round(d.days_to_expiry * 10) / 10))].sort((a, b) => a - b);

    const zIV = strikes.map(s =>
        dtes.map(d => {
            const point = surfaceData.find(p => p.strike === s && Math.abs(p.days_to_expiry - d) < 0.15);
            return point ? point.iv_proxy : null;
        })
    );

    const zVolume = strikes.map(s =>
        dtes.map(d => {
            const point = surfaceData.find(p => p.strike === s && Math.abs(p.days_to_expiry - d) < 0.15);
            return point ? Math.log10(point.total_volume + 1) : null;
        })
    );

    return (
        <div>
            <div className="page-header">
                <h2>🌊 3D Volatility Surface</h2>
                <p>Multi-dimensional visualization of implied volatility proxy across strikes and time-to-expiry</p>
            </div>

            <div className="charts-grid">
                {/* IV Surface */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Box /> Implied Volatility Proxy Surface</div>
                    </div>
                    <Plot
                        data={[{
                            z: zIV,
                            x: dtes,
                            y: strikes,
                            type: 'surface',
                            colorscale: [
                                [0, '#0a0e17'],
                                [0.15, '#1e3a5f'],
                                [0.3, '#3b82f6'],
                                [0.5, '#00d4ff'],
                                [0.7, '#8b5cf6'],
                                [0.85, '#ec4899'],
                                [1, '#ef4444'],
                            ],
                            opacity: 0.92,
                            contours: {
                                z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: true } },
                            },
                            hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>IV Proxy: %{z:.2f}%<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 550,
                            scene: {
                                xaxis: { title: 'Days to Expiry', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                yaxis: { title: 'Strike Price (₹)', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                zaxis: { title: 'IV Proxy (%)', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                bgcolor: 'transparent',
                                camera: { eye: { x: 1.8, y: -1.8, z: 0.8 } },
                            },
                            margin: { t: 10, r: 10, b: 10, l: 10 },
                        }}
                        config={{ displayModeBar: true, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Volume Surface */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Box /> Volume Activity Surface (Log Scale)</div>
                    </div>
                    <Plot
                        data={[{
                            z: zVolume,
                            x: dtes,
                            y: strikes,
                            type: 'surface',
                            colorscale: [
                                [0, '#0a0e17'],
                                [0.2, '#064e3b'],
                                [0.4, '#10b981'],
                                [0.6, '#f59e0b'],
                                [0.8, '#ef4444'],
                                [1, '#ec4899'],
                            ],
                            opacity: 0.88,
                            hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>Log Volume: %{z:.2f}<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 500,
                            scene: {
                                xaxis: { title: 'Days to Expiry', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                yaxis: { title: 'Strike Price (₹)', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                zaxis: { title: 'Log₁₀(Volume)', gridcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                                bgcolor: 'transparent',
                                camera: { eye: { x: 1.6, y: -2, z: 0.9 } },
                            },
                            margin: { t: 10, r: 10, b: 10, l: 10 },
                        }}
                        config={{ displayModeBar: true, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* 2D contour as well */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Box /> IV Contour Map (2D Projection)</div>
                    </div>
                    <Plot
                        data={[{
                            z: zIV,
                            x: dtes,
                            y: strikes,
                            type: 'contour',
                            colorscale: 'Viridis',
                            contours: { coloring: 'heatmap', showlabels: true, labelfont: { size: 10, color: '#fff' } },
                            hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>IV: %{z:.2f}%<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 400,
                            margin: { t: 20, r: 20, b: 60, l: 70 },
                            xaxis: { title: 'Days to Expiry', gridcolor: 'rgba(148,163,184,0.08)' },
                            yaxis: { title: 'Strike Price (₹)', gridcolor: 'rgba(148,163,184,0.08)' },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
