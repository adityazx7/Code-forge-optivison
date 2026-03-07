'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Layers, Filter, Target } from 'lucide-react';
import { getPlotlyLayout, HEATMAP_COLORSCALE } from '@/lib/chartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function OptionsChainPage() {
    const [oiData, setOiData] = useState([]); const [volumeData, setVolumeData] = useState([]);
    const [maxPain, setMaxPain] = useState(null); const [expiries, setExpiries] = useState([]);
    const [selectedExpiry, setSelectedExpiry] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]); const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => { setTheme(localStorage.getItem('optivision-theme') || 'dark'); api.getExpiries().then(({ expiries: e }) => { setExpiries(e); if (e.length) setSelectedExpiry(e[0]); }); }, []);
    useEffect(() => {
        if (!selectedExpiry) return; setLoading(true);
        Promise.all([api.getOIByStrike(selectedExpiry), api.getVolumeByStrike(selectedExpiry), api.getMaxPain(selectedExpiry), api.getHeatmap('total_oi')])
            .then(([oi, vol, mp, hm]) => { setOiData(oi.data || []); setVolumeData(vol.data || []); setMaxPain(mp); setHeatmapData(hm.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, [selectedExpiry]);

    const plotLayout = getPlotlyLayout(theme);
    if (loading) return <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading options chain...</p></div>;

    const strikes = [...new Set(heatmapData.map(d => d.strike))].sort((a, b) => a - b);
    const dates = [...new Set(heatmapData.map(d => d.date))].sort();
    const zValues = strikes.map(s => dates.map(d => { const p = heatmapData.find(h => h.strike === s && h.date === d); return p ? p.value : 0; }));

    return (
        <div>
            <div className="page-header"><div className="page-header-icon"><Layers /></div><div className="page-header-text"><h2>Options Chain Analysis</h2><p>Strike-wise OI and Volume with Max Pain calculation</p></div></div>
            <div className="metrics-grid" style={{ marginBottom: 20 }}>
                <div className="metric-card cyan animate-in"><div className="metric-label">Select Expiry</div><select className="select-input" value={selectedExpiry || ''} onChange={e => setSelectedExpiry(e.target.value)} style={{ width: '100%', marginTop: 8 }}>{expiries.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                {maxPain && <><div className="metric-card orange animate-in"><div className="metric-label">Max Pain Strike</div><div className="metric-value orange">₹{maxPain.max_pain_strike?.toLocaleString()}</div><div className="metric-sub">Maximum option seller profit</div></div>
                    <div className="metric-card green animate-in"><div className="metric-label">Spot Price</div><div className="metric-value green">₹{maxPain.spot_price?.toLocaleString()}</div></div>
                    <div className="metric-card purple animate-in"><div className="metric-label">Pain Distance</div><div className="metric-value purple">{((maxPain.max_pain_strike - maxPain.spot_price) / maxPain.spot_price * 100).toFixed(2)}%</div><div className="metric-sub">{maxPain.max_pain_strike > maxPain.spot_price ? 'Above Spot' : 'Below Spot'}</div></div></>}
            </div>
            <div className="charts-grid">
                <div className="card animate-in"><div className="card-header"><div className="card-title"><Layers /> OI by Strike</div></div>
                    <Plot data={[{ x: oiData.map(d => d.strike), y: oiData.map(d => d.oi_CE), type: 'bar', name: 'Call OI', marker: { color: '#059669', opacity: 0.8 } }, { x: oiData.map(d => d.strike), y: oiData.map(d => d.oi_PE), type: 'bar', name: 'Put OI', marker: { color: '#dc2626', opacity: 0.8 } }]} layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'OI' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><Filter /> Volume by Strike</div></div>
                    <Plot data={[{ x: volumeData.map(d => d.strike), y: volumeData.map(d => d.volume_CE), type: 'bar', name: 'Call Vol', marker: { color: '#2563eb', opacity: 0.8 } }, { x: volumeData.map(d => d.strike), y: volumeData.map(d => d.volume_PE), type: 'bar', name: 'Put Vol', marker: { color: '#d97706', opacity: 0.8 } }]} layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Volume' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Target /> OI Heatmap</div></div>
                    <Plot data={[{ z: zValues, x: dates, y: strikes, type: 'heatmap', colorscale: HEATMAP_COLORSCALE, hovertemplate: 'Strike: ₹%{y}<br>Date: %{x}<br>OI: %{z:,}<extra></extra>' }]} layout={{ ...plotLayout, height: 450, xaxis: { ...plotLayout.xaxis, title: 'Date' }, yaxis: { ...plotLayout.yaxis, title: 'Strike', type: 'category' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
            </div>
        </div>
    );
}
