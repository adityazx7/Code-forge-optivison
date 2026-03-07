# OptiVision AI — AI-Powered Options Market Analytics Platform

**Technical Report**

**Team Antigravity** | CodeForge – The Open Innovation Gauntlet | MPSTME × TAQNEEQ

---

## 1. Introduction

Raw options market data is inherently multi-dimensional and overwhelming. NIFTY options alone generate hundreds of thousands of records spanning strike prices, expiry dates, open interest (OI), volume, and implied volatility — making it nearly impossible for traders and analysts to extract actionable signals through manual inspection.

**OptiVision AI** addresses this challenge by building an end-to-end, fully open-source analytics platform that transforms raw options data into clear, visual, and AI-driven insights. The platform processes 147,000+ records across three NIFTY options expiry cycles and delivers:

- **AI-powered anomaly detection** using Isolation Forest to flag unusual market activity
- **Interactive 3D volatility surfaces** for multi-dimensional IV analysis
- **Real-time analytics dashboards** with 13+ visualization types across 5 dedicated views
- **Intelligent pattern recognition** using KMeans clustering to group strikes by behavioral patterns
- **RAG-powered AI chatbot** using a local Llama 3 model for data narrative generation
- **Real-time WebSocket alerts** for anomaly notifications pushed to authenticated users

The system is built entirely on Free and Open Source Software (FOSS), ensuring zero vendor lock-in, full auditability, and cost-effective scalability.

---

## 2. Dataset Understanding

The platform ingests NIFTY options market data from three CSV files corresponding to three expiry cycles:

| File | Expiry Date | Size |
|------|------------|------|
| `2026-02-17_exp.csv` | 2026-02-17 | ~6.2 MB |
| `2026-02-24_exp.csv` | 2026-02-24 | ~7.5 MB |
| `2026-03-02_exp.csv` | 2026-03-02 | ~0.96 MB |

**Total: ~14.6 MB, 147,000+ records**

Each record contains: `datetime`, `strike`, `expiry`, `spot_close`, `oi_CE`, `oi_PE`, `volume_CE`, `volume_PE`, `CE` (call premium), and `PE` (put premium).

### Feature Engineering Pipeline

The raw data undergoes extensive preprocessing and enrichment in `data_loader.py`, producing **15+ computed features**:

| Feature | Formula / Description |
|---------|-----------------------|
| `pcr_oi` | Put-Call Ratio (OI): `oi_PE / oi_CE` |
| `pcr_volume` | Put-Call Ratio (Volume): `volume_PE / volume_CE` |
| `total_oi` | `oi_CE + oi_PE` |
| `total_volume` | `volume_CE + volume_PE` |
| `moneyness` | `strike / spot_close` |
| `moneyness_pct` | `(strike - spot_close) / spot_close × 100` |
| `oi_CE_change` | Diff of CE OI grouped by strike (proxy for OI build-up) |
| `oi_PE_change` | Diff of PE OI grouped by strike |
| `vol_oi_ratio_CE` | `volume_CE / oi_CE` — activity indicator |
| `vol_oi_ratio_PE` | `volume_PE / oi_PE` — activity indicator |
| `days_to_expiry` | `(expiry - datetime)` in fractional days |
| `ce_pe_spread` | `CE - PE` — premium spread as IV direction proxy |
| `money_class` | ITM / ATM / OTM classification using ±2% moneyness bands |
| `hour`, `minute`, `date` | Temporal features for intraday analysis |

Data is cleaned by parsing datetimes, dropping rows with critical NaN values, and sorting by time and strike. The processed data is cached in-memory for fast API access.

---

## 3. Proposed Approach and Methodology

### System Architecture

```
CSV Data Files (147K+ Records)
        │
        ▼
  Data Pipeline (Pandas + NumPy)
        │
        ▼
  Feature Engineering (PCR, Moneyness, Greeks, 15+ features)
        │
        ├──────────────────────┐
        ▼                      ▼
  ML Engine                Analytics Engine
  (Scikit-learn)           (FastAPI REST API, 13+ endpoints)
  - Isolation Forest            │
  - KMeans Clustering           │
        │                       │
        └──────────┬────────────┘
                   ▼
           DuckDB Analytics Engine
           (High-speed columnar queries for RAG)
                   │
                   ▼
            React Frontend (Next.js)
            Plotly.js + Recharts
                   │
                   ▼
          5 Interactive Dashboards
          + AI Chatbot + Real-time Alerts
```

