"""Unit tests for WalletService.

All Etherscan network calls are replaced with AsyncMock so tests are
fast and deterministic. Only the public interface of WalletService is
tested — internal method names and implementation details are not.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from wallet_service import WalletService


def _make_service(wei_result=None, side_effect=None):
    """Return a WalletService wired to a mocked EtherscanClient."""
    client = MagicMock()
    if side_effect:
        client.get_eth_balance = AsyncMock(side_effect=side_effect)
    else:
        client.get_eth_balance = AsyncMock(return_value=wei_result)
    return WalletService(client)


# ---------------------------------------------------------------------------
# Address validation
# ---------------------------------------------------------------------------

class TestValidateAddress:
    @pytest.mark.asyncio
    async def test_valid_lowercase_address(self):
        svc = _make_service(wei_result="1000000000000000000")
        result = await svc.get_balance("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        assert result["address"] == "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"

    @pytest.mark.asyncio
    async def test_valid_checksummed_address(self):
        svc = _make_service(wei_result="0")
        result = await svc.get_balance("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        assert "eth" in result

    @pytest.mark.asyncio
    async def test_missing_0x_prefix_raises(self):
        svc = _make_service(wei_result="0")
        with pytest.raises(ValueError, match="Invalid Ethereum address"):
            await svc.get_balance("d8da6bf26964af9d7eed9e03e53415d37aa96045")

    @pytest.mark.asyncio
    async def test_address_too_short_raises(self):
        svc = _make_service(wei_result="0")
        with pytest.raises(ValueError, match="Invalid Ethereum address"):
            await svc.get_balance("0xabc123")

    @pytest.mark.asyncio
    async def test_non_hex_chars_raise(self):
        svc = _make_service(wei_result="0")
        with pytest.raises(ValueError, match="Invalid Ethereum address"):
            await svc.get_balance("0x" + "g" * 40)

    @pytest.mark.asyncio
    async def test_empty_string_raises(self):
        svc = _make_service(wei_result="0")
        with pytest.raises(ValueError, match="Invalid Ethereum address"):
            await svc.get_balance("")


# ---------------------------------------------------------------------------
# Balance retrieval and conversion
# ---------------------------------------------------------------------------

class TestGetBalance:
    @pytest.mark.asyncio
    async def test_one_eth_converts_correctly(self):
        svc = _make_service(wei_result="1000000000000000000")
        result = await svc.get_balance("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        assert result["eth"] == pytest.approx(1.0)

    @pytest.mark.asyncio
    async def test_zero_balance(self):
        svc = _make_service(wei_result="0")
        result = await svc.get_balance("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        assert result["eth"] == 0.0

    @pytest.mark.asyncio
    async def test_fractional_eth(self):
        svc = _make_service(wei_result="500000000000000000")  # 0.5 ETH
        result = await svc.get_balance("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        assert result["eth"] == pytest.approx(0.5)

    @pytest.mark.asyncio
    async def test_client_error_propagates(self):
        svc = _make_service(side_effect=ValueError("Invalid API Key"))
        with pytest.raises(ValueError, match="Invalid API Key"):
            await svc.get_balance("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")

    @pytest.mark.asyncio
    async def test_response_includes_address(self):
        addr = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
        svc = _make_service(wei_result="2000000000000000000")
        result = await svc.get_balance(addr)
        assert result["address"] == addr
