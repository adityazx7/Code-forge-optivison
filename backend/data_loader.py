"""
Data Loader Module — OptiVision AI
Loads, merges, and enriches NIFTY options CSV data.
"""

import os
import glob
import pandas as pd
import numpy as np
from functools import lru_cache

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def load_all_data() -> pd.DataFrame:
    """Load and merge all CSV files from the data directory."""
    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

    frames = []
    for f in csv_files:
        df = pd.read_csv(f)
        df["source_file"] = os.path.basename(f)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    return combined


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and prepare the raw data."""
    df = df.copy()

    # Parse datetime columns
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df["expiry"] = pd.to_datetime(df["expiry"], errors="coerce")

    # Drop rows with critical NaN values
    df.dropna(subset=["datetime", "strike", "spot_close"], inplace=True)

    # Sort by time and strike
    df.sort_values(["datetime", "strike"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add computed analytical columns."""
    df = df.copy()

    # --- Put-Call Ratio (PCR) ---
    df["pcr_oi"] = np.where(df["oi_CE"] > 0, df["oi_PE"] / df["oi_CE"], np.nan)
    df["pcr_volume"] = np.where(
        df["volume_CE"] > 0, df["volume_PE"] / df["volume_CE"], np.nan
    )

    # --- Total OI and Volume ---
    df["total_oi"] = df["oi_CE"] + df["oi_PE"]
    df["total_volume"] = df["volume_CE"] + df["volume_PE"]

    # --- Moneyness ---
    df["moneyness"] = df["strike"] / df["spot_close"]
    df["moneyness_pct"] = (df["strike"] - df["spot_close"]) / df["spot_close"] * 100

    # --- OI Change proxies (within sorted data) ---
    df["oi_CE_change"] = df.groupby("strike")["oi_CE"].diff().fillna(0)
    df["oi_PE_change"] = df.groupby("strike")["oi_PE"].diff().fillna(0)

    # --- Volume-OI Ratio (activity indicator) ---
    df["vol_oi_ratio_CE"] = np.where(
        df["oi_CE"] > 0, df["volume_CE"] / df["oi_CE"], 0
    )
    df["vol_oi_ratio_PE"] = np.where(
        df["oi_PE"] > 0, df["volume_PE"] / df["oi_PE"], 0
    )

    # --- Days to Expiry ---
    df["days_to_expiry"] = (df["expiry"] - df["datetime"]).dt.total_seconds() / 86400

    # --- CE/PE premium (proxy for IV direction) ---
    df["ce_pe_spread"] = df["CE"] - df["PE"]

    # --- Time features ---
    df["hour"] = df["datetime"].dt.hour
    df["minute"] = df["datetime"].dt.minute
    df["date"] = df["datetime"].dt.date.astype(str)

    # --- In/At/Out of the money classification ---
    conditions = [
        df["moneyness"] < 0.98,  # ITM for puts, OTM for calls
        df["moneyness"].between(0.98, 1.02),  # ATM
        df["moneyness"] > 1.02,  # OTM for puts, ITM for calls
    ]
    choices = ["ITM", "ATM", "OTM"]
    df["money_class"] = np.select(conditions, choices, default="ATM")

    return df


def get_processed_data() -> pd.DataFrame:
    """Full pipeline: load -> clean -> engineer features."""
    raw = load_all_data()
    cleaned = clean_data(raw)
    enriched = engineer_features(cleaned)
    return enriched


# Cached version for API use
_cached_data = None


def get_cached_data() -> pd.DataFrame:
    """Return cached processed data (loads once)."""
    global _cached_data
    if _cached_data is None:
        _cached_data = get_processed_data()
    return _cached_data
