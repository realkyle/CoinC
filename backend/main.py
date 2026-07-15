from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from coingecko_client import get_markets, get_market_chart

app = FastAPI(title="CoinPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/markets")
async def markets(vs_currency: str = Query(default="usd")):
    try:
        return await get_markets(vs_currency)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/coins/{coin_id}/chart")
async def coin_chart(
    coin_id: str,
    days: int = Query(default=7, ge=1, le=365),
    vs_currency: str = Query(default="usd"),
):
    try:
        return await get_market_chart(coin_id, days, vs_currency)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
