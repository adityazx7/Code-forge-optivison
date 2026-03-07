import { useState, useEffect } from 'react';
import { api } from '../api';
import Plot from 'react-plotly.js';
import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Calendar } from 'lucide-react';

const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter', size: 12 },
    margin: { t: 30, r: 20, b: 50, l: 60 },
    xaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    yaxis: { gridcolor: 'rgba(148,163,184,0.08)', linecolor: 'rgba(148,163,184,0.1)' },
    legend: { bgcolor: 'transparent', font: { size: 11 } },
    hoverlabel: { bgcolor: '#1a1f2e', bordercolor: '#00d4ff', font: { color: '#f1f5f9', size: 12 } },
};

function formatNumber(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString?.() ?? n;
}

export default function Dashboard() {
    const [overview, setOverview] = useState(null);
    const [spotData, setSpotData] = useState([]);
    const [pcrData, setPcrData] = useState([]);
    const [oiData, setOiData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getOverview(),
            api.getSpotPrice(),
            api.getPCRTimeline(),
            api.getOIByStrike(),
        ]).then(([ov, sp, pcr, oi]) => {
            setOverview(ov);
            setSpotData(sp.data || []);
            setPcrData(pcr.data || []);
            setOiData(oi.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading market intelligence...</p>
        </div>
    );

    const metrics = overview ? [
        { label: 'Spot Price', value: '₹' + overview.spot_price?.toLocaleString(), color: 'cyan', icon: TrendingUp, sub: 'NIFTY 50' },
        { label: 'Total CE OI', value: formatNumber(overview.total_ce_oi), color: 'green', icon: BarChart3, sub: 'Call Open Interest' },
        { label: 'Total PE OI', value: formatNumber(overview.total_pe_oi), color: 'red', icon: BarChart3, sub: 'Put Open Interest' },
        { label: 'PCR (OI)', value: overview.avg_pcr?.toFixed(3), color: 'purple', icon: Activity, sub: overview.avg_pcr > 1 ? '🐂 Bullish Bias' : '🐻 Bearish Bias' },
        { label: 'Max Vol Strike', value: '₹' + overview.max_volume_strike?.toLocaleString(), color: 'orange', icon: Target, sub: 'Highest Activity' },
        { label: 'Data Points', value: formatNumber(overview.total_records), color: 'blue', icon: Calendar, sub: `${overview.unique_dates} trading sessions` },
    ] : [];

    return (
        <div>
            <div className="page-header">
                <h2>📊 Market Dashboard</h2>
                <p>Real-time NIFTY options analytics powered by AI • {overview?.expiries?.length} expiry cycles tracked</p>
            </div>

            <div className="metrics-grid">
                {metrics.map((m, i) => (
                    <div key={i} className={`metric-card ${m.color} animate-in`}>
                        <div className="metric-label">{m.label}</div>
                        <div className={`metric-value ${m.color}`}>{m.value}</div>
                        <div className="metric-sub">{m.sub}</div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                {/* Spot Price Chart */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><TrendingUp /> NIFTY Spot Price Movement</div>
                    </div>
                    <Plot
                        data={[{
                            x: spotData.map(d => d.datetime),
                            y: spotData.map(d => d.spot_close),
                            type: 'scatter',
                            mode: 'lines',
                            fill: 'tonexty',
                            line: { color: '#00d4ff', width: 2 },
                            fillcolor: 'rgba(0,212,255,0.05)',
                            hovertemplate: '₹%{y:,.2f}<br>%{x}<extra></extra>',
                        }]}
                        layout={{ ...plotLayout, height: 320, yaxis: { ...plotLayout.yaxis, title: 'Price (₹)' } }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* PCR Timeline */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title"><Activity /> Put-Call Ratio Trend</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: pcrData.map(d => d.datetime),
                                y: pcrData.map(d => d.pcr_oi),
                                type: 'scatter',
                                mode: 'lines',
                                name: 'PCR (OI)',
                                line: { color: '#8b5cf6', width: 2 },
                                hovertemplate: 'PCR: %{y:.3f}<extra>OI</extra>',
                            },
                            {
                                x: pcrData.map(d => d.datetime),
                                y: pcrData.map(d => d.pcr_volume),
                                type: 'scatter',
                                mode: 'lines',
                                name: 'PCR (Volume)',
                                line: { color: '#f59e0b', width: 1.5, dash: 'dot' },
                                hovertemplate: 'PCR: %{y:.3f}<extra>Vol</extra>',
                            },
                        ]}
                        layout={{
                            ...plotLayout,
                            height: 320,
                            yaxis: { ...plotLayout.yaxis, title: 'PCR Value' },
                            shapes: [{ type: 'line', y0: 1, y1: 1, x0: 0, x1: 1, xref: 'paper', line: { color: 'rgba(239,68,68,0.4)', width: 1, dash: 'dash' } }],
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* OI by Strike */}
                <div className="card full-width animate-in">
                    <div className="card-header">
                        <div className="card-title"><BarChart3 /> Open Interest Distribution by Strike</div>
                    </div>
                    <Plot
                        data={[
                            {
                                x: oiData.map(d => d.strike),
                                y: oiData.map(d => d.oi_CE),
                                type: 'bar',
                                name: 'Call OI',
                                marker: { color: 'rgba(16,185,129,0.7)', line: { color: '#10b981', width: 1 } },
                                hovertemplate: 'Strike: ₹%{x}<br>CE OI: %{y:,}<extra></extra>',
                            },
                            {
                                x: oiData.map(d => d.strike),
                                y: oiData.map(d => -d.oi_PE),
                                type: 'bar',
                                name: 'Put OI',
                                marker: { color: 'rgba(239,68,68,0.7)', line: { color: '#ef4444', width: 1 } },
                                hovertemplate: 'Strike: ₹%{x}<br>PE OI: %{customdata:,}<extra></extra>',
                                customdata: oiData.map(d => d.oi_PE),
                            },
                        ]}
                        layout={{
                            ...plotLayout,
                            height: 380,
                            barmode: 'relative',
                            xaxis: { ...plotLayout.xaxis, title: 'Strike Price (₹)' },
                            yaxis: { ...plotLayout.yaxis, title: 'Open Interest' },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
