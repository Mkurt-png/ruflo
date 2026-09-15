"""
Service de données de marché OANDA v20
Gère le streaming des prix et la récupération des données historiques
"""
import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Optional, AsyncGenerator, Callable
from datetime import datetime, timedelta, timezone
import pandas as pd
import numpy as np
from loguru import logger


class OANDAClient:
    BASE_URL_PRACTICE = "https://api-fxpractice.oanda.com"
    BASE_URL_LIVE = "https://api-fxtrade.oanda.com"
    STREAM_URL_PRACTICE = "https://stream-fxpractice.oanda.com"
    STREAM_URL_LIVE = "https://stream-fxtrade.oanda.com"

    PIP_VALUES = {
        "EUR_USD": 0.0001, "GBP_USD": 0.0001, "USD_JPY": 0.01,
        "AUD_USD": 0.0001, "USD_CAD": 0.0001, "EUR_GBP": 0.0001,
        "GBP_JPY": 0.01, "EUR_JPY": 0.01, "AUD_JPY": 0.01,
        "NZD_USD": 0.0001, "USD_CHF": 0.0001,
    }

    def __init__(self, api_key: str, account_id: str, environment: str = "practice"):
        self.api_key = api_key
        self.account_id = account_id
        self.environment = environment

        if environment == "practice":
            self.base_url = self.BASE_URL_PRACTICE
            self.stream_url = self.STREAM_URL_PRACTICE
        else:
            self.base_url = self.BASE_URL_LIVE
            self.stream_url = self.STREAM_URL_LIVE

        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept-Datetime-Format": "RFC3339",
        }
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            self._session = aiohttp.ClientSession(
                headers=self.headers, timeout=timeout
            )
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def _get(self, url: str, params: dict = None) -> dict:
        session = await self._get_session()
        async with session.get(url, params=params) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                raise RuntimeError(
                    f"OANDA API error {resp.status} on GET {url}: {text}"
                )
            return await resp.json()

    async def _post(self, url: str, payload: dict) -> dict:
        session = await self._get_session()
        async with session.post(url, json=payload) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                raise RuntimeError(
                    f"OANDA API error {resp.status} on POST {url}: {text}"
                )
            return await resp.json()

    async def _put(self, url: str, payload: dict = None) -> dict:
        session = await self._get_session()
        async with session.put(url, json=payload or {}) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                raise RuntimeError(
                    f"OANDA API error {resp.status} on PUT {url}: {text}"
                )
            return await resp.json()

    # ------------------------------------------------------------------
    # Account
    # ------------------------------------------------------------------
    async def get_account_summary(self) -> dict:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/summary"
        data = await self._get(url)
        acc = data.get("account", {})
        return {
            "balance": float(acc.get("balance", 0)),
            "equity": float(acc.get("NAV", 0)),
            "unrealized_pl": float(acc.get("unrealizedPL", 0)),
            "margin_used": float(acc.get("marginUsed", 0)),
            "margin_available": float(acc.get("marginAvailable", 0)),
            "open_trade_count": int(acc.get("openTradeCount", 0)),
            "open_position_count": int(acc.get("openPositionCount", 0)),
            "currency": acc.get("currency", "USD"),
        }

    # ------------------------------------------------------------------
    # Candles
    # ------------------------------------------------------------------
    async def get_candles(
        self,
        instrument: str,
        granularity: str,
        count: int = 500,
        from_time: str = None,
        to_time: str = None,
    ) -> pd.DataFrame:
        url = f"{self.base_url}/v3/instruments/{instrument}/candles"
        params: dict = {
            "granularity": granularity,
            "price": "M",  # mid prices
        }
        if from_time and to_time:
            params["from"] = from_time
            params["to"] = to_time
        elif from_time:
            params["from"] = from_time
            params["count"] = count
        else:
            params["count"] = count

        data = await self._get(url, params=params)
        candles = data.get("candles", [])

        rows = []
        for c in candles:
            if not c.get("complete", True):
                continue
            mid = c.get("mid", {})
            rows.append(
                {
                    "time": pd.to_datetime(c["time"]),
                    "open": float(mid.get("o", 0)),
                    "high": float(mid.get("h", 0)),
                    "low": float(mid.get("l", 0)),
                    "close": float(mid.get("c", 0)),
                    "volume": int(c.get("volume", 0)),
                }
            )

        if not rows:
            return pd.DataFrame(
                columns=["time", "open", "high", "low", "close", "volume"]
            )

        df = pd.DataFrame(rows)
        df.set_index("time", inplace=True)
        df.sort_index(inplace=True)
        return df

    # ------------------------------------------------------------------
    # Pricing
    # ------------------------------------------------------------------
    async def get_current_price(self, instruments: List[str]) -> Dict[str, dict]:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/pricing"
        params = {"instruments": ",".join(instruments)}
        data = await self._get(url, params=params)
        result: Dict[str, dict] = {}
        for price in data.get("prices", []):
            instrument = price.get("instrument", "")
            bids = price.get("bids", [{}])
            asks = price.get("asks", [{}])
            bid = float(bids[0].get("price", 0)) if bids else 0.0
            ask = float(asks[0].get("price", 0)) if asks else 0.0
            result[instrument] = {
                "bid": bid,
                "ask": ask,
                "spread": round(ask - bid, 6),
                "time": price.get("time", ""),
                "tradeable": price.get("tradeable", False),
            }
        return result

    # ------------------------------------------------------------------
    # Streaming
    # ------------------------------------------------------------------
    async def stream_prices(
        self, instruments: List[str]
    ) -> AsyncGenerator[dict, None]:
        url = f"{self.stream_url}/v3/accounts/{self.account_id}/pricing/stream"
        params = {"instruments": ",".join(instruments)}
        reconnect_delay = 1.0
        max_delay = 60.0

        while True:
            try:
                session = await self._get_session()
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        text = await resp.text()
                        logger.error(f"Stream error {resp.status}: {text}")
                        await asyncio.sleep(reconnect_delay)
                        reconnect_delay = min(reconnect_delay * 2, max_delay)
                        continue

                    reconnect_delay = 1.0
                    async for raw_line in resp.content:
                        line = raw_line.decode("utf-8").strip()
                        if not line:
                            continue
                        try:
                            msg = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        msg_type = msg.get("type", "")
                        if msg_type == "HEARTBEAT":
                            continue
                        if msg_type == "PRICE":
                            bids = msg.get("bids", [{}])
                            asks = msg.get("asks", [{}])
                            bid = float(bids[0].get("price", 0)) if bids else 0.0
                            ask = float(asks[0].get("price", 0)) if asks else 0.0
                            yield {
                                "type": "PRICE",
                                "instrument": msg.get("instrument", ""),
                                "bid": bid,
                                "ask": ask,
                                "tradeable": msg.get("tradeable", False),
                                "time": msg.get("time", ""),
                            }
            except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                logger.warning(
                    f"Stream disconnected ({exc}), reconnecting in {reconnect_delay}s..."
                )
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_delay)
            except asyncio.CancelledError:
                logger.info("Price stream cancelled.")
                break

    # ------------------------------------------------------------------
    # Trades
    # ------------------------------------------------------------------
    async def get_open_trades(self) -> List[dict]:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/openTrades"
        data = await self._get(url)
        trades = []
        for t in data.get("trades", []):
            trades.append(
                {
                    "id": t.get("id"),
                    "instrument": t.get("instrument"),
                    "price": float(t.get("price", 0)),
                    "units": int(t.get("currentUnits", 0)),
                    "unrealized_pl": float(t.get("unrealizedPL", 0)),
                    "open_time": t.get("openTime"),
                    "state": t.get("state"),
                    "stop_loss": float(
                        t.get("stopLossOrder", {}).get("price", 0) or 0
                    ),
                    "take_profit": float(
                        t.get("takeProfitOrder", {}).get("price", 0) or 0
                    ),
                }
            )
        return trades

    async def get_trade(self, trade_id: str) -> dict:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/trades/{trade_id}"
        data = await self._get(url)
        t = data.get("trade", {})
        return {
            "id": t.get("id"),
            "instrument": t.get("instrument"),
            "price": float(t.get("price", 0)),
            "units": int(t.get("currentUnits", 0)),
            "unrealized_pl": float(t.get("unrealizedPL", 0)),
            "realized_pl": float(t.get("realizedPL", 0)),
            "open_time": t.get("openTime"),
            "close_time": t.get("closeTime"),
            "state": t.get("state"),
            "stop_loss": float(t.get("stopLossOrder", {}).get("price", 0) or 0),
            "take_profit": float(t.get("takeProfitOrder", {}).get("price", 0) or 0),
        }

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------
    async def create_market_order(
        self,
        instrument: str,
        units: int,
        stop_loss: float,
        take_profit: float,
    ) -> dict:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/orders"
        pip = self.PIP_VALUES.get(instrument, 0.0001)
        decimals = 3 if pip == 0.01 else 5

        payload = {
            "order": {
                "type": "MARKET",
                "instrument": instrument,
                "units": str(units),
                "timeInForce": "FOK",
                "positionFill": "DEFAULT",
                "stopLossOnFill": {
                    "price": f"{stop_loss:.{decimals}f}",
                    "timeInForce": "GTC",
                },
                "takeProfitOnFill": {
                    "price": f"{take_profit:.{decimals}f}",
                    "timeInForce": "GTC",
                },
            }
        }
        data = await self._post(url, payload)
        fill = data.get("orderFillTransaction", {})
        return {
            "order_id": data.get("relatedTransactionIDs", [""])[0],
            "trade_id": fill.get("tradeOpened", {}).get("tradeID"),
            "instrument": fill.get("instrument"),
            "units": int(fill.get("units", units)),
            "price": float(fill.get("price", 0)),
            "time": fill.get("time"),
        }

    async def close_trade(self, trade_id: str) -> dict:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/trades/{trade_id}/close"
        data = await self._put(url, {"units": "ALL"})
        tc = data.get("orderFillTransaction", {})
        return {
            "trade_id": trade_id,
            "realized_pl": float(tc.get("pl", 0)),
            "price": float(tc.get("price", 0)),
            "time": tc.get("time"),
        }

    async def modify_trade(
        self,
        trade_id: str,
        stop_loss: float = None,
        take_profit: float = None,
    ) -> dict:
        url = (
            f"{self.base_url}/v3/accounts/{self.account_id}"
            f"/trades/{trade_id}/orders"
        )
        payload: dict = {}
        if stop_loss is not None:
            payload["stopLoss"] = {"price": f"{stop_loss:.5f}", "timeInForce": "GTC"}
        if take_profit is not None:
            payload["takeProfit"] = {
                "price": f"{take_profit:.5f}",
                "timeInForce": "GTC",
            }
        data = await self._put(url, payload)
        return {
            "trade_id": trade_id,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "related_ids": data.get("relatedTransactionIDs", []),
        }

    # ------------------------------------------------------------------
    # Transactions
    # ------------------------------------------------------------------
    async def get_transactions(self, from_time: str, to_time: str) -> List[dict]:
        url = f"{self.base_url}/v3/accounts/{self.account_id}/transactions"
        params = {"from": from_time, "to": to_time}
        data = await self._get(url, params=params)
        pages = data.get("pages", [])
        transactions = []
        for page_url in pages:
            page_data = await self._get(page_url)
            for tx in page_data.get("transactions", []):
                transactions.append(tx)
        return transactions

    # ------------------------------------------------------------------
    # Position sizing
    # ------------------------------------------------------------------
    async def calculate_position_size(
        self, instrument: str, risk_amount: float, stop_loss_pips: float
    ) -> int:
        pip = self.PIP_VALUES.get(instrument, 0.0001)
        prices = await self.get_current_price([instrument])
        price_info = prices.get(instrument, {})
        ask = price_info.get("ask", 1.0)

        base_currency, quote_currency = instrument.split("_")

        # Pip value per unit in quote currency
        pip_value_per_unit = pip  # for non-JPY pairs this holds in quote currency

        if quote_currency == "USD":
            pip_value_usd = pip_value_per_unit
        elif base_currency == "USD":
            pip_value_usd = pip_value_per_unit / ask
        else:
            # Try to get USD conversion rate
            try:
                conv_pair = f"{quote_currency}_USD"
                conv_prices = await self.get_current_price([conv_pair])
                conv_rate = conv_prices.get(conv_pair, {}).get("ask", 1.0)
                pip_value_usd = pip_value_per_unit * conv_rate
            except Exception:
                pip_value_usd = pip_value_per_unit

        if stop_loss_pips <= 0 or pip_value_usd <= 0:
            return 0

        units = int(risk_amount / (stop_loss_pips * pip_value_usd))
        return units


