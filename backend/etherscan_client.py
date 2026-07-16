"""HTTP client for the Etherscan v1 REST API.

Encapsulates all transport concerns for Etherscan — base URL, API key,
timeouts, and translating non-"1" status codes into Python exceptions.
Higher-level code (WalletService) never touches httpx directly (SRP).
"""

from __future__ import annotations

import httpx

from config import Settings


class EtherscanClient:
    """Async HTTP client that wraps the Etherscan v1 API.

    Responsibilities (SRP):
        - Build authenticated HTTP requests to Etherscan.
        - Execute requests and surface raw results as Python objects.
        - Translate Etherscan error responses (status != "1") into exceptions.

    The Settings object is injected via the constructor (DIP) so tests can
    supply fake credentials and a mocked HTTP layer without touching the
    environment.
    """

    def __init__(self, settings: Settings) -> None:
        """Initialise the client from resolved application settings.

        Args:
            settings: Frozen Settings instance supplying the Etherscan
                      API key, base URL, and request timeout.
        """
        self._base_url: str = settings.etherscan_base_url
        self._api_key: str = settings.etherscan_api_key
        self._timeout: int = settings.request_timeout_seconds

    async def get_eth_balance(self, address: str) -> str:
        """Return the ETH balance of an address in wei (as a string).

        Calls the Etherscan ``account/balance`` action. Wei is returned as
        a string because the value can exceed Python's float precision for
        very large wallets; callers are responsible for converting to ETH.

        Args:
            address: A valid Ethereum address (``0x`` + 40 hex chars).

        Returns:
            The balance in wei, e.g. ``"1234567890000000000"``.

        Raises:
            ValueError: If Etherscan returns a non-"1" status (bad key,
                        invalid address, rate limit hit, etc.).
            httpx.HTTPStatusError: On HTTP-level 4xx / 5xx responses.
            httpx.TimeoutException: If the request exceeds the configured timeout.
        """
        params = {
            "module": "account",
            "action": "balance",
            "address": address,
            "tag": "latest",
            "apikey": self._api_key,
        }
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(self._base_url, params=params)
            response.raise_for_status()
            data = response.json()

        if data.get("status") != "1":
            msg = data.get("message") or data.get("result") or "Etherscan error"
            raise ValueError(msg)

        return data["result"]
