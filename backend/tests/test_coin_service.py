"""Unit tests for CoinService.

Tests focus on the business-logic layer in isolation. CoinGeckoClient is
replaced with a mock so no network calls are made — unit tests must be
fast and deterministic regardless of external service availability.

Test structure follows the Arrange-Act-Assert pattern with one logical
assertion per test so failures are self-explanatory.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from coin_service import CoinService
from config import Settings


# ---------------------------------------------------------------------------
# Fixtures — shared test objects constructed once per test function.
# ---------------------------------------------------------------------------

@pytest.fixture
def test_settings() -> Settings:
    """Provide a Settings instance with a known, minimal coin list."""
    return Settings(
        coingecko_api_key="test-key",
        tracked_coin_ids=("bitcoin", "ethereum"),
    )


@pytest.fixture
def mock_client():
    """Provide a CoinGeckoClient mock that returns canned API responses.

    AsyncMock is used for coroutine methods so they can be awaited naturally
    in async test functions.
    """
    client = MagicMock()
    client.get_markets = AsyncMock(return_value=[
        {
            "id": "bitcoin",
            "current_price": 60_000,
            "price_change_percentage_24h": 1.5,
            "market_cap": 1_200_000_000_000,
        },
        {
            "id": "ethereum",
            "current_price": 2_000,
            "price_change_percentage_24h": -0.5,
            "market_cap": 240_000_000_000,
        },
    ])
    client.get_market_chart = AsyncMock(return_value={
        "prices": [
            [1_700_000_000_000, 60_000],
            [1_700_086_400_000, 61_000],
        ],
        "market_caps": [],
        "total_volumes": [],
    })
    return client


@pytest.fixture
def coin_service(mock_client, test_settings) -> CoinService:
    """Construct a fully wired CoinService backed by mocked dependencies."""
    return CoinService(mock_client, test_settings)


# ---------------------------------------------------------------------------
# Tests for CoinService.get_markets()
# ---------------------------------------------------------------------------

class TestGetMarkets:
    """Verifies that get_markets() correctly delegates to the HTTP client."""

    @pytest.mark.asyncio
    async def test_forwards_tracked_coins_to_client(self, coin_service, mock_client):
        """The service must pass its tracked coin tuple — not a hard-coded list."""
        await coin_service.get_markets()

        mock_client.get_markets.assert_called_once_with(("bitcoin", "ethereum"), "usd")

    @pytest.mark.asyncio
    async def test_returns_full_client_response(self, coin_service):
        """The service must not silently drop coins or fields from the response."""
        result = await coin_service.get_markets()

        assert len(result) == 2
        assert result[0]["id"] == "bitcoin"
        assert result[1]["id"] == "ethereum"

    @pytest.mark.asyncio
    async def test_forwards_custom_currency_to_client(self, coin_service, mock_client):
        """A non-default vs_currency must be passed through unchanged."""
        await coin_service.get_markets(vs_currency="eur")

        _coins, currency = mock_client.get_markets.call_args[0]
        assert currency == "eur"

    @pytest.mark.asyncio
    async def test_defaults_to_usd(self, coin_service, mock_client):
        """Omitting vs_currency must default to 'usd'."""
        await coin_service.get_markets()

        _coins, currency = mock_client.get_markets.call_args[0]
        assert currency == "usd"


# ---------------------------------------------------------------------------
# Tests for CoinService.get_coin_chart()
# ---------------------------------------------------------------------------

class TestGetCoinChart:
    """Verifies parameter validation and delegation in get_coin_chart()."""

    @pytest.mark.asyncio
    async def test_forwards_valid_params_to_client(self, coin_service, mock_client):
        """Valid inputs must reach the HTTP client unchanged."""
        await coin_service.get_coin_chart("bitcoin", days=7)

        mock_client.get_market_chart.assert_called_once_with("bitcoin", 7, "usd")

    @pytest.mark.asyncio
    async def test_returns_prices_key_in_response(self, coin_service):
        """The response must contain the 'prices' array expected by the frontend."""
        result = await coin_service.get_coin_chart("bitcoin", days=7)

        assert "prices" in result
        assert len(result["prices"]) == 2

    @pytest.mark.asyncio
    async def test_raises_for_empty_coin_id(self, coin_service):
        """An empty string coin_id must be rejected before the network is hit."""
        with pytest.raises(ValueError, match="coin_id"):
            await coin_service.get_coin_chart("", days=7)

    @pytest.mark.asyncio
    async def test_raises_for_non_string_coin_id(self, coin_service):
        """A non-string coin_id (e.g. None) must raise ValueError immediately."""
        with pytest.raises(ValueError, match="coin_id"):
            await coin_service.get_coin_chart(None, days=7)

    @pytest.mark.asyncio
    async def test_raises_for_days_below_minimum(self, coin_service):
        """days=0 must be rejected — the minimum allowed value is 1."""
        with pytest.raises(ValueError, match="days"):
            await coin_service.get_coin_chart("bitcoin", days=0)

    @pytest.mark.asyncio
    async def test_raises_for_days_above_maximum(self, coin_service):
        """days=366 must be rejected — the free-tier cap is 365."""
        with pytest.raises(ValueError, match="days"):
            await coin_service.get_coin_chart("bitcoin", days=366)

    @pytest.mark.asyncio
    async def test_accepts_minimum_boundary_value(self, coin_service):
        """days=1 is the lower boundary and must be accepted."""
        await coin_service.get_coin_chart("bitcoin", days=1)

    @pytest.mark.asyncio
    async def test_accepts_maximum_boundary_value(self, coin_service):
        """days=365 is the upper boundary and must be accepted."""
        await coin_service.get_coin_chart("bitcoin", days=365)

    @pytest.mark.asyncio
    async def test_forwards_custom_currency(self, coin_service, mock_client):
        """A non-default vs_currency must be forwarded to the client."""
        await coin_service.get_coin_chart("ethereum", days=30, vs_currency="gbp")

        mock_client.get_market_chart.assert_called_once_with("ethereum", 30, "gbp")