# ---------------------------------------------------------------------------
# MarketDataService
# ---------------------------------------------------------------------------
class MarketDataService:
    """Service principal de données de marché avec cache"""

    PAIRS = [
        "EUR_USD", "GBP_USD", "USD_JPY", "AUD_USD",
        "USD_CAD", "EUR_GBP", "GBP_JPY",
    ]
    TIMEFRAMES = {"M15": "M15", "H1": "H1", "H4": "H4", "D": "D"}

    # Cache TTL in seconds per timeframe
    CACHE_TTL = {"M15": 60, "H1": 120, "H4": 300, "D": 600}

    def __init__(self, client: OANDAClient):
        self.client = client
        self.price_cache: Dict[str, dict] = {}
        self.candle_cache: Dict[str, Dict[str, pd.DataFrame]] = {}
        self.candle_cache_ts: Dict[str, Dict[str, float]] = {}
        self._streaming = False
        self._stream_task: Optional[asyncio.Task] = None
        self._callbacks: List[Callable] = []

    # ------------------------------------------------------------------
    # Streaming
    # ------------------------------------------------------------------
    async def start_streaming(self):
        if self._streaming:
            return
        self._streaming = True
        self._stream_task = asyncio.create_task(self._stream_loop())
        logger.info("Price streaming started.")

    async def _stream_loop(self):
        async for price_update in self.client.stream_prices(self.PAIRS):
            if not self._streaming:
                break
            instrument = price_update.get("instrument", "")
            self.price_cache[instrument] = price_update
            for cb in self._callbacks:
                try:
                    if asyncio.iscoroutinefunction(cb):
                        await cb(price_update)
                    else:
                        cb(price_update)
                except Exception as exc:
                    logger.error(f"Callback error: {exc}")

    async def stop_streaming(self):
        self._streaming = False
        if self._stream_task and not self._stream_task.done():
            self._stream_task.cancel()
            try:
                await self._stream_task
            except asyncio.CancelledError:
                pass
        logger.info("Price streaming stopped.")

    def register_callback(self, callback: Callable):
        self._callbacks.append(callback)

    # ------------------------------------------------------------------
    # OHLCV data
    # ------------------------------------------------------------------
    async def get_ohlcv(
        self, pair: str, timeframe: str, bars: int = 500
    ) -> pd.DataFrame:
        ttl = self.CACHE_TTL.get(timeframe, 60)
        pair_ts = self.candle_cache_ts.get(pair, {})
        last_refresh = pair_ts.get(timeframe, 0.0)

        if (
            pair in self.candle_cache
            and timeframe in self.candle_cache[pair]
            and (time.time() - last_refresh) < ttl
        ):
            return self.candle_cache[pair][timeframe]

        df = await self.client.get_candles(pair, timeframe, count=bars)

        if pair not in self.candle_cache:
            self.candle_cache[pair] = {}
        if pair not in self.candle_cache_ts:
            self.candle_cache_ts[pair] = {}

        self.candle_cache[pair][timeframe] = df
        self.candle_cache_ts[pair][timeframe] = time.time()
        return df

    async def refresh_all_candles(self):
        tasks = []
        for pair in self.PAIRS:
            for tf in self.TIMEFRAMES.keys():
                tasks.append(self._refresh_candles(pair, tf))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        errors = [r for r in results if isinstance(r, Exception)]
        if errors:
            logger.warning(f"{len(errors)} errors during bulk candle refresh.")
        logger.info("All candles refreshed.")

    async def _refresh_candles(self, pair: str, timeframe: str):
        df = await self.client.get_candles(pair, timeframe, count=500)
        if pair not in self.candle_cache:
            self.candle_cache[pair] = {}
        if pair not in self.candle_cache_ts:
            self.candle_cache_ts[pair] = {}
        self.candle_cache[pair][timeframe] = df
        self.candle_cache_ts[pair][timeframe] = time.time()

    # ------------------------------------------------------------------
    # Prices
    # ------------------------------------------------------------------
    async def get_all_current_prices(self) -> Dict[str, dict]:
        if self.price_cache:
            return dict(self.price_cache)
        try:
            prices = await self.client.get_current_price(self.PAIRS)
            self.price_cache.update(prices)
            return prices
        except Exception as exc:
            logger.error(f"Failed to get prices: {exc}")
            return {}
