"""Business-logic layer for coin market data.

CoinService sits between the FastAPI route handlers and the low-level HTTP
client. It owns domain decisions — which coins are tracked, what constitutes
a valid request, and what parameters are forwarded to the API.

Layered responsibilities:
    - Route handlers  → HTTP concerns (parsing, status codes, serialisation).
    - CoinService     → Domain concerns (valid coins, parameter rules).
    - CoinGeckoClient → Transport concerns (HTTP, auth, retries).

CoinService composes CoinGeckoClient rather than inheriting from it because
there is no "is-a" relationship; CoinService *uses* a client (composition
over inheritance). The client is injected via the constructor (DIP), keeping
this class testable without network access.
"""

from __future__ import annotations

from coingecko_client import CoinGeckoClient
from config import Settings

# Free-tier cap enforced by CoinGecko; guard here so the service layer
# rejects out-of-range values before they reach the network.
_MAX_CHART_DAYS = 365
_MIN_CHART_DAYS = 1


class CoinService:
    """Orchestrates coin market-data retrieval for the CoinPulse application.

    Acts as the single source of truth for which coins are tracked and what
    parameter constraints apply. Route handlers delegate all domain logic here.

    Attributes:
        _client: Injected HTTP client used for all CoinGecko calls.
        _tracked_coins: Immutable tuple of CoinGecko IDs this service tracks.
    """

    def __init__(self, client: CoinGeckoClient, settings: Settings) -> None:
        """Construct the service with its dependencies injected.

        Accepting both client and settings as parameters (rather than building
        them internally) makes unit tests straightforward: supply a mock client
        and a custom Settings instance without touching env vars or the network.

        Args:
            client: An initialised CoinGeckoClient instance.
            settings: Application settings that supply the tracked coin list.
        """
        self._client: CoinGeckoClient = client
        self._tracked_coins: tuple = settings.tracked_coin_ids

    async def get_markets(self, vs_currency: str = "usd") -> list[dict]:
        """Return live market data for all tracked coins.

        Delegates the network call to the client and passes the result through
        unchanged. Field filtering or sorting can be added here later without
        touching the client or the route handler (OCP).

        Args:
            vs_currency: ISO 4217 currency code to denominate prices in.

        Returns:
            List of market-data dicts, one per tracked coin.

        Raises:
            httpx.HTTPStatusError: Propagated from the transport layer.
            httpx.TimeoutException: Propagated from the transport layer.
        """
        return await self._client.get_markets(self._tracked_coins, vs_currency)

    async def get_coin_chart(
        self,
        coin_id: str,
        days: int = 7,
        vs_currency: str = "usd",
    ) -> dict:
        """Return historical price data for a single coin.

        Validates parameters at the service boundary before incurring any
        network cost — invalid inputs raise ValueError immediately.

        Args:
            coin_id: CoinGecko ID of the target coin (e.g. ``"bitcoin"``).
            days: Lookback window in days; must be between 1 and 365.
            vs_currency: ISO 4217 currency code to denominate values in.

        Returns:
            Dict with ``"prices"``, ``"market_caps"``, ``"total_volumes"`` arrays.

        Raises:
            ValueError: If ``coin_id`` is empty or ``days`` is out of range.
            httpx.HTTPStatusError: Propagated from the transport layer.
            httpx.TimeoutException: Propagated from the transport layer.
        """
        self._validate_coin_id(coin_id)
        self._validate_days(days)
        return await self._client.get_market_chart(coin_id, days, vs_currency)

    # ------------------------------------------------------------------
    # Private validation helpers — keep route handlers and the public API
    # free of guard clauses (SRP: validation is a single, localised concern).
    # ------------------------------------------------------------------

    def _validate_coin_id(self, coin_id: str) -> None:
        """Raise ValueError if coin_id is empty or not a string.

        Args:
            coin_id: The value to validate.

        Raises:
            ValueError: If coin_id is empty.
        """
        if not coin_id or not isinstance(coin_id, str):
            raise ValueError("coin_id must be a non-empty string.")

    def _validate_days(self, days: int) -> None:
        """Raise ValueError if days falls outside the permitted range.

        Args:
            days: The value to validate.

        Raises:
            ValueError: If days < 1 or days > 365.
        """
        if not (_MIN_CHART_DAYS <= days <= _MAX_CHART_DAYS):
            raise ValueError(
                f"days must be between {_MIN_CHART_DAYS} and {_MAX_CHART_DAYS}, got {days}."
            )