### Data Processing Pipeline

1. **Load**: All CSV files are loaded and merged using Pandas with source file tracking.
2. **Clean**: Datetime parsing, NaN removal on critical fields (`datetime`, `strike`, `spot_close`), chronological sorting.
3. **Enrich**: 15+ computed features are added (PCR ratios, moneyness, OI changes, volume-OI ratios, days to expiry, money classification).
4. **Cache**: Processed DataFrame is cached globally to serve all API requests without recomputation.
5. **DuckDB Parallel Load**: The same CSV data is loaded into DuckDB's in-memory columnar store for high-speed SQL queries used by the RAG chatbot.

### AI/ML Models

**Isolation Forest (Anomaly Detection)**:
- 200 estimators with 5% contamination rate
- Operates on 9 feature dimensions: `oi_CE`, `oi_PE`, `volume_CE`, `volume_PE`, `total_oi`, `total_volume`, `pcr_oi`, `vol_oi_ratio_CE`, `vol_oi_ratio_PE`
- Features are StandardScaler-normalized before training
- Outputs anomaly scores and severity classification (HIGH / MEDIUM / LOW based on decision function thresholds)
- Anomaly reasons are determined by checking which features exceed the 95th percentile

**KMeans Clustering (Pattern Recognition)**:
- Groups strikes into behavioral clusters based on 7 aggregated features
- Clusters are auto-labeled: 🔥 High Activity Zone, 🐻 Bearish Cluster, 🐂 Bullish Cluster, ⚡ Active Trading Zone, 😴 Low Activity Zone
- Labels are assigned based on thresholds on average OI, volume, and PCR per cluster

### Visualization Techniques

| Dashboard | Visualization Types |
|-----------|-------------------|
| Market Dashboard | KPI cards, area chart (spot price), line chart (PCR timeline), bar chart (OI distribution) |
| Options Chain | Grouped bar chart (strike-wise OI/Volume), Max Pain calculation, heatmap (strike × date) |
| Anomaly Detection | Scatter plot (anomaly scores), severity distribution, KMeans cluster visualization |
| Volatility Surface | Interactive 3D surface (Plotly.js), 2D contour projection |
| Volume Analysis | CE/PE comparison bars, OI change analysis, pie chart (volume split), top active strikes |

---

## 4. Uniqueness and Innovation

1. **Fully FOSS Architecture**: The entire stack — from data processing (Pandas, NumPy) to ML (Scikit-learn) to frontend (React, Next.js) to AI chatbot (Ollama/Llama 3) to database (DuckDB, SQLite) — is 100% open-source. No proprietary APIs, no SaaS dependencies.

2. **RAG-Powered AI Chatbot**: The chatbot uses Retrieval-Augmented Generation (RAG) by querying DuckDB for real-time market context (market summary, strike analysis, IV context) and injecting it into Llama 3's prompt. This enables the AI to provide contextual, data-grounded analysis rather than generic responses. Supports both synchronous and Server-Sent Events (SSE) streaming responses.

3. **DuckDB as Analytics Engine**: Instead of relying on Pandas for all queries, we use DuckDB's columnar in-memory engine for complex SQL aggregations needed by the chatbot's RAG pipeline. This provides 10-100× speedup for analytical queries over row-oriented approaches.

4. **Real-Time WebSocket Alert System**: A background alert engine runs anomaly detection periodically (every 120 seconds), and pushes HIGH-severity alerts to authenticated users via WebSocket connections. Alerts include human-readable messages like "🚨 Sudden Volume Spike detected at Strike ₹23,500" with severity classification.

5. **Multi-Dimensional Anomaly Explanation**: Rather than just flagging anomalies, our system provides interpretable reasons by checking which specific features (volume spike, OI buildup, extreme PCR, high Vol/OI ratio) contributed to the anomaly flag — making the output actionable for traders.

6. **IV Proxy via Premium Spread**: In the absence of implied volatility data, we compute an IV proxy using `(|CE| + |PE|) / spot_close × 100`, enabling 3D volatility surface visualization without requiring options pricing models.

---

## 5. Implementation Details

### Technologies Used

