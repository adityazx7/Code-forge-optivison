import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { AlertTriangle, Shield, Zap, PieChart } from 'lucide-react';

const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter', size: 12 },
    margin: { t: 30, r: 20, b: 60, l: 60 },
    xaxis: { gridcolor: 'rgba(148,163,184,0.08)' },
    yaxis: { gridcolor: 'rgba(148,163,184,0.08)' },
    hoverlabel: { bgcolor: '#1a1f2e', bordercolor: '#00d4ff', font: { color: '#f1f5f9', size: 12 } },
};

function formatNumber(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString?.() ?? n;
}

export default function AnomalyDetection() {
    const [summary, setSummary] = useState(null);
    const [details, setDetails] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getAnomalySummary(),
            api.getAnomalyDetails(50),
            api.getClusters(5),
        ]).then(([sum, det, clust]) => {
            setSummary(sum);
            setDetails(det.data || []);
            setClusters(clust.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Running AI anomaly detection (Isolation Forest)...</p>
        </div>
    );

    // Anomaly scatter data
    const anomalyStrikes = Object.entries(summary?.top_anomaly_strikes || {});
    const anomalyByDate = Object.entries(summary?.anomaly_by_date || {});

    return (
        <div>
            <div className="page-header">
                <h2>🤖 AI Anomaly Detection</h2>
                <p>Isolation Forest ML model identifies unusual options market activity • Scikit-learn powered</p>
            </div>

            {/* Summary Metrics */}
            <div className="metrics-grid">
                <div className="metric-card red animate-in">
                    <div className="metric-label">Anomalies Detected</div>
                    <div className="metric-value red">{summary?.total_anomalies?.toLocaleString()}</div>
                    <div className="metric-sub">{summary?.anomaly_pct}% of total data flagged</div>
                </div>
                <div className="metric-card orange animate-in">
                    <div className="metric-label">Anomaly Avg Volume</div>
                    <div className="metric-value orange">{formatNumber(summary?.avg_volume_anomaly)}</div>
                    <div className="metric-sub">vs {formatNumber(summary?.avg_volume_normal)} normal avg</div>
                </div>
                <div className="metric-card purple animate-in">
                    <div className="metric-label">Anomaly Avg OI</div>
                    <div className="metric-value purple">{formatNumber(summary?.avg_oi_anomaly)}</div>
                    <div className="metric-sub">vs {formatNumber(summary?.avg_oi_normal)} normal avg</div>
                </div>
                <div className="metric-card cyan animate-in">
                    <div className="metric-label">Avg Anomaly Score</div>
                    <div className="metric-value cyan">{summary?.avg_anomaly_score}</div>
                    <div className="metric-sub">Lower = more anomalous</div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Top Anomaly Strikes */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><AlertTriangle /> Top Anomaly Strikes</div>
                    </div>
                    <Plot
                        data={[{
                            x: anomalyStrikes.map(([s]) => '₹' + s),
                            y: anomalyStrikes.map(([, c]) => c),
                            type: 'bar',
                            marker: {
                                color: anomalyStrikes.map(([, c]) => {
                                    const max = Math.max(...anomalyStrikes.map(([, v]) => v));
                                    const ratio = c / max;
                                    return ratio > 0.7 ? '#ef4444' : ratio > 0.4 ? '#f59e0b' : '#10b981';
                                }),
                                opacity: 0.85,
                            },
                            hovertemplate: '%{x}: %{y} anomalies<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320, xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'Count' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Anomalies by Date */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><Zap /> Anomalies by Date</div>
                    </div>
                    <Plot
                        data={[{
                            x: anomalyByDate.map(([d]) => d),
                            y: anomalyByDate.map(([, c]) => c),
                            type: 'scatter',
                            mode: 'lines+markers',
                            fill: 'tonexty',
                            line: { color: '#ec4899', width: 2 },
                            marker: { size: 8, color: '#ec4899' },
                            fillcolor: 'rgba(236,72,153,0.1)',
                            hovertemplate: '%{x}<br>%{y} anomalies<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320 }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Strike Clusters */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><PieChart /> AI Strike Clustering (K-Means)</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {clusters.map((c, i) => (
                            <div key={i} style={{
                                padding: 16,
                                borderRadius: 12,
                                background: 'rgba(0,212,255,0.04)',
                                border: '1px solid rgba(148,163,184,0.1)',
                            }}>
                                <div style={{ fontSize: 18, marginBottom: 8 }}>{c.label}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                                    Avg OI: {formatNumber(c.avg_oi)}
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                                    Avg Volume: {formatNumber(c.avg_volume)}
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                                    Avg PCR: {c.avg_pcr?.toFixed(3)}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                    {c.strikes?.length} strikes in cluster
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Anomaly Details Table */}
            <div className="card animate-in" style={{ marginTop: 20 }}>
                <div className="card-header">
                    <div className="card-title"><Shield /> Anomaly Details — Top 50 Flagged Events</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Strike</th>
                                <th>Spot</th>
                                <th>CE OI</th>
                                <th>PE OI</th>
                                <th>CE Vol</th>
                                <th>PE Vol</th>
                                <th>PCR</th>
                                <th>Severity</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.slice(0, 30).map((d, i) => (
                                <tr key={i}>
                                    <td>{d.datetime?.split('.')[0]}</td>
                                    <td style={{ color: '#00d4ff' }}>₹{d.strike?.toLocaleString()}</td>
                                    <td>₹{d.spot_close?.toLocaleString()}</td>
                                    <td>{formatNumber(d.oi_CE)}</td>
                                    <td>{formatNumber(d.oi_PE)}</td>
                                    <td>{formatNumber(d.volume_CE)}</td>
                                    <td>{formatNumber(d.volume_PE)}</td>
                                    <td>{d.pcr_oi ?? 'N/A'}</td>
                                    <td><span className={`badge ${d.severity?.toLowerCase()}`}>{d.severity}</span></td>
                                    <td style={{ fontSize: 11, maxWidth: 200 }}>{d.reasons?.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
