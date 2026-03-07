/**
 * Theme-aware Plotly layout configuration.
 * Returns base layout adapted to current light/dark theme.
 */
export function getPlotlyLayout(theme) {
    const isDark = theme === 'dark';
    return {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
            color: isDark ? '#94a3b8' : '#475569',
            family: 'Inter',
            size: 12,
        },
        margin: { t: 30, r: 20, b: 50, l: 60 },
        xaxis: {
            gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)',
            linecolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.08)',
        },
        yaxis: {
            gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)',
            linecolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.08)',
        },
        legend: {
            bgcolor: 'transparent',
            font: { size: 11, color: isDark ? '#94a3b8' : '#475569' },
        },
        hoverlabel: {
            bgcolor: isDark ? '#1a1f2e' : '#ffffff',
            bordercolor: isDark ? '#00d4ff' : '#0891b2',
            font: { color: isDark ? '#f1f5f9' : '#0f172a', size: 12 },
        },
    };
}

/** Industry-standard heatmap colorscale (yellow → orange → red → deep red) */
export const HEATMAP_COLORSCALE = [
    [0, 'rgba(255,255,235,0.1)'],
    [0.15, '#fef3c7'],
    [0.3, '#fbbf24'],
    [0.5, '#f59e0b'],
    [0.7, '#ea580c'],
    [0.85, '#dc2626'],
    [1, '#991b1b'],
];

/** 3D IV Surface colorscale (warm financial style) */
export const IV_SURFACE_COLORSCALE = [
    [0, '#1e3a5f'],
    [0.15, '#1d4ed8'],
    [0.3, '#0891b2'],
    [0.45, '#fbbf24'],
    [0.6, '#f59e0b'],
    [0.75, '#ea580c'],
    [0.9, '#dc2626'],
    [1, '#991b1b'],
];

/** Volume surface colorscale */
export const VOLUME_SURFACE_COLORSCALE = [
    [0, '#064e3b'],
    [0.2, '#059669'],
    [0.4, '#fbbf24'],
    [0.6, '#f59e0b'],
    [0.8, '#ea580c'],
    [1, '#dc2626'],
];

export function formatNumber(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n?.toLocaleString?.() ?? n;
}
