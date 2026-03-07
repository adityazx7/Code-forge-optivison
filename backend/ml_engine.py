"""
ML Engine Module — OptiVision AI
Machine learning models for anomaly detection and pattern recognition.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Use Isolation Forest to detect anomalies in options activity.
    Flags unusual volume spikes, OI changes, and PCR deviations.
    """
    features = [
        "oi_CE",
        "oi_PE",
        "volume_CE",
        "volume_PE",
        "total_oi",
        "total_volume",
        "pcr_oi",
        "vol_oi_ratio_CE",
        "vol_oi_ratio_PE",
    ]

    df_ml = df.copy()

    # Prepare feature matrix
    X = df_ml[features].fillna(0).replace([np.inf, -np.inf], 0)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=50,
        contamination=0.05,  # Expect ~5% anomalies
        random_state=42,
        n_jobs=-1,
    )
    df_ml["anomaly_score"] = iso_forest.fit_predict(X_scaled)
    df_ml["anomaly_raw_score"] = iso_forest.decision_function(X_scaled)

    # Binary flag: -1 = anomaly, 1 = normal
    df_ml["is_anomaly"] = df_ml["anomaly_score"] == -1

    return df_ml


def get_anomaly_summary(df: pd.DataFrame) -> dict:
    """Get summary statistics about detected anomalies."""
    if "is_anomaly" not in df.columns:
        df = detect_anomalies(df)

    anomalies = df[df["is_anomaly"]]
    normal = df[~df["is_anomaly"]]

    return {
        "total_records": int(len(df)),
        "total_anomalies": int(len(anomalies)),
        "anomaly_pct": round(float(len(anomalies) / len(df) * 100), 2),
        "avg_anomaly_score": round(float(anomalies["anomaly_raw_score"].mean()), 4)
        if len(anomalies) > 0
        else 0,
        "top_anomaly_strikes": anomalies["strike"]
        .value_counts()
        .head(10)
        .to_dict()
        if len(anomalies) > 0
        else {},
        "anomaly_by_date": anomalies.groupby("date")
        .size()
        .to_dict()
        if len(anomalies) > 0
        else {},
        "avg_volume_anomaly": float(anomalies["total_volume"].mean())
        if len(anomalies) > 0
        else 0,
        "avg_volume_normal": float(normal["total_volume"].mean())
        if len(normal) > 0
        else 0,
        "avg_oi_anomaly": float(anomalies["total_oi"].mean())
        if len(anomalies) > 0
        else 0,
        "avg_oi_normal": float(normal["total_oi"].mean())
        if len(normal) > 0
        else 0,
    }


def get_anomaly_details(df: pd.DataFrame, limit: int = 100) -> list:
    """Get detailed list of anomalous records."""
    if "is_anomaly" not in df.columns:
        df = detect_anomalies(df)

    anomalies = df[df["is_anomaly"]].sort_values("anomaly_raw_score").head(limit)

    result = []
    for _, row in anomalies.iterrows():
        reasons = []
        if row["total_volume"] > df["total_volume"].quantile(0.95):
            reasons.append("Extreme volume spike")
        if row["total_oi"] > df["total_oi"].quantile(0.95):
            reasons.append("Unusually high OI")
        if row["pcr_oi"] > df["pcr_oi"].quantile(0.95):
            reasons.append("Extreme PCR (bearish signal)")
        elif row["pcr_oi"] < df["pcr_oi"].quantile(0.05):
            reasons.append("Extreme low PCR (bullish signal)")
        if row["vol_oi_ratio_CE"] > df["vol_oi_ratio_CE"].quantile(0.95):
            reasons.append("High CE Volume/OI ratio")
        if row["vol_oi_ratio_PE"] > df["vol_oi_ratio_PE"].quantile(0.95):
            reasons.append("High PE Volume/OI ratio")

        if not reasons:
            reasons.append("Multi-factor anomaly")

        result.append(
            {
                "datetime": str(row["datetime"]),
                "strike": float(row["strike"]),
                "spot_close": float(row["spot_close"]),
                "oi_CE": int(row["oi_CE"]),
                "oi_PE": int(row["oi_PE"]),
                "volume_CE": int(row["volume_CE"]),
                "volume_PE": int(row["volume_PE"]),
                "pcr_oi": round(float(row["pcr_oi"]), 4)
                if pd.notna(row["pcr_oi"])
                else None,
                "anomaly_score": round(float(row["anomaly_raw_score"]), 4),
                "reasons": reasons,
                "severity": "HIGH"
                if row["anomaly_raw_score"] < -0.3
                else "MEDIUM"
                if row["anomaly_raw_score"] < -0.1
                else "LOW",
            }
        )

    return result


def cluster_strikes(df: pd.DataFrame, n_clusters: int = 5) -> list:
    """Cluster strikes based on activity patterns using KMeans."""
    strike_features = (
        df.groupby("strike")
        .agg(
            {
                "oi_CE": "mean",
                "oi_PE": "mean",
                "volume_CE": "mean",
                "volume_PE": "mean",
                "total_oi": "mean",
                "total_volume": "mean",
                "pcr_oi": "mean",
            }
        )
        .fillna(0)
    )

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(strike_features)

    n_clusters = min(n_clusters, len(strike_features))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    strike_features["cluster"] = clusters
    strike_features = strike_features.reset_index()

    result = []
    for cluster_id in range(n_clusters):
        cluster_data = strike_features[strike_features["cluster"] == cluster_id]
        result.append(
            {
                "cluster_id": int(cluster_id),
                "strikes": cluster_data["strike"].tolist(),
                "avg_oi": float(cluster_data["total_oi"].mean()),
                "avg_volume": float(cluster_data["total_volume"].mean()),
                "avg_pcr": float(cluster_data["pcr_oi"].mean()),
                "label": _label_cluster(
                    cluster_data["total_oi"].mean(),
                    cluster_data["total_volume"].mean(),
                    cluster_data["pcr_oi"].mean(),
                ),
            }
        )

    return result


def _label_cluster(avg_oi: float, avg_volume: float, avg_pcr: float) -> str:
    """Generate human-readable label for a cluster."""
    if avg_oi > 1000000 and avg_volume > 50000:
        return "🔥 High Activity Zone"
    elif avg_pcr > 1.5:
        return "🐻 Bearish Cluster"
    elif avg_pcr < 0.7:
        return "🐂 Bullish Cluster"
    elif avg_volume > 20000:
        return "⚡ Active Trading Zone"
    else:
        return "😴 Low Activity Zone"
