# HANDOFF: Crypto Portfolio & Price Dashboard

**Status:** In progress — Steps 0–4 complete, OOP refactor complete. Next: Step 5 (watchlist).
**Owner:** Kyle Goto Hale
**Working name:** CoinPulse
**Branch:** `umiB` (all work pushed here)
**Last updated:** 2026-07-15

---

## 1. Why this project exists

Kyle is applying for a **Software Engineering Intern (Fall)** role at **Gemini**, a crypto/Web3 exchange platform. The job posting lists this as an essential qualification:

> "Passionate about blockchain, digital assets, and the Web3 industry — a genuine drive to make an impact in this space is essential."

Kyle's current resume (CrowdSense, Help LLC, Campus Pulse, Handmade Compiler) has strong full-stack and ML signal, but **nothing touching blockchain, crypto, or digital assets.** No amount of resume rewording can manufacture that qualification — it needs a real, if small, project behind it.

This project exists to close that specific gap: something genuine enough to talk about in a cover letter or interview, not a tutorial copy-paste. Scope is deliberately a weekend-sized build. Kyle should apply to Gemini soon regardless of whether this project is finished, and add it to the resume/cover letter as a fast follow.

**Do not let this project's scope creep.** A shallow-but-real MVP that Kyle fully understands and can explain beats a bigger build that's copy-pasted or half-understood.

---

## 2. What the project actually is

A live crypto price + portfolio dashboard. Same shape as Kyle's existing **CrowdSense** project (API backend + React dashboard), just pointed at crypto market data instead of computer vision. This is intentional — it reuses skills Kyle already has, which keeps build time low and keeps the "why I built this" story authentic.

### MVP feature set (build in this order)
1. **Live price ticker** ✅ — coin, price, 24h % change, market cap, volume. Color-coded red/green.
2. **Historical chart** ✅ — click a coin, show a Recharts area chart with 7d/30d toggle.
3. **Watchlist** — add/remove coins from a tracked list (client-side state is fine for MVP).
4. **Portfolio view** — user manually enters holdings (coin + quantity), dashboard computes total value + pie/donut allocation chart.
5. **Auto-refresh** ✅ — prices poll every 60 seconds (matches CoinGecko free-tier cache TTL).

### Stretch goals (only if time allows)
- **Read-only wallet connect**: paste a public Ethereum address, pull real on-chain token balances via Etherscan free-tier API. Highest-value stretch goal — maps directly to Gemini's "digital assets" language.
- Deploy live (Vercel for frontend + Render for backend — same pattern as Campus Pulse).

---

## 3. Tech stack (as built)

- **Backend:** Python 3.11 + FastAPI + httpx + python-dotenv. Runs on port 8000.
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Recharts. Dev server on port 5173.
- **Data source:** CoinGecko Demo API (free). Verified rate limits: **100 calls/min, 10,000/month**.
  - Base URL: `https://api.coingecko.com/api/v3`
  - Auth header: `x-cg-demo-api-key: <key>`
  - `GET /coins/markets` — cache refreshes every 60s on free tier.
  - `GET /coins/{id}/market_chart?vs_currency=usd&days=7` — historical data, 365-day cap on free tier.
- **API key:** stored in `backend/.env` as `COINGECKO_API_KEY`. Never commit this file (it is in `.gitignore`).
- **Testing:** pytest + pytest-asyncio (backend), vitest + @testing-library/react (frontend).

---

## 4. Actual repo structure (as built)

```
CoinC/
├── backend/
│   ├── config.py               # Frozen Settings dataclass — single source of truth for env/config
│   ├── coingecko_client.py     # CoinGeckoClient class — all HTTP transport, auth, timeouts
│   ├── coin_service.py         # CoinService class — business logic, validation, composes client
│   ├── main.py                 # FastAPI app — thin route handlers, dependency injection via Depends()
│   ├── requirements.txt
│   ├── .env                    # NEVER COMMIT — contains COINGECKO_API_KEY
│   └── tests/
│       ├── conftest.py         # Adds backend/ to sys.path for imports
│       └── test_coin_service.py  # 13 unit tests (mock injection, no network)
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── CoinApiService.js   # Static class — all fetch() calls live here
│   │   ├── utils/
│   │   │   └── PriceFormatter.js   # Static class — all price/number/% formatting
│   │   ├── hooks/
│   │   │   ├── useCoinMarkets.js   # Encapsulates ticker state + 60s polling interval
│   │   │   └── useCoinChart.js     # Encapsulates chart state + stale-request cancellation
│   │   ├── components/
│   │   │   ├── PriceTicker.jsx     # Pure presentational — table + CoinRow sub-component
│   │   │   ├── CoinChart.jsx       # ChartHeader + PriceAreaChart sub-components
│   │   │   ├── Watchlist.jsx       # TODO (Step 5)
│   │   │   └── Portfolio.jsx       # TODO (Step 6)
│   │   ├── __tests__/
│   │   │   ├── setup.js
│   │   │   ├── PriceFormatter.test.js  # 15 unit tests
│   │   │   └── CoinApiService.test.js  # 10 unit tests
│   │   ├── App.jsx             # Orchestration only — no business logic
│   │   └── index.css           # Tailwind import + minimal body styles
│   ├── vite.config.js          # Vite proxy /api → localhost:8000, vitest config
│   └── package.json
├── HANDOFF.md
├── .gitignore
└── README.md                   # TODO (Step 10)
```

---

## 5. How to run locally

