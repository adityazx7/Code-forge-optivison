"""
DuckDB Analytics Engine — OptiVision AI
High-speed columnar query engine for options data.
"""

import os
import glob
import duckdb

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

_duck_conn = None


def init_duckdb():
    """Initialize DuckDB and load CSV data into memory."""
    global _duck_conn
    _duck_conn = duckdb.connect(":memory:")

    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    if not csv_files:
        print(f"[DuckDB] No CSV files found in {DATA_DIR}")
        return

    # Load all CSVs into a single table
    file_list = ", ".join(f"'{f}'" for f in csv_files)
    _duck_conn.execute(f"""
        CREATE TABLE IF NOT EXISTS options_data AS
        SELECT * FROM read_csv_auto([{file_list}], union_by_name=true)
    """)

    count = _duck_conn.execute("SELECT COUNT(*) FROM options_data").fetchone()[0]
    print(f"[DuckDB] Loaded {count:,} records from {len(csv_files)} CSV files")


def get_duckdb():
    """Get the DuckDB connection."""
    global _duck_conn
    if _duck_conn is None:
        init_duckdb()
    return _duck_conn


def query_options_data(sql_filter: str = "", limit: int = 1000) -> list[dict]:
    """Run a filtered query on options data."""
    conn = get_duckdb()
    where = f"WHERE {sql_filter}" if sql_filter else ""
    result = conn.execute(f"""
        SELECT * FROM options_data {where} LIMIT {limit}
    """).fetchdf()
    return result.to_dict(orient="records")


def get_market_summary() -> dict:
    """Get a quick market summary for chatbot context."""
    conn = get_duckdb()
    try:
        summary = conn.execute("""
            SELECT
                COUNT(*) as total_records,
                COUNT(DISTINCT strike) as unique_strikes,
                MIN(datetime) as date_start,
                MAX(datetime) as date_end,
                AVG(spot_close) as avg_spot,
                MAX(spot_close) as max_spot,
                MIN(spot_close) as min_spot,
                SUM(volume_CE + volume_PE) as total_volume,
                AVG(CASE WHEN oi_CE > 0 THEN oi_PE::FLOAT / oi_CE END) as avg_pcr
            FROM options_data
        """).fetchdf().to_dict(orient="records")[0]
        return summary
    except Exception as e:
        return {"error": str(e)}


def get_strike_analysis(strike: float = None) -> list[dict]:
    """Get analysis for a specific strike or top strikes."""
    conn = get_duckdb()
    try:
        if strike:
            result = conn.execute(f"""
                SELECT
                    strike,
                    SUM(oi_CE) as total_ce_oi,
                    SUM(oi_PE) as total_pe_oi,
                    SUM(volume_CE) as total_ce_vol,
                    SUM(volume_PE) as total_pe_vol,
                    AVG(CASE WHEN oi_CE > 0 THEN oi_PE::FLOAT / oi_CE END) as pcr
                FROM options_data
                WHERE strike = {strike}
                GROUP BY strike
            """).fetchdf()
        else:
            result = conn.execute("""
                SELECT
                    strike,
                    SUM(oi_CE) as total_ce_oi,
                    SUM(oi_PE) as total_pe_oi,
                    SUM(volume_CE + volume_PE) as total_volume,
                    AVG(CASE WHEN oi_CE > 0 THEN oi_PE::FLOAT / oi_CE END) as pcr
                FROM options_data
                GROUP BY strike
                ORDER BY total_volume DESC
                LIMIT 10
            """).fetchdf()
        return result.to_dict(orient="records")
    except Exception as e:
        return [{"error": str(e)}]


def get_iv_context() -> list[dict]:
    """Get IV (implied volatility proxy) context for chatbot."""
    conn = get_duckdb()
    try:
        result = conn.execute("""
            SELECT
                strike,
                AVG(CE) as avg_ce_premium,
                AVG(PE) as avg_pe_premium,
                AVG(ABS(CE - PE)) as avg_ce_pe_spread,
                AVG(spot_close) as avg_spot,
                COUNT(*) as data_points
            FROM options_data
            GROUP BY strike
            ORDER BY avg_ce_pe_spread DESC
            LIMIT 15
        """).fetchdf()
        return result.to_dict(orient="records")
    except Exception as e:
        return [{"error": str(e)}]
