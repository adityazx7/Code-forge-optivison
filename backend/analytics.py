"""
Analytics Module — OptiVision AI
Market analytics functions for options data.
"""

import pandas as pd
import numpy as np


def get_market_overview(df: pd.DataFrame) -> dict:
    """Generate high-level market overview metrics."""
    latest_time = df["datetime"].max()
    latest = df[df["datetime"] == latest_time]

    return {
        "spot_price": float(latest["spot_close"].iloc[0]) if len(latest) > 0 else 0,
        "total_records": int(len(df)),
        "date_range": {
            "start": str(df["datetime"].min()),
            "end": str(df["datetime"].max()),
        },
        "expiries": sorted(df["expiry"].dt.strftime("%Y-%m-%d").unique().tolist()),
        "total_ce_oi": int(df.groupby("datetime")["oi_CE"].sum().iloc[-1])
        if len(df) > 0
        else 0,
        "total_pe_oi": int(df.groupby("datetime")["oi_PE"].sum().iloc[-1])
        if len(df) > 0
        else 0,
        "avg_pcr": float(df["pcr_oi"].dropna().mean()),
        "max_volume_strike": int(
            df.groupby("strike")["total_volume"].sum().idxmax()
        )
        if len(df) > 0
        else 0,
        "total_strikes": int(df["strike"].nunique()),
        "unique_dates": int(df["date"].nunique()),
    }


def get_oi_by_strike(df: pd.DataFrame, expiry: str = None) -> list:
    """Get Open Interest breakdown by strike price."""
    if expiry:
        df = df[df["expiry"].dt.strftime("%Y-%m-%d") == expiry]

    # Get latest timestamp data for each strike
    latest_time = df["datetime"].max()
    latest = df[df["datetime"] == latest_time]

    grouped = (
        latest.groupby("strike")
        .agg({"oi_CE": "sum", "oi_PE": "sum", "total_oi": "sum"})
        .reset_index()
    )
    grouped.sort_values("strike", inplace=True)

    return grouped.to_dict(orient="records")


def get_volume_by_strike(df: pd.DataFrame, expiry: str = None) -> list:
    """Get Volume breakdown by strike price."""
    if expiry:
        df = df[df["expiry"].dt.strftime("%Y-%m-%d") == expiry]

    latest_time = df["datetime"].max()
    latest = df[df["datetime"] == latest_time]

    grouped = (
        latest.groupby("strike")
        .agg(
            {
                "volume_CE": "sum",
                "volume_PE": "sum",
                "total_volume": "sum",
            }
        )
        .reset_index()
    )
    grouped.sort_values("strike", inplace=True)

    return grouped.to_dict(orient="records")


def get_pcr_timeline(df: pd.DataFrame) -> list:
    """Get Put-Call Ratio over time."""
    pcr_time = (
        df.groupby("datetime")
        .agg({"oi_CE": "sum", "oi_PE": "sum", "volume_CE": "sum", "volume_PE": "sum"})
        .reset_index()
    )
    pcr_time["pcr_oi"] = np.where(
        pcr_time["oi_CE"] > 0, pcr_time["oi_PE"] / pcr_time["oi_CE"], np.nan
    )
    pcr_time["pcr_volume"] = np.where(
        pcr_time["volume_CE"] > 0,
        pcr_time["volume_PE"] / pcr_time["volume_CE"],
        np.nan,
    )
    pcr_time["datetime"] = pcr_time["datetime"].dt.strftime("%Y-%m-%d %H:%M")

    return pcr_time[["datetime", "pcr_oi", "pcr_volume"]].dropna().to_dict(orient="records")


def get_spot_price_timeline(df: pd.DataFrame) -> list:
    """Get spot price movement over time."""
    spot = (
        df.groupby("datetime")["spot_close"]
        .first()
        .reset_index()
    )
    spot["datetime"] = spot["datetime"].dt.strftime("%Y-%m-%d %H:%M")
    return spot.to_dict(orient="records")


def get_oi_change_analysis(df: pd.DataFrame) -> list:
    """Analyze OI changes across strikes."""
    oi_changes = (
        df.groupby("strike")
        .agg(
            {
                "oi_CE_change": "sum",
                "oi_PE_change": "sum",
                "oi_CE": "last",
                "oi_PE": "last",
            }
        )
        .reset_index()
    )
    oi_changes.sort_values("strike", inplace=True)
    return oi_changes.to_dict(orient="records")


def get_volatility_surface_data(df: pd.DataFrame) -> list:
    """Generate data for 3D volatility surface visualization."""
    # Use CE-PE spread as IV proxy, grouped by strike and days to expiry
    surface = (
        df.groupby(["strike", "days_to_expiry"])
        .agg(
            {
                "CE": "mean",
                "PE": "mean",
                "ce_pe_spread": "mean",
                "total_volume": "sum",
                "total_oi": "sum",
                "spot_close": "mean",
            }
        )
        .reset_index()
    )

    # Compute IV proxy: higher absolute ce_pe_spread + higher volume = higher implied activity
    surface["iv_proxy"] = (
        surface["CE"].abs() + surface["PE"].abs()
    ) / surface["spot_close"] * 100

    return surface.to_dict(orient="records")


def get_max_pain(df: pd.DataFrame, expiry: str = None) -> dict:
    """Calculate Max Pain strike price."""
    if expiry:
        df = df[df["expiry"].dt.strftime("%Y-%m-%d") == expiry]

    latest_time = df["datetime"].max()
    latest = df[df["datetime"] == latest_time]

    strikes = latest["strike"].unique()
    spot = latest["spot_close"].iloc[0] if len(latest) > 0 else 0

    pain = []
    for s in strikes:
        strike_data = latest[latest["strike"] == s]
        ce_oi = strike_data["oi_CE"].sum()
        pe_oi = strike_data["oi_PE"].sum()

        # Calculate pain at each strike
        ce_pain = sum(
            max(0, s - k) * latest[latest["strike"] == k]["oi_CE"].sum()
            for k in strikes
        )
        pe_pain = sum(
            max(0, k - s) * latest[latest["strike"] == k]["oi_PE"].sum()
            for k in strikes
        )

        pain.append(
            {"strike": float(s), "total_pain": float(ce_pain + pe_pain)}
        )

    if not pain:
        return {"max_pain_strike": 0, "spot_price": float(spot)}

    pain_df = pd.DataFrame(pain)
    max_pain_strike = pain_df.loc[pain_df["total_pain"].idxmin(), "strike"]

    return {
        "max_pain_strike": float(max_pain_strike),
        "spot_price": float(spot),
        "pain_data": pain,
    }


def get_heatmap_data(df: pd.DataFrame, metric: str = "oi_CE") -> list:
    """Generate heatmap data: strike x time."""
    pivot = df.pivot_table(
        index="strike",
        columns="date",
        values=metric,
        aggfunc="mean",
    ).fillna(0)

    result = []
    for strike in pivot.index:
        for date in pivot.columns:
            result.append(
                {
                    "strike": float(strike),
                    "date": str(date),
                    "value": float(pivot.loc[strike, date]),
                }
            )
    return result
