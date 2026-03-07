'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { BarChart3, TrendingUp, ArrowUpDown, Trophy } from 'lucide-react';
import { getPlotlyLayout, formatNumber } from '@/lib/chartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function VolumePage() {
    const [volumeData, setVolumeData] = useState([]); const [oiChanges, setOiChanges] = useState([]);
    const [spotData, setSpotData] = useState([]); const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        setTheme(localStorage.getItem('optivision-theme') || 'dark');
        Promise.all([api.getVolumeByStrike(), api.getOIChanges(), api.getSpotPrice()])
            .then(([v, o, s]) => { setVolumeData(v.data || []); setOiChanges(o.data || []); setSpotData(s.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const plotLayout = getPlotlyLayout(theme);
    if (loading) return <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Analyzing volume...</p></div>;

    const totalCE = volumeData.reduce((s, d) => s + (d.volume_CE || 0), 0);
    const totalPE = volumeData.reduce((s, d) => s + (d.volume_PE || 0), 0);
    const top5 = [...volumeData].sort((a, b) => b.total_volume - a.total_volume).slice(0, 5);

    return (
        <div>
            <div className="page-header"><div className="page-header-icon"><TrendingUp /></div><div className="page-header-text"><h2>Volume & OI Analysis</h2><p>Trading volume patterns and OI buildup/unwinding</p></div></div>
            <div className="metrics-grid">
                <div className="metric-card green animate-in"><div className="metric-label">Total CE Volume</div><div className="metric-value green">{formatNumber(totalCE)}</div><div className="metric-sub">Call activity</div></div>
                <div className="metric-card red animate-in"><div className="metric-label">Total PE Volume</div><div className="metric-value red">{formatNumber(totalPE)}</div><div className="metric-sub">Put activity</div></div>
                <div className="metric-card cyan animate-in"><div className="metric-label">CE/PE Ratio</div><div className="metric-value cyan">{(totalCE / (totalPE || 1)).toFixed(3)}</div><div className="metric-sub">{totalCE > totalPE ? 'More Call activity' : 'More Put activity'}</div></div>
                <div className="metric-card orange animate-in"><div className="metric-label">Top Strike</div><div className="metric-value orange">₹{top5[0]?.strike?.toLocaleString()}</div><div className="metric-sub">Highest combined volume</div></div>
            </div>
            <div className="charts-grid">
                <div className="card animate-in"><div className="card-header"><div className="card-title"><BarChart3 /> CE vs PE Volume</div></div>
                    <Plot data={[{ x: volumeData.map(d => d.strike), y: volumeData.map(d => d.volume_CE), type: 'scatter', mode: 'lines', fill: 'tonexty', name: 'Call', line: { color: '#059669', width: 2 }, fillcolor: 'rgba(5,150,105,0.12)' }, { x: volumeData.map(d => d.strike), y: volumeData.map(d => d.volume_PE), type: 'scatter', mode: 'lines', fill: 'tonexty', name: 'Put', line: { color: '#dc2626', width: 2 }, fillcolor: 'rgba(220,38,38,0.12)' }]} layout={{ ...plotLayout, height: 350, xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Volume' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><ArrowUpDown /> OI Change</div></div>
                    <Plot data={[{ x: oiChanges.map(d => d.strike), y: oiChanges.map(d => d.oi_CE_change), type: 'bar', name: 'CE OI Chg', marker: { color: oiChanges.map(d => d.oi_CE_change >= 0 ? '#059669' : '#dc2626'), opacity: 0.75 } }, { x: oiChanges.map(d => d.strike), y: oiChanges.map(d => d.oi_PE_change), type: 'bar', name: 'PE OI Chg', marker: { color: oiChanges.map(d => d.oi_PE_change >= 0 ? '#2563eb' : '#d97706'), opacity: 0.75 } }]} layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'OI Change' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><BarChart3 /> Volume Split</div></div>
                    <Plot data={[{ values: [totalCE, totalPE], labels: ['Call Volume', 'Put Volume'], type: 'pie', hole: 0.55, marker: { colors: ['#059669', '#dc2626'], line: { color: theme === 'dark' ? '#0a0e17' : '#f8fafc', width: 3 } }, textinfo: 'percent+label', textfont: { color: theme === 'dark' ? '#f1f5f9' : '#0f172a', size: 12 } }]} layout={{ ...plotLayout, height: 320, margin: { t: 10, b: 10, l: 10, r: 10 }, showlegend: false }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><TrendingUp /> Spot Price</div></div>
                    <Plot data={[{ x: spotData.map(d => d.datetime), y: spotData.map(d => d.spot_close), type: 'scatter', mode: 'lines', fill: 'tonexty', line: { color: '#0891b2', width: 2 }, fillcolor: 'rgba(8,145,178,0.06)' }]} layout={{ ...plotLayout, height: 320, yaxis: { ...plotLayout.yaxis, title: 'Price (₹)' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Trophy /> Top 5 Active Strikes</div></div>
                    <table className="data-table"><thead><tr><th>Rank</th><th>Strike</th><th>CE Volume</th><th>PE Volume</th><th>Total</th><th>Dominance</th></tr></thead><tbody>
                        {top5.map((d, i) => (<tr key={i}><td style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>#{i + 1}</td><td style={{ color: 'var(--accent-cyan)' }}>₹{d.strike?.toLocaleString()}</td><td style={{ color: 'var(--accent-green)' }}>{formatNumber(d.volume_CE)}</td><td style={{ color: 'var(--accent-red)' }}>{formatNumber(d.volume_PE)}</td><td style={{ fontWeight: 600 }}>{formatNumber(d.total_volume)}</td><td>{d.volume_CE > d.volume_PE ? 'CE Heavy' : 'PE Heavy'}</td></tr>))}
                    </tbody></table>
                </div>
            </div>
        </div>
    );
}