| Layer | Technology | License | Purpose |
|-------|-----------|---------|---------|
| Data Processing | Pandas, NumPy | BSD | ETL pipeline, feature engineering |
| Machine Learning | Scikit-learn | BSD | Isolation Forest, KMeans, StandardScaler |
| Backend API | FastAPI, Uvicorn | MIT | REST API (20+ endpoints), WebSocket |
| Database | SQLite | Public Domain | User auth, settings storage |
| Analytics DB | DuckDB | MIT | High-speed columnar queries for RAG |
| AI/LLM | Ollama + Llama 3 | MIT / Meta License | Local AI chatbot, data narratives |
| Frontend | React 19, Next.js | MIT | SPA with routing, SSR |
| Visualization | Plotly.js, Recharts | MIT | Interactive 2D/3D charts |
| Auth | python-jose, passlib (bcrypt) | MIT / BSD | JWT tokens, password hashing |
| Real-time | FastAPI WebSocket | MIT | Push notifications |
| HTTP Client | httpx | BSD | Async Ollama API communication |
| Containerization | Docker, Docker Compose | Apache 2.0 | Multi-stage build deployment |
| CI/CD | GitHub Actions | — | Lint, test, build verification |

### System Components

**Backend (`backend/`)**: 13 Python modules totaling ~1,400 lines of code:
- `main.py` — FastAPI server with 20+ endpoints, WebSocket handler, and lifespan management
- `data_loader.py` — CSV loading, cleaning, and feature engineering pipeline
- `analytics.py` — 8 analytics functions (market overview, OI/Volume by strike, PCR timeline, spot price, OI changes, volatility surface, Max Pain, heatmap)
- `ml_engine.py` — Isolation Forest anomaly detection, KMeans clustering, anomaly detail generation with interpretable reasons
- `auth.py` — JWT-based authentication (register, login, token verification, current user dependency)
- `chatbot.py` — RAG-powered chatbot with Ollama integration (sync + SSE streaming)
- `duckdb_engine.py` — DuckDB initialization, market summary, strike analysis, IV context queries
- `ws_manager.py` — WebSocket connection manager (per-user connections, selective broadcast)
- `alert_engine.py` — Background anomaly detection loop with alert generation
- `database.py` — SQLite initialization for users and settings tables
- `user_settings.py` — User notification preferences API

**Frontend (`frontend/src/`)**: Next.js application with:
- Landing page with Three.js animated background
- Auth pages (Sign In / Register) with JWT token management
- 5 dashboard pages with Plotly.js and Recharts visualizations
- AI Chatbot component with SSE streaming support
- Notification bell component with WebSocket connection
- Dark trading terminal theme with responsive design

### Key Algorithms

**Max Pain Calculation**: For each strike price, we compute the total pain (loss) that option writers would incur if the underlying expired at that strike. The Max Pain strike is where total writer loss is minimized:

```
For each candidate settlement price S:
  CE_pain = Σ max(0, S - K) × OI_CE(K)  for all strikes K
  PE_pain = Σ max(0, K - S) × OI_PE(K)  for all strikes K
  Total_pain(S) = CE_pain + PE_pain
Max Pain = argmin(Total_pain)
```

**Anomaly Severity Classification**:
- HIGH: `decision_function score < -0.3`
- MEDIUM: `-0.3 ≤ score < -0.1`
- LOW: `score ≥ -0.1`

---

## 6. Results and Observations

### Anomaly Detection Results
- The Isolation Forest model flags approximately **5% of all records** (~7,350 out of 147,000+) as anomalous
- Anomalous records exhibit significantly higher mean total volume compared to normal records, confirming the model captures genuine volume spikes
- Top anomaly strikes cluster around ATM levels, consistent with known options market behavior where ATM strikes experience the most activity
- HIGH severity anomalies are concentrated on specific trading dates, suggesting event-driven market activity

### Clustering Insights
- KMeans consistently identifies 3-5 distinct behavioral zones:
  - **High Activity Zones**: ATM strikes with extreme OI and volume (PCR near 1.0)
  - **Bullish Clusters**: Low PCR (< 0.7) strikes indicating call-heavy activity
  - **Bearish Clusters**: High PCR (> 1.5) strikes indicating put-heavy activity
  - **Low Activity Zones**: Deep OTM strikes with minimal trading

