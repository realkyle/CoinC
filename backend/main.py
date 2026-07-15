"""FastAPI application entry point.

Defines HTTP route handlers and wires together the dependency graph
(Settings → CoinGeckoClient → CoinService) using FastAPI's built-in
Depends() mechanism so each layer receives its collaborators rather than
constructing them internally (DIP).

Route handlers are intentionally thin: they parse HTTP input, delegate
entirely to CoinService, and translate domain exceptions into HTTP status
codes. No business logic lives here.
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware

from config import settings, Settings
from coingecko_client import CoinGeckoClient
from coin_service import CoinService


app = FastAPI(
    title="CoinPulse API",
    description="Proxy API for live crypto market data sourced from CoinGecko.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Dependency providers
# FastAPI calls these to construct the object graph for each request.
# Defined as standalone functions so tests can override them via
# app.dependency_overrides without modifying route handlers.
# ---------------------------------------------------------------------------

def get_settings() -> Settings:
    """Provide the module-level Settings singleton to dependants."""
    return settings


def get_coin_service(cfg: Settings = Depends(get_settings)) -> CoinService:
    """Construct and provide a fully wired CoinService per request.

    Args:
        cfg: Application settings, injected by FastAPI.

    Returns:
        A CoinService instance composed with a CoinGeckoClient.
    """
    client = CoinGeckoClient(cfg)
    return CoinService(client, cfg)


# ---------------------------------------------------------------------------
# Route handlers — HTTP adapters only; all logic lives in CoinService.
# ---------------------------------------------------------------------------

@app.get("/markets", summary="Live market data for all tracked coins")
async def get_markets(
    vs_currency: str = Query(default="usd", description="ISO 4217 price denomination"),
    service: CoinService = Depends(get_coin_service),
) -> list:
    """Return current price, 24-hour change, and market cap for each tracked coin.

    Args:
        vs_currency: Target currency code (default: ``usd``).
        service: CoinService instance injected by FastAPI.

    Returns:
        JSON array of coin market-data objects from CoinGecko.

    Raises:
        HTTPException 502: If the upstream CoinGecko request fails.
    """
    try:
        return await service.get_markets(vs_currency)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get(
    "/coins/{coin_id}/chart",
    summary="Historical price chart data for one coin",
)
async def get_coin_chart(
    coin_id: str,
    days: int = Query(default=7, ge=1, le=365, description="Lookback window in days"),
    vs_currency: str = Query(default="usd", description="ISO 4217 price denomination"),
    service: CoinService = Depends(get_coin_service),
) -> dict:
    """Return time-series price, market-cap, and volume data for a single coin.

    Args:
        coin_id: CoinGecko coin ID (e.g. ``"bitcoin"``).
        days: Number of days of history to return (1–365).
        vs_currency: Target currency code (default: ``usd``).
        service: CoinService instance injected by FastAPI.

    Returns:
        JSON object with ``prices``, ``market_caps``, and ``total_volumes`` arrays.

    Raises:
        HTTPException 400: If coin_id or days fail domain validation.
        HTTPException 502: If the upstream CoinGecko request fails.
    """
    try:
        return await service.get_coin_chart(coin_id, days, vs_currency)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
