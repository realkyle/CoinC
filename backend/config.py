"""Application configuration module.

Reads environment variables once at import time and exposes a typed,
immutable Settings object. Centralising config here means no module
other than this one ever calls os.getenv() — satisfying DIP by giving
higher-level modules a stable abstraction to depend on rather than the
raw os.environ dict.
"""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Immutable application settings sourced from environment variables.

    Frozen=True ensures settings cannot be mutated after construction,
    making configuration predictable and safe to share across async tasks.

    Attributes:
        coingecko_api_key: Demo API key for CoinGecko authentication.
        coingecko_base_url: Root URL for all CoinGecko v3 API requests.
        tracked_coin_ids: Ordered tuple of CoinGecko coin IDs to track.
        request_timeout_seconds: HTTP timeout applied to every outbound request.
    """

    coingecko_api_key: str = field(
        default_factory=lambda: os.getenv("COINGECKO_API_KEY", "")
    )
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    tracked_coin_ids: tuple = field(
        default_factory=lambda: (
            "bitcoin",
            "ethereum",
            "solana",
            "cardano",
            "ripple",
            "dogecoin",
            "polkadot",
            "chainlink",
        )
    )
    request_timeout_seconds: int = 10


# Module-level singleton — constructed once on import, reused everywhere.
settings = Settings()
