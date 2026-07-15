import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.coingecko.com/api/v3"
API_KEY = os.getenv("COINGECKO_API_KEY")
HEADERS = {"x-cg-demo-api-key": API_KEY} if API_KEY else {}

COIN_IDS = [
    "bitcoin",
    "ethereum",
    "solana",
    "cardano",
    "ripple",
    "dogecoin",
    "polkadot",
    "chainlink",
]


async def get_markets(vs_currency: str = "usd") -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}/coins/markets",
            headers=HEADERS,
            params={
                "vs_currency": vs_currency,
                "ids": ",".join(COIN_IDS),
                "price_change_percentage": "24h",
                "order": "market_cap_desc",
                "per_page": len(COIN_IDS),
                "page": 1,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()


async def get_market_chart(coin_id: str, days: int = 7, vs_currency: str = "usd") -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}/coins/{coin_id}/market_chart",
            headers=HEADERS,
            params={
                "vs_currency": vs_currency,
                "days": days,
                "interval": "daily" if days >= 7 else "hourly",
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
