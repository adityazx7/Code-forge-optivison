import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { Box, Waves, Map } from 'lucide-react';
import { getPlotlyLayout, IV_SURFACE_COLORSCALE, VOLUME_SURFACE_COLORSCALE } from '../chartConfig';

export default function VolatilitySurface({ theme }) {
    const [surfaceData, setSurfaceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getVolatilitySurface().then(data => {
            setSurfaceData(data.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const plotLayout = getPlotlyLayout(theme);
    const isDark = theme === 'dark';

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Computing volatility surface...</p>
        </div>
    );

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

    const sceneBase = {
        xaxis: { title: 'Days to Expiry', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' },
        yaxis: { title: 'Strike Price (₹)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' },
        bgcolor: 'transparent',
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-icon"><Waves /></div>
                <div className="page-header-text">
                    <h2>3D Volatility Surface</h2>
                    <p>Multi-dimensional visualization of implied volatility proxy across strikes and time-to-expiry</p>
                </div>
            </div>

            <div className="charts-grid">
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
                            colorscale: IV_SURFACE_COLORSCALE,
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
                                ...sceneBase,
                                zaxis: { title: 'IV Proxy (%)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' },
                                camera: { eye: { x: 1.8, y: -1.8, z: 0.8 } },
                            },
                            margin: { t: 10, r: 10, b: 10, l: 10 },
                        }}
                        config={{ displayModeBar: true, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

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
                            colorscale: VOLUME_SURFACE_COLORSCALE,
                            opacity: 0.88,
                            hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>Log Volume: %{z:.2f}<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 500,
                            scene: {
                                ...sceneBase,
                                zaxis: { title: 'Log10(Volume)', gridcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#475569' },
                                camera: { eye: { x: 1.6, y: -2, z: 0.9 } },
                            },
                            margin: { t: 10, r: 10, b: 10, l: 10 },
                        }}
                        config={{ displayModeBar: true, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Map /> IV Contour Map (2D Projection)</div>
                    </div>
                    <Plot
                        data={[{
                            z: zIV,
                            x: dtes,
                            y: strikes,
                            type: 'contour',
                            colorscale: IV_SURFACE_COLORSCALE,
                            contours: { coloring: 'heatmap', showlabels: true, labelfont: { size: 10, color: isDark ? '#fff' : '#0f172a' } },
                            hovertemplate: 'Strike: ₹%{y}<br>DTE: %{x:.1f}d<br>IV: %{z:.2f}%<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 400,
                            margin: { t: 20, r: 20, b: 60, l: 70 },
                            xaxis: { title: 'Days to Expiry', gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' },
                            yaxis: { title: 'Strike Price (₹)', gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