```bash
# Backend
cd backend
python3 -m venv .venv          # only needed once
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000

# Frontend (separate terminal)
cd frontend
npm install                    # only needed once
npm run dev
# → http://localhost:5173
```

---

## 6. How to run tests

```bash
# Backend (13 tests, no network required)
cd backend
.venv/bin/python -m pytest tests/ -v

# Frontend (25 tests, no network required)
cd frontend
npm test
```

---

## 7. Architecture rules — read before adding any code

The codebase follows strict OOP and SOLID principles. Every new file must fit the existing layered architecture. Here are the rules future sessions must follow:

### Backend layers (do not cross these boundaries)

| Layer | File | Allowed to |
|-------|------|------------|
| Config | `config.py` | Read env vars. Nothing else. |
| Transport | `coingecko_client.py` | Make HTTP calls, handle auth/timeouts. No business logic. |
| Service | `coin_service.py` | Validate inputs, call the client, apply domain rules. No HTTP concerns. |
| Route | `main.py` | Parse HTTP input, call service, map exceptions to status codes. No logic. |

- **Never** add `os.getenv()` outside `config.py`.
- **Never** add `httpx` calls outside `CoinGeckoClient`.
- **Never** add validation logic in route handlers — it belongs in `CoinService._validate_*` private methods.
- New endpoints follow the same pattern: add a method to `CoinGeckoClient`, a method to `CoinService`, a route in `main.py`. Write tests in `tests/test_coin_service.py` using a mock client.

### Frontend layers (do not cross these boundaries)

| Layer | Location | Allowed to |
|-------|----------|------------|
| API | `services/CoinApiService.js` | Call `fetch()`. Nothing else. |
| Formatting | `utils/PriceFormatter.js` | Format numbers/strings. No state, no fetch. |
| State | `hooks/use*.js` | Own state + side effects. Call `CoinApiService`. No JSX. |
| Presentation | `components/*.jsx` | Render JSX. Call hooks or receive props. No fetch, no format math inline. |
| Orchestration | `App.jsx` | Compose hooks and components. Manage shared state (selectedCoin, etc.). |

- **Never** call `fetch()` directly in a component or hook — always go through `CoinApiService`.
- **Never** duplicate formatting logic — extend `PriceFormatter` if a new format is needed.
- **Every new component** should be purely presentational. If it needs data, extract a hook.
- **Every new hook** gets a corresponding test in `src/__tests__/`. Mock `CoinApiService` with `vi.fn()`.

### Naming conventions
- Python: Google-style docstrings on every public class and method. Private methods prefixed with `_`.
- JS/JSX: JSDoc `@param` / `@returns` on every exported function and class method. Private helpers (not exported) live at the bottom of the file.
- Sub-components that are only used by one parent live in the same file as that parent (e.g. `CoinRow` inside `PriceTicker.jsx`, `ChartHeader` inside `CoinChart.jsx`).

---

## 8. Step-by-step build plan

- [x] **Step 0:** Verify CoinGecko free-tier rate limits and endpoint shapes.
- [x] **Step 1:** Backend — FastAPI proxy for `/coins/markets`.
- [x] **Step 2:** Frontend — live price ticker, color-coded 24h change.
- [x] **Step 3:** Backend — FastAPI proxy for `/coins/{id}/market_chart`.
- [x] **Step 4:** Frontend — Recharts area chart with 7d/30d toggle on coin click.
- [x] **OOP Refactor** — Layered architecture, SOLID principles, JSDoc/docstrings, 38 unit tests.
- [ ] **Step 5:** Frontend — Watchlist (`Watchlist.jsx`). Add/remove coins, local React state only.
- [ ] **Step 6:** Frontend — Portfolio (`Portfolio.jsx`). Coin + quantity input form, total USD value, Recharts pie/donut allocation chart.
- [ ] **Step 7:** Auto-refresh is already wired (`useCoinMarkets` polls every 60s). Verify it feels live and add a visible "next refresh in Xs" countdown if desired.
- [ ] **Step 8 (stretch):** Read-only Ethereum wallet balance lookup. Add `EtherscanClient` in backend (same pattern as `CoinGeckoClient`), new `WalletService`, new `/wallet/{address}` route, new `WalletView.jsx` component + `useWalletBalances` hook on the frontend.
- [ ] **Step 9 (stretch):** Deploy — Vercel (frontend) + Render (backend). Get a live URL.
- [ ] **Step 10:** README with real screenshots, honest description, real metrics only (no invented numbers).

---

## 9. Coins currently tracked

8 coins hardcoded in `backend/config.py` → `Settings.tracked_coin_ids`:

`bitcoin`, `ethereum`, `solana`, `cardano`, `ripple`, `dogecoin`, `polkadot`, `chainlink`

To add or remove coins, edit that tuple in `config.py` only — the rest of the stack picks it up automatically.

---

## 10. Notes for the resume/cover letter

Do **not** invent metrics. Kyle's resume uses only real, verifiable numbers.

Real things this project can claim once finished:
- 8 coins tracked, prices refreshed every 60 seconds via live API polling
- Whether it's live-deployed (a real URL is a strong, checkable claim)
- If the wallet-connect stretch goal is done: reads real on-chain Ethereum data — this is the detail that most directly answers Gemini's "digital assets" language
- 38 unit tests across backend (pytest) and frontend (vitest) — a signal of engineering discipline

If a future session picks this up, ask Kyle for real numbers/screenshots once the build exists, rather than guessing.
