"""HTTP client for the CoinGecko v3 REST API.

This module contains a single class, CoinGeckoClient, which is the sole
point of contact with the external CoinGecko service. All transport concerns
— base URL, authentication headers, timeouts, and HTTP error handling — are
encapsulated here so higher-level code never touches httpx directly (SRP).
"""

from __future__ import annotations

import httpx

from config import Settings


class CoinGeckoClient:
    """Async HTTP client that wraps the CoinGecko v3 REST API.

    Responsibilities (SRP):
        - Build authenticated, correctly parameterised HTTP requests.
        - Execute requests and surface raw API responses as Python objects.
        - Raise transport-level exceptions (timeouts, non-2xx status codes).

    Deliberately does NOT contain business logic such as which coins to
    track or how to transform responses — those responsibilities belong
    in CoinService (composition over inheritance, layered architecture).

    The Settings object is injected via the constructor (DIP), which means
    tests can supply a Settings instance with a fake API key and a mocked
    httpx layer without touching environment variables.
    """

    def __init__(self, settings: Settings) -> None:
        """Initialise the client from resolved application settings.

        Args:
            settings: Frozen Settings instance supplying the API key,
                      base URL, and request timeout.
        """
        self._base_url: str = settings.coingecko_base_url
        self._timeout: int = settings.request_timeout_seconds

        # Only attach the auth header when a key is present; the keyless
        # public API works without it but is subject to tighter rate limits.
        self._headers: dict[str, str] = (
            {"x-cg-demo-api-key": settings.coingecko_api_key}
            if settings.coingecko_api_key
            else {}
        )

    async def get_markets(
        self,
        coin_ids: tuple,
        vs_currency: str = "usd",
    ) -> list[dict]:
        """Fetch current market data for a set of coins in one request.

        Calls GET /coins/markets with the supplied coin IDs. Returns the
        complete CoinGecko response without transformation — shaping data
        for the application is the caller's responsibility.

        Args:
            coin_ids: Tuple of CoinGecko coin IDs (e.g. ``("bitcoin", "ethereum")``).
            vs_currency: ISO 4217 currency code for price denomination.

        Returns:
            Raw list of market-data dicts as returned by CoinGecko.

        Raises:
            httpx.HTTPStatusError: On 4xx / 5xx responses from CoinGecko.
            httpx.TimeoutException: If the request exceeds the configured timeout.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/coins/markets",
                headers=self._headers,
                params={
                    "vs_currency": vs_currency,
                    "ids": ",".join(coin_ids),
                    "price_change_percentage": "24h",
                    "order": "market_cap_desc",
                    "per_page": len(coin_ids),
                    "page": 1,
                },
                timeout=self._timeout,
            )
            response.raise_for_status()
            return response.json()

    async def get_market_chart(
        self,
        coin_id: str,
        days: int = 7,
        vs_currency: str = "usd",
    ) -> dict:
        """Fetch historical price, market-cap, and volume data for one coin.

        Calls GET /coins/{id}/market_chart. CoinGecko auto-selects granularity
        (daily for >= 7 days, hourly for shorter windows) unless overridden.

        Args:
            coin_id: CoinGecko ID of the target coin (e.g. ``"ethereum"``).
            days: Number of past days to retrieve (1–365 on the free tier).
            vs_currency: ISO 4217 currency code for value denomination.

        Returns:
            Dict with keys ``"prices"``, ``"market_caps"``, ``"total_volumes"``,
            each containing a list of ``[timestamp_ms, value]`` pairs.

        Raises:
            httpx.HTTPStatusError: On 4xx / 5xx responses from CoinGecko.
            httpx.TimeoutException: If the request exceeds the configured timeout.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/coins/{coin_id}/market_chart",
                headers=self._headers,
                params={
                    "vs_currency": vs_currency,
                    "days": days,
                    "interval": "daily" if days >= 7 else "hourly",
                },
                timeout=self._timeout,
            )
            response.raise_for_status()
            return response.json()
