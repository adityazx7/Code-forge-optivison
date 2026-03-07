'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { AlertTriangle, Shield, Zap, GitBranch, Brain, Cpu, Database, Layers } from 'lucide-react';
import { getPlotlyLayout, formatNumber } from '@/lib/chartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function AnomalyPage() {
    const [summary, setSummary] = useState(null); const [details, setDetails] = useState([]);
    const [clusters, setClusters] = useState([]); const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        setTheme(localStorage.getItem('optivision-theme') || 'dark');
        Promise.all([api.getAnomalySummary(), api.getAnomalyDetails(50), api.getClusters(5)])
            .then(([s, d, c]) => { setSummary(s); setDetails(d.data || []); setClusters(c.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const plotLayout = getPlotlyLayout(theme);
    if (loading) return <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Running Isolation Forest ML model...</p></div>;

    const anomalyStrikes = Object.entries(summary?.top_anomaly_strikes || {});
    const anomalyByDate = Object.entries(summary?.anomaly_by_date || {});

    return (
        <div>
            <div className="page-header"><div className="page-header-icon"><Brain /></div><div className="page-header-text"><h2>AI Anomaly Detection</h2><p>Isolation Forest ML model &middot; Scikit-learn powered</p></div></div>
            <div className="metrics-grid">
                <div className="metric-card red animate-in"><div className="metric-label">Anomalies Detected</div><div className="metric-value red">{summary?.total_anomalies?.toLocaleString()}</div><div className="metric-sub">{summary?.anomaly_pct}% flagged</div></div>
                <div className="metric-card orange animate-in"><div className="metric-label">Anomaly Avg Volume</div><div className="metric-value orange">{formatNumber(summary?.avg_volume_anomaly)}</div><div className="metric-sub">vs {formatNumber(summary?.avg_volume_normal)} normal</div></div>
                <div className="metric-card purple animate-in"><div className="metric-label">Anomaly Avg OI</div><div className="metric-value purple">{formatNumber(summary?.avg_oi_anomaly)}</div><div className="metric-sub">vs {formatNumber(summary?.avg_oi_normal)} normal</div></div>
                <div className="metric-card cyan animate-in"><div className="metric-label">Avg Score</div><div className="metric-value cyan">{summary?.avg_anomaly_score}</div><div className="metric-sub">Lower = more anomalous</div></div>
            </div>
            <div className="charts-grid">
                <div className="card animate-in"><div className="card-header"><div className="card-title"><AlertTriangle /> Top Anomaly Strikes</div></div>
                    <Plot data={[{ x: anomalyStrikes.map(([s]) => '₹' + s), y: anomalyStrikes.map(([, c]) => c), type: 'bar', marker: { color: anomalyStrikes.map(([, c]) => { const mx = Math.max(...anomalyStrikes.map(([, v]) => v)); const r = c / mx; return r > 0.7 ? '#dc2626' : r > 0.4 ? '#ea580c' : '#d97706'; }), opacity: 0.9 } }]} layout={{ ...plotLayout, height: 320, xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Count' } }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card animate-in"><div className="card-header"><div className="card-title"><Zap /> Anomalies by Date</div></div>
                    <Plot data={[{ x: anomalyByDate.map(([d]) => d), y: anomalyByDate.map(([, c]) => c), type: 'scatter', mode: 'lines+markers', fill: 'tonexty', line: { color: '#ea580c', width: 2 }, marker: { size: 8, color: '#dc2626' }, fillcolor: 'rgba(234,88,12,0.08)' }]} layout={{ ...plotLayout, height: 320 }} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }} />
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><Cpu /> ML Model Architecture</div></div>
                    <div className="ml-info-grid">
                        <div className="ml-info-card"><h4><Brain /> Isolation Forest</h4><p>Unsupervised anomaly detection with 200 estimators on 9 features. Isolates anomalies by recursive partitioning.</p><div style={{ marginTop: 8 }}><span className="tag">n_estimators: 200</span><span className="tag">contamination: 5%</span><span className="tag">unsupervised</span></div></div>
                        <div className="ml-info-card"><h4><Database /> 9 Feature Dimensions</h4><p>OI (CE/PE), Volume (CE/PE), Total OI, Total Volume, PCR, Vol-OI Ratio (CE/PE). StandardScaler normalized.</p><div style={{ marginTop: 8 }}><span className="tag">9 Features</span><span className="tag">StandardScaler</span><span className="tag">147K+ Samples</span></div></div>
                        <div className="ml-info-card"><h4><GitBranch /> K-Means Clustering</h4><p>5 behavioral clusters grouping 101 strikes by mean OI, volume, and PCR patterns.</p><div style={{ marginTop: 8 }}><span className="tag">k=5</span><span className="tag">7 Features</span><span className="tag">101 Strikes</span></div></div>
                    </div>
                </div>
                <div className="card full-width animate-in"><div className="card-header"><div className="card-title"><GitBranch /> Strike Clusters</div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                        {clusters.map((c, i) => (<div key={i} className="ml-info-card"><h4>{c.label?.replace(/[^\w\s]/g, '').trim()}</h4><p>Avg OI: <strong>{formatNumber(c.avg_oi)}</strong></p><p>Avg Volume: <strong>{formatNumber(c.avg_volume)}</strong></p><p>Avg PCR: <strong>{c.avg_pcr?.toFixed(3)}</strong></p><div style={{ marginTop: 6 }}><span className="tag">{c.strikes?.length} strikes</span></div></div>))}
                    </div>
                </div>
            </div>
            <div className="card animate-in" style={{ marginTop: 20 }}><div className="card-header"><div className="card-title"><Shield /> Top 30 Anomalies</div></div>
                <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Time</th><th>Strike</th><th>Spot</th><th>CE OI</th><th>PE OI</th><th>CE Vol</th><th>PE Vol</th><th>PCR</th><th>Severity</th><th>Reason</th></tr></thead><tbody>
                    {details.slice(0, 30).map((d, i) => (<tr key={i}><td>{d.datetime?.split('.')[0]}</td><td style={{ color: 'var(--accent-cyan)' }}>₹{d.strike?.toLocaleString()}</td><td>₹{d.spot_close?.toLocaleString()}</td><td>{formatNumber(d.oi_CE)}</td><td>{formatNumber(d.oi_PE)}</td><td>{formatNumber(d.volume_CE)}</td><td>{formatNumber(d.volume_PE)}</td><td>{d.pcr_oi ?? 'N/A'}</td><td><span className={`badge ${d.severity?.toLowerCase()}`}>{d.severity}</span></td><td style={{ fontSize: 11, maxWidth: 200 }}>{d.reasons?.join(', ')}</td></tr>))}
                </tbody></table></div>
            </div>
        </div>
    );
}
