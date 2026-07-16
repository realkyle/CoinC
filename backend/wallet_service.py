"""Domain service for Ethereum wallet balance lookups.

Owns address validation and wei-to-ETH conversion. EtherscanClient is
composed in (not inherited) so the two can be tested and replaced independently
(SRP, composition over inheritance).
"""

from __future__ import annotations

import re

from etherscan_client import EtherscanClient


class WalletService:
    """Validates Ethereum addresses and fetches their ETH balance.

    This service is the single authoritative source of address validation rules
    and the wei → ETH conversion factor. Components upstream (route handlers)
    and downstream (EtherscanClient) are kept free of both concerns.

    Attributes:
        _ADDRESS_RE: Compiled regex that matches exactly a checksummed or
                     lowercase 42-character Ethereum address.
        _WEI_PER_ETH: Conversion divisor from wei to ether (10^18).
    """

    _ADDRESS_RE: re.Pattern = re.compile(r"^0x[0-9a-fA-F]{40}$")
    _WEI_PER_ETH: int = 10 ** 18

    def __init__(self, client: EtherscanClient) -> None:
        """Compose WalletService with an EtherscanClient.

        Args:
            client: Configured EtherscanClient used to make API calls.
        """
        self._client = client

    def _validate_address(self, address: str) -> None:
        """Raise ValueError if address is not a valid Ethereum address.

        Args:
            address: String to validate.

        Raises:
            ValueError: If address does not match ``0x[0-9a-fA-F]{40}``.
        """
        if not self._ADDRESS_RE.match(address):
            raise ValueError(
                f"Invalid Ethereum address '{address}'. "
                "Expected '0x' followed by 40 hexadecimal characters."
            )

    async def get_balance(self, address: str) -> dict:
        """Return the ETH balance for a wallet address.

        Validates the address, fetches the wei balance from Etherscan, and
        converts it to ETH before returning.

        Args:
            address: Ethereum wallet address to look up.

        Returns:
            Dict with keys:
                ``address`` (str): The queried address (as supplied).
                ``eth`` (float): Balance in ETH (wei / 10^18).

        Raises:
            ValueError: If address is invalid or Etherscan returns an error.
            httpx.HTTPStatusError: On HTTP-level transport errors.
        """
        self._validate_address(address)
        wei_str = await self._client.get_eth_balance(address)
        eth = int(wei_str) / self._WEI_PER_ETH
        return {"address": address, "eth": eth}
