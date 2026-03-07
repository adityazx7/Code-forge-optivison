'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { getPlotlyLayout, formatNumber } from '@/lib/chartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function DashboardPage() {
    const [overview, setOverview] = useState(null);
    const [spotData, setSpotData] = useState([]);
    const [pcrData, setPcrData] = useState([]);
    const [oiData, setOiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        setTheme(localStorage.getItem('optivision-theme') || 'dark');
        Promise.all([api.getOverview(), api.getSpotPrice(), api.getPCRTimeline(), api.getOIByStrike()])
            .then(([ov, sp, pcr, oi]) => { setOverview(ov); setSpotData(sp.data || []); setPcrData(pcr.data || []); setOiData(oi.data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const plotLayout = getPlotlyLayout(theme);

    if (loading) return <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading market intelligence...</p></div>;

    const metrics = overview ? [
        { label: 'Spot Price', value: '₹' + overview.spot_price?.toLocaleString(), color: 'cyan', sub: 'NIFTY 50 Index' },
        { label: 'Total CE OI', value: formatNumber(overview.total_ce_oi), color: 'green', sub: 'Call Open Interest' },
        { label: 'Total PE OI', value: formatNumber(overview.total_pe_oi), color: 'red', sub: 'Put Open Interest' },
        { label: 'PCR (OI)', value: overview.avg_pcr?.toFixed(3), color: 'purple', sub: overview.avg_pcr > 1 ? 'Bullish Bias' : 'Bearish Bias' },
        { label: 'Max Vol Strike', value: '₹' + overview.max_volume_strike?.toLocaleString(), color: 'orange', sub: 'Highest Activity Zone' },
        { label: 'Data Points', value: formatNumber(overview.total_records), color: 'blue', sub: `${overview.unique_dates} trading sessions` },
    ] : [];

    return (
        <div>
            <div className="page-header"><div className="page-header-icon"><BarChart3 /></div><div className="page-header-text"><h2>Market Dashboard</h2><p>NIFTY options analytics powered by AI</p></div></div>
            <div className="metrics-grid">{metrics.map((m, i) => (<div key={i} className={`metric-card ${m.color} animate-in`}><div className="metric-label">{m.label}</div><div className={`metric-value ${m.color}`}>{m.value}</div><div className="metric-sub">{m.sub}</div></div>))}</div>
            <div className="charts-grid">
                <div className="card animate-in"><div className="card-header"><div className="card-title"><TrendingUp /> NIFTY Spot Price</div></div>
                    <Plot data={[{ x: spotData.map(d => d.datetime), y: spotData.map(d => d.spot_close), type: 'scatter', mode: 'lines', fill: 'tonexty', line: { color: '#0891b2', width: 2 }, fillcolor: 'rgba(8,145,178,0.06)', hovertemplate: '₹%{y:,.2f}<br>%{x}<extra></extra>' }]} layout={{ ...plotLayout, height: 320, yaxis: { ...plotLayout.yaxis, title: 'Price (₹)' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><Activity /> Put-Call Ratio Trend</div></div>
                    <Plot data={[{ x: pcrData.map(d => d.datetime), y: pcrData.map(d => d.pcr_oi), type: 'scatter', mode: 'lines', name: 'PCR (OI)', line: { color: '#7c3aed', width: 2 } }, { x: pcrData.map(d => d.datetime), y: pcrData.map(d => d.pcr_volume), type: 'scatter', mode: 'lines', name: 'PCR (Vol)', line: { color: '#d97706', width: 1.5, dash: 'dot' } }]} layout={{ ...plotLayout, height: 320, yaxis: { ...plotLayout.yaxis, title: 'PCR' }, shapes: [{ type: 'line', y0: 1, y1: 1, x0: 0, x1: 1, xref: 'paper', line: { color: 'rgba(239,68,68,0.4)', width: 1, dash: 'dash' } }] }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><BarChart3 /> OI Distribution by Strike</div></div>
                    <Plot data={[{ x: oiData.map(d => d.strike), y: oiData.map(d => d.oi_CE), type: 'bar', name: 'Call OI', marker: { color: 'rgba(5,150,105,0.75)' } }, { x: oiData.map(d => d.strike), y: oiData.map(d => -d.oi_PE), type: 'bar', name: 'Put OI', marker: { color: 'rgba(220,38,38,0.75)' }, customdata: oiData.map(d => d.oi_PE) }]} layout={{ ...plotLayout, height: 380, barmode: 'relative', xaxis: { ...plotLayout.xaxis, title: 'Strike Price (₹)' }, yaxis: { ...plotLayout.yaxis, title: 'Open Interest' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
            </div>
        </div>
    );
}