### Market Structure Observations
- PCR timeline reveals clear intraday sentiment shifts, with PCR rising toward market close (increased hedging)
- OI buildup patterns show support/resistance levels forming at round-number strikes (e.g., 23,000, 23,500, 24,000)
- The 3D volatility surface reveals a pronounced volatility smile, with higher IV proxies for deep ITM and OTM strikes
- Max Pain calculation provides a strong anchor point for short-term price targets near expiry

---

## 7. Discussion

### Interpretation of Results
The anomaly detection system successfully identifies unusual market activity that would be invisible in raw data. By combining 9 feature dimensions, the Isolation Forest captures multi-factor anomalies that single-metric thresholds would miss. The interpretable reason generation (volume spike, OI buildup, extreme PCR) bridges the gap between ML output and trader decision-making.

The RAG chatbot demonstrates that local LLMs can provide meaningful market analysis when grounded in real data context. DuckDB's sub-second query performance ensures the chatbot can retrieve relevant market statistics without noticeable latency.

### Limitations
1. **IV Proxy**: The premium-based IV proxy (`(|CE| + |PE|) / spot`) is a simplified approximation. True implied volatility requires solving the Black-Scholes equation, which needs risk-free rate and dividend yield inputs.
2. **Static Dataset**: The current implementation uses pre-loaded CSV files. A production system would need real-time market data feeds.
3. **LLM Dependency**: The chatbot requires a local Ollama instance with Llama 3 pulled. Without it, the chatbot gracefully degrades but loses natural-language analysis capability.
4. **Single User Context**: The alert system broadcasts to all users with notifications enabled, without per-user alert customization.

### Possible Improvements
- Integrate real-time market data feeds (NSE websocket API) for live analysis
- Add Black-Scholes IV calculation for accurate volatility surfaces
- Implement per-user alert rules (custom strike thresholds, PCR bounds)
- Add portfolio simulation based on detected patterns
- Deploy ONNX-exported ML models for faster inference
- Add historical anomaly comparison for pattern recurrence detection

---

## 8. Conclusion and Future Work

OptiVision AI demonstrates that a fully FOSS stack can deliver enterprise-grade options market analytics. The platform successfully:

- Processes **147,000+ NIFTY options records** through an automated ETL and feature engineering pipeline
- Detects **~5% anomalous market activity** using Isolation Forest with interpretable explanations
- Clusters strikes into **behavioral zones** using KMeans for quick market structure understanding
- Visualizes complex multi-dimensional data through **13+ interactive charts** including 3D volatility surfaces
- Provides **AI-powered data narratives** through a RAG chatbot grounded in real market data
- Delivers **real-time alerts** via WebSocket for time-sensitive anomaly notifications

### Future Enhancements
1. **Live Data Integration**: Connect to NSE real-time feeds for live market analysis
2. **Advanced ML**: Add LSTM/Transformer models for volume/OI prediction
3. **Options Greeks**: Compute Delta, Gamma, Theta, Vega for complete risk analysis
4. **Multi-Index Support**: Extend beyond NIFTY to Bank NIFTY, Fin NIFTY, and individual stock options
5. **Backtesting Engine**: Allow users to test strategies against historical anomaly patterns
6. **Mobile App**: Build a React Native companion app for on-the-go alerts

---

## 9. References

1. Liu, F.T., Ting, K.M. and Zhou, Z.H. (2008). "Isolation Forest." *IEEE International Conference on Data Mining*.
2. MacQueen, J. (1967). "Some methods for classification and analysis of multivariate observations." *Proceedings of the 5th Berkeley Symposium on Mathematical Statistics and Probability*.
3. FastAPI Documentation — https://fastapi.tiangolo.com
4. Scikit-learn Documentation — https://scikit-learn.org/stable/
5. Plotly.js Documentation — https://plotly.com/javascript/
6. DuckDB Documentation — https://duckdb.org/docs/
7. Ollama Documentation — https://ollama.ai
8. React Documentation — https://react.dev
9. Next.js Documentation — https://nextjs.org/docs
10. NSE Options Data Reference — https://www.nseindia.com
11. Hull, J.C. (2018). *Options, Futures, and Other Derivatives*. 10th Edition, Pearson.
12. Passlib Documentation — https://passlib.readthedocs.io
13. python-jose Documentation — https://python-jose.readthedocs.io
