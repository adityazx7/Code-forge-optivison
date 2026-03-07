"""
FastAPI Main Server — OptiVision AI
REST API endpoints for the options analytics platform.
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from backend.data_loader import get_cached_data
from backend.analytics import (
    get_market_overview,
    get_oi_by_strike,
    get_volume_by_strike,
    get_pcr_timeline,
    get_spot_price_timeline,
    get_oi_change_analysis,
    get_volatility_surface_data,
    get_max_pain,
    get_heatmap_data,
)
from backend.ml_engine import (
    detect_anomalies,
    get_anomaly_summary,
    get_anomaly_details,
    cluster_strikes,
)

app = FastAPI(
    title="OptiVision AI — Options Market Analytics",
    description="AI-Powered NIFTY Options Market Analytics Platform",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache ML results
_anomaly_data = None


def get_anomaly_data():
    global _anomaly_data
    if _anomaly_data is None:
        df = get_cached_data()
        _anomaly_data = detect_anomalies(df)
    return _anomaly_data


@app.get("/")
def root():
    return {
        "name": "OptiVision AI",
        "version": "1.0.0",
        "description": "AI-Powered Options Market Analytics Platform",
        "endpoints": [
            "/api/overview",
            "/api/oi-by-strike",
            "/api/volume-by-strike",
            "/api/pcr-timeline",
            "/api/spot-price",
            "/api/oi-changes",
            "/api/volatility-surface",
            "/api/max-pain",
            "/api/heatmap",
            "/api/anomalies/summary",
            "/api/anomalies/details",
            "/api/clusters",
            "/api/expiries",
        ],
    }


@app.get("/api/overview")
def api_overview():
    try:
        df = get_cached_data()
        return get_market_overview(df)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/expiries")
def api_expiries():
    try:
        df = get_cached_data()
        expiries = sorted(df["expiry"].dt.strftime("%Y-%m-%d").unique().tolist())
        return {"expiries": expiries}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/oi-by-strike")
def api_oi_by_strike(expiry: str = Query(None)):
    try:
        df = get_cached_data()
        return {"data": get_oi_by_strike(df, expiry)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/volume-by-strike")
def api_volume_by_strike(expiry: str = Query(None)):
    try:
        df = get_cached_data()
        return {"data": get_volume_by_strike(df, expiry)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/pcr-timeline")
def api_pcr_timeline():
    try:
        df = get_cached_data()
        return {"data": get_pcr_timeline(df)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/spot-price")
def api_spot_price():
    try:
        df = get_cached_data()
        return {"data": get_spot_price_timeline(df)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/oi-changes")
def api_oi_changes():
    try:
        df = get_cached_data()
        return {"data": get_oi_change_analysis(df)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/volatility-surface")
def api_volatility_surface():
    try:
        df = get_cached_data()
        return {"data": get_volatility_surface_data(df)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/max-pain")
def api_max_pain(expiry: str = Query(None)):
    try:
        df = get_cached_data()
        return get_max_pain(df, expiry)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/heatmap")
def api_heatmap(metric: str = Query("oi_CE")):
    try:
        df = get_cached_data()
        return {"data": get_heatmap_data(df, metric)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/anomalies/summary")
def api_anomaly_summary():
    try:
        df = get_anomaly_data()
        return get_anomaly_summary(df)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/anomalies/details")
def api_anomaly_details(limit: int = Query(100)):
    try:
        df = get_anomaly_data()
        return {"data": get_anomaly_details(df, limit)}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/clusters")
def api_clusters(n_clusters: int = Query(5)):
    try:
        df = get_cached_data()
        return {"data": cluster_strikes(df, n_clusters)}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})
