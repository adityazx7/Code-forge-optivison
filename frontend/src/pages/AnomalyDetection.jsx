import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { AlertTriangle, Shield, Zap, GitBranch, Brain, Cpu, Database, Layers } from 'lucide-react';
import { getPlotlyLayout, formatNumber } from '../chartConfig';

export default function AnomalyDetection({ theme }) {
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

    const plotLayout = getPlotlyLayout(theme);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Running Isolation Forest anomaly detection model...</p>
        </div>
    );

    const anomalyStrikes = Object.entries(summary?.top_anomaly_strikes || {});
    const anomalyByDate = Object.entries(summary?.anomaly_by_date || {});

    const clusterLabels = {
        'High Activity Zone': { icon: Zap, color: '#ea580c' },
        'Bearish Cluster': { icon: AlertTriangle, color: '#dc2626' },
        'Bullish Cluster': { icon: Zap, color: '#059669' },
        'Active Trading Zone': { icon: GitBranch, color: '#d97706' },
        'Low Activity Zone': { icon: Layers, color: '#64748b' },
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-icon"><Brain /></div>
                <div className="page-header-text">
                    <h2>AI Anomaly Detection</h2>
                    <p>Isolation Forest ML model identifies unusual options market activity &middot; Scikit-learn powered</p>
                </div>
            </div>

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
                    <div className="metric-sub">Lower score = more anomalous</div>
                </div>
            </div>

            <div className="charts-grid">
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
                                    return ratio > 0.7 ? '#dc2626' : ratio > 0.4 ? '#ea580c' : '#d97706';
                                }),
                                opacity: 0.9,
                                line: {
                                    width: 1, color: anomalyStrikes.map(([, c]) => {
                                        const max = Math.max(...anomalyStrikes.map(([, v]) => v));
                                        const ratio = c / max;
                                        return ratio > 0.7 ? '#991b1b' : ratio > 0.4 ? '#c2410c' : '#b45309';
                                    })
                                },
                            },
                            hovertemplate: '%{x}: %{y} anomalies<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320, xaxis: { ...plotLayout.xaxis, title: 'Strike Price' }, yaxis: { ...plotLayout.yaxis, title: 'Anomaly Count' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

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
                            line: { color: '#ea580c', width: 2 },
                            marker: { size: 8, color: '#dc2626', line: { color: '#991b1b', width: 1 } },
                            fillcolor: 'rgba(234,88,12,0.08)',
                            hovertemplate: '%{x}<br>%{y} anomalies<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320 }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* ML Model Info Section */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><Cpu /> ML Model Architecture</div>
                    </div>
                    <div className="ml-info-grid">
                        <div className="ml-info-card">
                            <h4><Brain /> Isolation Forest</h4>
                            <p>Unsupervised anomaly detection model with 200 estimators, trained on 9 feature dimensions. Isolates anomalous data points by recursively partitioning feature space — anomalies require fewer splits to isolate.</p>
                            <div style={{ marginTop: 8 }}>
                                <span className="tag">n_estimators: 200</span>
                                <span className="tag">contamination: 5%</span>
                                <span className="tag">unsupervised</span>
                            </div>
                        </div>
                        <div className="ml-info-card">
                            <h4><Database /> Feature Dimensions</h4>
                            <p>Model trained on: OI (CE/PE), Volume (CE/PE), Total OI, Total Volume, PCR, Volume-OI Ratio (CE/PE). These 9 features capture both magnitude and relative activity patterns.</p>
                            <div style={{ marginTop: 8 }}>
                                <span className="tag">9 Features</span>
                                <span className="tag">StandardScaler</span>
                                <span className="tag">147K+ Samples</span>
                            </div>
                        </div>
                        <div className="ml-info-card">
                            <h4><GitBranch /> K-Means Clustering</h4>
                            <p>Strikes grouped into 5 behavioral clusters based on mean OI, volume, and PCR patterns. Helps identify structural market zones: high-activity, bullish, bearish, and low-activity regions.</p>
                            <div style={{ marginTop: 8 }}>
                                <span className="tag">k=5 Clusters</span>
                                <span className="tag">7 Features</span>
                                <span className="tag">101 Strikes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strike Clusters */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><GitBranch /> Strike Behavioral Clusters (K-Means)</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {clusters.map((c, i) => {
                            const cleanLabel = c.label?.replace(/[^\w\s]/g, '').trim() || 'Cluster';
                            const meta = Object.values(clusterLabels).find((_, idx) => idx === i) || { color: '#64748b' };
                            return (
                                <div key={i} className="ml-info-card">
                                    <h4 style={{ color: meta.color }}>{cleanLabel}</h4>
                                    <p>Avg OI: <strong>{formatNumber(c.avg_oi)}</strong></p>
                                    <p>Avg Volume: <strong>{formatNumber(c.avg_volume)}</strong></p>
                                    <p>Avg PCR: <strong>{c.avg_pcr?.toFixed(3)}</strong></p>
                                    <div style={{ marginTop: 6 }}>
                                        <span className="tag">{c.strikes?.length} strikes</span>
                                    </div>
                                </div>
                            );
                        })}
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
                                    <td style={{ color: 'var(--accent-cyan)' }}>₹{d.strike?.toLocaleString()}</td>
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
