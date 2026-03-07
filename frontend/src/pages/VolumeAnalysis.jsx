import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { BarChart3, TrendingUp, ArrowUpDown } from 'lucide-react';

const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter', size: 12 },
    margin: { t: 30, r: 20, b: 60, l: 60 },
    xaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    yaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    hoverlabel: { bgcolor: '#1a1f2e', bordercolor: '#00d4ff', font: { color: '#f1f5f9', size: 12 } },
};

function formatNumber(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString?.() ?? n;
}

export default function VolumeAnalysis() {
    const [volumeData, setVolumeData] = useState([]);
    const [oiChanges, setOiChanges] = useState([]);
    const [spotData, setSpotData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getVolumeByStrike(),
            api.getOIChanges(),
            api.getSpotPrice(),
        ]).then(([vol, oi, sp]) => {
            setVolumeData(vol.data || []);
            setOiChanges(oi.data || []);
            setSpotData(sp.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Analyzing volume patterns...</p>
        </div>
    );

    const totalCEVol = volumeData.reduce((s, d) => s + (d.volume_CE || 0), 0);
    const totalPEVol = volumeData.reduce((s, d) => s + (d.volume_PE || 0), 0);
    const topStrikes = [...volumeData].sort((a, b) => b.total_volume - a.total_volume).slice(0, 5);

    return (
        <div>
            <div className="page-header">
                <h2>📈 Volume & OI Change Analysis</h2>
                <p>Deep dive into trading volume patterns and open interest buildup/unwinding</p>
            </div>

            {/* Quick Stats */}
            <div className="metrics-grid">
                <div className="metric-card green animate-in">
                    <div className="metric-label">Total CE Volume</div>
                    <div className="metric-value green">{formatNumber(totalCEVol)}</div>
                    <div className="metric-sub">Call option trading activity</div>
                </div>
                <div className="metric-card red animate-in">
                    <div className="metric-label">Total PE Volume</div>
                    <div className="metric-value red">{formatNumber(totalPEVol)}</div>
                    <div className="metric-sub">Put option trading activity</div>
                </div>
                <div className="metric-card cyan animate-in">
                    <div className="metric-label">Volume Ratio (CE/PE)</div>
                    <div className="metric-value cyan">{(totalCEVol / (totalPEVol || 1)).toFixed(3)}</div>
                    <div className="metric-sub">{totalCEVol > totalPEVol ? '📈 More Call activity' : '📉 More Put activity'}</div>
                </div>
                <div className="metric-card orange animate-in">
                    <div className="metric-label">Top Strike</div>
                    <div className="metric-value orange">₹{topStrikes[0]?.strike?.toLocaleString()}</div>
                    <div className="metric-sub">Highest combined volume</div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Volume Waterfall */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><BarChart3 /> CE vs PE Volume Comparison</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: volumeData.map(d => d.strike),
                                y: volumeData.map(d => d.volume_CE),
                                type: 'scatter',
                                mode: 'lines',
                                fill: 'tonexty',
                                name: 'Call Volume',
                                line: { color: '#10b981', width: 2 },
                                fillcolor: 'rgba(16,185,129,0.15)',
                            },
                            {
                                x: volumeData.map(d => d.strike),
                                y: volumeData.map(d => d.volume_PE),
                                type: 'scatter',
                                mode: 'lines',
                                fill: 'tonexty',
                                name: 'Put Volume',
                                line: { color: '#ef4444', width: 2 },
                                fillcolor: 'rgba(239,68,68,0.15)',
                            },
                        ]}
                        layout={{ ...plotLayout, height: 350, xaxis: { ...plotLayout.xaxis, title: 'Strike Price' }, yaxis: { ...plotLayout.yaxis, title: 'Volume' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* OI Change */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><ArrowUpDown /> OI Change Analysis</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: oiChanges.map(d => d.strike),
                                y: oiChanges.map(d => d.oi_CE_change),
                                type: 'bar',
                                name: 'CE OI Change',
                                marker: { color: oiChanges.map(d => d.oi_CE_change >= 0 ? '#10b981' : '#ef4444'), opacity: 0.75 },
                            },
                            {
                                x: oiChanges.map(d => d.strike),
                                y: oiChanges.map(d => d.oi_PE_change),
                                type: 'bar',
                                name: 'PE OI Change',
                                marker: { color: oiChanges.map(d => d.oi_PE_change >= 0 ? '#3b82f6' : '#f59e0b'), opacity: 0.75 },
                            },
                        ]}
                        layout={{ ...plotLayout, height: 350, barmode: 'group', xaxis: { ...plotLayout.xaxis, title: 'Strike' }, yaxis: { ...plotLayout.yaxis, title: 'OI Change' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Volume Pie */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><BarChart3 /> Volume Split</div>
                    </div>
                    <Plot
                        data={[{
                            values: [totalCEVol, totalPEVol],
                            labels: ['Call Volume', 'Put Volume'],
                            type: 'pie',
                            hole: 0.55,
                            marker: {
                                colors: ['#10b981', '#ef4444'],
                                line: { color: '#0a0e17', width: 3 },
                            },
                            textinfo: 'percent+label',
                            textfont: { color: '#f1f5f9', size: 12 },
                            hovertemplate: '%{label}: %{value:,}<br>%{percent}<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320, margin: { t: 10, b: 10, l: 10, r: 10 }, showlegend: false }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Spot + Volume overlay */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><TrendingUp /> Spot Price Timeline</div>
                    </div>
                    <Plot
                        data={[{
                            x: spotData.map(d => d.datetime),
                            y: spotData.map(d => d.spot_close),
                            type: 'scatter',
                            mode: 'lines',
                            fill: 'tonexty',
                            line: { color: '#00d4ff', width: 2 },
                            fillcolor: 'rgba(0,212,255,0.08)',
                            hovertemplate: '₹%{y:,.2f}<br>%{x}<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320, yaxis: { ...plotLayout.yaxis, title: 'Price (₹)' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Top 5 Active Strikes Table */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><BarChart3 /> Top 5 Most Active Strikes</div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Strike</th>
                                <th>CE Volume</th>
                                <th>PE Volume</th>
                                <th>Total Volume</th>
                                <th>Dominance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topStrikes.map((d, i) => (
                                <tr key={i}>
                                    <td style={{ color: i === 0 ? '#f59e0b' : '#94a3b8', fontWeight: i === 0 ? 700 : 400 }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </td>
                                    <td style={{ color: '#00d4ff' }}>₹{d.strike?.toLocaleString()}</td>
                                    <td style={{ color: '#10b981' }}>{formatNumber(d.volume_CE)}</td>
                                    <td style={{ color: '#ef4444' }}>{formatNumber(d.volume_PE)}</td>
                                    <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{formatNumber(d.total_volume)}</td>
                                    <td>{d.volume_CE > d.volume_PE ? '🐂 CE Heavy' : '🐻 PE Heavy'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
