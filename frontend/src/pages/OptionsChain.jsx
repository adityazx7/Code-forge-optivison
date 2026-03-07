import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { Layers, Filter } from 'lucide-react';

const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter', size: 12 },
    margin: { t: 30, r: 20, b: 60, l: 70 },
    xaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    yaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    hoverlabel: { bgcolor: '#1a1f2e', bordercolor: '#00d4ff', font: { color: '#f1f5f9', size: 12 } },
};

export default function OptionsChain() {
    const [oiData, setOiData] = useState([]);
    const [volumeData, setVolumeData] = useState([]);
    const [maxPain, setMaxPain] = useState(null);
    const [expiries, setExpiries] = useState([]);
    const [selectedExpiry, setSelectedExpiry] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getExpiries().then(({ expiries: exp }) => {
            setExpiries(exp);
            if (exp.length) setSelectedExpiry(exp[0]);
        });
    }, []);

    useEffect(() => {
        if (!selectedExpiry) return;
        setLoading(true);
        Promise.all([
            api.getOIByStrike(selectedExpiry),
            api.getVolumeByStrike(selectedExpiry),
            api.getMaxPain(selectedExpiry),
            api.getHeatmap('total_oi'),
        ]).then(([oi, vol, mp, hm]) => {
            setOiData(oi.data || []);
            setVolumeData(vol.data || []);
            setMaxPain(mp);
            setHeatmapData(hm.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedExpiry]);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading options chain data...</p>
        </div>
    );

    // Build heatmap arrays
    const strikes = [...new Set(heatmapData.map(d => d.strike))].sort((a, b) => a - b);
    const dates = [...new Set(heatmapData.map(d => d.date))].sort();
    const zValues = strikes.map(s =>
        dates.map(d => {
            const point = heatmapData.find(h => h.strike === s && h.date === d);
            return point ? point.value : 0;
        })
    );

    return (
        <div>
            <div className="page-header">
                <h2>📋 Options Chain Analysis</h2>
                <p>Strike-wise OI & Volume breakdown with Max Pain calculation</p>
            </div>

            {/* Expiry Selector + Max Pain */}
            <div className="metrics-grid" style={{ marginBottom: 20 }}>
                <div className="metric-card cyan animate-in">
                    <div className="metric-label">Select Expiry</div>
                    <select
                        className="select-input"
                        value={selectedExpiry || ''}
                        onChange={e => setSelectedExpiry(e.target.value)}
                        style={{ width: '100%', marginTop: 8 }}
                    >
                        {expiries.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                {maxPain && (
                    <>
                        <div className="metric-card orange animate-in">
                            <div className="metric-label">Max Pain Strike</div>
                            <div className="metric-value orange">₹{maxPain.max_pain_strike?.toLocaleString()}</div>
                            <div className="metric-sub">Point of maximum option seller profit</div>
                        </div>
                        <div className="metric-card green animate-in">
                            <div className="metric-label">Spot Price</div>
                            <div className="metric-value green">₹{maxPain.spot_price?.toLocaleString()}</div>
                            <div className="metric-sub">Current NIFTY level</div>
                        </div>
                        <div className="metric-card purple animate-in">
                            <div className="metric-label">Pain Distance</div>
                            <div className="metric-value purple">
                                {((maxPain.max_pain_strike - maxPain.spot_price) / maxPain.spot_price * 100).toFixed(2)}%
                            </div>
                            <div className="metric-sub">{maxPain.max_pain_strike > maxPain.spot_price ? '↑ Above Spot' : '↓ Below Spot'}</div>
                        </div>
                    </>
                )}
            </div>

            <div className="charts-grid">
                {/* OI Distribution */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><Layers /> OI by Strike</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: oiData.map(d => d.strike),
                                y: oiData.map(d => d.oi_CE),
                                type: 'bar',
                                name: 'Call OI',
                                marker: { color: '#10b981', opacity: 0.8 },
                            },
                            {
                                x: oiData.map(d => d.strike),
                                y: oiData.map(d => d.oi_PE),
                                type: 'bar',
                                name: 'Put OI',
                                marker: { color: '#ef4444', opacity: 0.8 },
                            },
                        ]}
                        layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Open Interest' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Volume Distribution */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><Filter /> Volume by Strike</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: volumeData.map(d => d.strike),
                                y: volumeData.map(d => d.volume_CE),
                                type: 'bar',
                                name: 'Call Volume',
                                marker: { color: '#3b82f6', opacity: 0.8 },
                            },
                            {
                                x: volumeData.map(d => d.strike),
                                y: volumeData.map(d => d.volume_PE),
                                type: 'bar',
                                name: 'Put Volume',
                                marker: { color: '#f59e0b', opacity: 0.8 },
                            },
                        ]}
                        layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Volume' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* OI Heatmap */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Layers /> OI Heatmap — Strike × Date</div>
                    </div>
                    <Plot
                        data={[{
                            z: zValues,
                            x: dates,
                            y: strikes,
                            type: 'heatmap',
                            colorscale: [
                                [0, 'rgba(10,14,23,1)'],
                                [0.2, 'rgba(59,130,246,0.3)'],
                                [0.5, 'rgba(0,212,255,0.5)'],
                                [0.8, 'rgba(139,92,246,0.7)'],
                                [1, 'rgba(236,72,153,0.9)'],
                            ],
                            hovertemplate: 'Strike: ₹%{y}<br>Date: %{x}<br>OI: %{z:,}<extra></extra>',
                        }]}
                        layout={{
                            ...plotLayout,
                            height: 450,
                            xaxis: { ...plotLayout.xaxis, title: 'Date' },
                            yaxis: { ...plotLayout.yaxis, title: 'Strike Price', type: 'category' },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
