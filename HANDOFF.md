# HANDOFF: Crypto Portfolio & Price Dashboard

**Status:** Not started — planning only. Nothing has been built yet.
**Owner:** Kyle Goto Hale
**Working name:** CoinPulse (placeholder — rename freely)

---

## 1. Why this project exists

Kyle is applying for a **Software Engineering Intern (Fall)** role at **Gemini**, a crypto/Web3 exchange platform. The job posting lists this as an essential qualification:

> "Passionate about blockchain, digital assets, and the Web3 industry — a genuine drive to make an impact in this space is essential."

Kyle's current resume (CrowdSense, Help LLC, Campus Pulse, Handmade Compiler) has strong full-stack and ML signal, but **nothing touching blockchain, crypto, or digital assets.** No amount of resume rewording can manufacture that qualification — it needs a real, if small, project behind it.

This project exists to close that specific gap: something genuine enough to talk about in a cover letter or interview, not a tutorial copy-paste. It does **not** need to be large. Scope is deliberately a weekend-sized build, because Gemini's fall internship recruiting is time-sensitive — Kyle should apply soon regardless of whether this project is finished, and add it to the resume/cover letter as a fast follow.

**Do not let this project's scope creep.** A shallow-but-real MVP that Kyle fully understands and can explain beats a bigger build that's copy-pasted or half-understood.

---

## 2. What the project actually is

A live crypto price + portfolio dashboard. Same shape as Kyle's existing **CrowdSense** project (API backend + React dashboard), just pointed at crypto market data instead of computer vision. This is intentional — it reuses skills Kyle already has, which keeps build time low and keeps the "why I built this" story authentic ("I already knew how to build this shape of app, I pointed it at a new domain to learn it").

### MVP feature set (build in this order)
1. **Live price ticker** — fetch and display current price + 24h % change for a fixed list of coins (e.g., BTC, ETH, SOL, plus a few others).
2. **Historical chart** — click a coin, show a 7-day and 30-day price chart.
3. **Watchlist** — add/remove coins from a tracked list (client-side state is fine for MVP; no auth needed).
4. **Portfolio view** — user manually enters holdings (coin + quantity held), dashboard computes total portfolio value and an allocation breakdown (pie or donut chart).
5. **Auto-refresh** — poll prices on an interval (e.g., every 30–60 seconds) so it feels "live."

### Stretch goals (only if time allows, do NOT block MVP on these)
- **Read-only wallet connect**: let a user paste a public Ethereum address and pull real on-chain token balances (via a public RPC or a free block-explorer API). This is the single highest-value stretch goal — it's the difference between "crypto market data app" and "an app that actually touches digital assets/Web3," which maps directly to the job posting's language.
- Price alerts (e.g., notify/highlight when a coin crosses a threshold).
- Deploy live (Vercel for frontend + Render for backend — same pattern as Campus Pulse) so there's a working link, not just a repo.

---

## 3. Suggested tech stack

Reuse what Kyle already knows — do not introduce new frameworks for their own sake.

- **Backend:** Python + FastAPI (matches CrowdSense/Campus Pulse) — acts as a thin proxy/cache in front of the price API.
- **Frontend:** React + Tailwind CSS, charts via **Recharts** (already used in Reddit Sentiment Tracker) or Chart.js.
- **Data source:** [CoinGecko public API](https://www.coingecko.com/en/api/documentation) — free tier, no API key required for the basic endpoints needed here. Rate limits apply (roughly 10–30 calls/min on the free tier as of last check — **verify current limits before building**, since API providers change these).
  - `GET /coins/markets` — current price, 24h change, market cap for a list of coins in one call.
  - `GET /coins/{id}/market_chart?vs_currency=usd&days=7` — historical price series for the chart view.
- **Stretch goal data source (wallet balances):** a public Ethereum RPC (e.g., via a free-tier provider) or a free block-explorer API (e.g., Etherscan's free tier) for read-only balance lookups on a testnet or mainnet address.

---

## 4. Suggested repo structure

```
coinpulse/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── coingecko_client.py  # thin wrapper around CoinGecko endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceTicker.jsx
│   │   │   ├── CoinChart.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   └── Portfolio.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 5. Step-by-step build plan

- [ ] **Step 0:** Confirm current CoinGecko free-tier rate limits and endpoint shapes (APIs change — don't assume the details above are still accurate).
- [ ] **Step 1:** Backend — FastAPI endpoint that proxies `/coins/markets` for a hardcoded coin list, returns clean JSON.
- [ ] **Step 2:** Frontend — render the price ticker (coin, price, 24h change, color-coded red/green).
- [ ] **Step 3:** Backend — endpoint proxying `/coins/{id}/market_chart`.
- [ ] **Step 4:** Frontend — clicking a coin shows a chart (Recharts line chart) with 7d/30d toggle.
- [ ] **Step 5:** Frontend — watchlist add/remove (local state, no backend persistence needed for MVP).
- [ ] **Step 6:** Frontend — portfolio input form (coin + quantity) → compute total value + allocation chart.
- [ ] **Step 7:** Add polling/auto-refresh to the ticker.
- [ ] **Step 8 (stretch):** Read-only wallet balance lookup by address.
- [ ] **Step 9 (stretch):** Deploy (Vercel + Render), get a live link.
- [ ] **Step 10:** Write the README with real screenshots and an honest description of what it does and why it was built (see Section 6).

---

## 6. Notes for the resume/cover letter (important — read before writing any bullet points)

When this project is finished, do **not** invent metrics for it (e.g., fake user counts, fake performance numbers). Kyle's resume has a standing practice of only using real, verifiable numbers (see how CrowdSense's "44% mAP" and Help LLC's "1,800+ commits" were sourced from real results/real repo stats, not estimates).

Real, honest things this project *can* claim once built:
- Number of coins tracked / data points refreshed on a live polling interval
- Whether it's live-deployed (a real URL is a strong, checkable claim)
- If the wallet-connect stretch goal is done: that it reads real on-chain data, not just market prices — this is the detail that most directly answers Gemini's "digital assets" language

If a future session picks this up, ask Kyle for the real numbers/details once the build exists, rather than guessing.
