# StockPulse AI - Deep Stock Analysis Platform

An AI-powered stock analysis platform built with Next.js, featuring deep research, technical analysis, competitor insights, and smart buy/sell/hold recommendations.

## Features

### AI-Powered Analysis
- **Smart Recommendations**: Automated Buy/Sell/Hold signals with confidence scores
- **Price Target Projections**: Bear, Base, and Bull case price targets
- **Risk Assessment**: Multi-factor risk analysis with volatility metrics
- **Sentiment Analysis**: News and market sentiment scoring

### Deep Technical Analysis (15+ Indicators)
- **Moving Averages**: SMA (20/50/200), EMA (12/26), VWAP
- **Momentum**: RSI, MACD (with signal line and histogram), Stochastic Oscillator
- **Volatility**: Bollinger Bands, ATR (Average True Range)
- **Trend**: ADX (Average Directional Index)
- **Volume**: On-Balance Volume (OBV), Volume analysis
- **Levels**: Fibonacci Retracement, Support & Resistance levels

### Competitor Analysis
- Side-by-side comparison of key metrics (P/E, Market Cap, Performance)
- Market cap comparison charts
- P/E ratio benchmarking against sector peers
- AI-generated competitive landscape analysis

### Market Dashboard
- Real-time market indices (SPY, QQQ, DIA, IWM, VTI)
- Trending stocks with live data
- Sector performance heatmap
- Quick-search any stock symbol

### Portfolio & Watchlist
- Portfolio tracker with P&L analysis
- Allocation pie chart visualization
- Watchlist with AI signals for tracked stocks
- Per-holding AI recommendation signals

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Data**: Yahoo Finance API (via yahoo-finance2)
- **AI**: OpenAI GPT-4o-mini (optional, falls back to built-in analysis engine)
- **UI**: Custom glass-morphism design system

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Always from repo root (workspace) — do not npm install inside stock-analysis/
npm install

# If dependencies act broken or you see duplicate node_modules:
npm run reinstall
```

### Environment Variables

Create `.env.local` in the `stock-analysis` directory:

```env
GEMINI_API_KEY=your-gemini-key
FMP_API_KEY=your-fmp-key
FINNHUB_API_KEY=your-finnhub-key
# Optional fallback
OPENAI_API_KEY=sk-your-key-here
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

**Root Directory must be `stock-analysis`** — see **[VERCEL-FIX.md](VERCEL-FIX.md)** if deploy fails with `.next not found`.

Full guide: **[stock-analysis/DEPLOY.md](stock-analysis/DEPLOY.md)**

### Deploy to Netlify

- **Zip bundle** (source): run `./scripts/build-netlify-zip.sh` → `stock-analysis-netlify.zip`
- **Instructions**: [stock-analysis/NETLIFY-DEPLOY.md](stock-analysis/NETLIFY-DEPLOY.md)

## How It Works

1. **Search any stock** by entering a ticker symbol (e.g., AAPL, TSLA, NVDA)
2. **View the dashboard** with real-time market data and trending stocks
3. **Get AI analysis** including technical indicators, buy/sell signals, and price targets
4. **Compare competitors** with side-by-side metrics and charts
5. **Track your portfolio** with P&L analysis and AI-powered signals
6. **Monitor your watchlist** with automatic signal updates

## Data Sources

- **Yahoo Finance**: Real-time quotes, historical data, company profiles
- **Built-in Analysis Engine**: 15+ technical indicators computed in real-time
- **OpenAI** (optional): Enhanced AI-powered analysis when API key is provided

### Red Flags & Risk Scanner
- **Insider Trading Detection**: Monitors SEC filing patterns for suspicious insider selling
- **Volume Anomaly Detection**: Alerts on 2x+ volume spikes that may indicate institutional activity
- **Pump & Dump Scanner**: Detects RSI + volume combos indicating potential manipulation
- **Price Gap Analysis**: Flags unusual after-hours moves and opening gaps
- **Divergence Detection**: MACD/price bearish and bullish divergences
- **Bollinger Squeeze**: Detects low-volatility periods that precede explosive moves
- **Risk Score System**: A-F grading across 5 dimensions (Technical, Fundamental, Sentiment, Manipulation, Volatility)

## Disclaimer

This application is for informational and educational purposes only. It does not constitute financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.
