"""
Moteur de génération de signaux par confluence multi-timeframe
Score 0-100 calculé pour chaque paire sur chaque timeframe
Trade seulement si score >= 70 (4+ signaux alignés)
"""
import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
from loguru import logger

from .indicators import TechnicalIndicators, IndicatorResult


@dataclass
class TradeSignal:
    pair: str
    direction: str              # BUY / SELL
    confluence_score: float     # 0-100
    timeframe_scores: Dict[str, float]  # score per TF

    # Boolean signals
    signals: Dict[str, bool]

    # Prices
    entry_price: float
    stop_loss: float
    take_profit: float
    atr: float

    # S/R
    nearest_support: float
    nearest_resistance: float

    # Meta
    timestamp: datetime
    signal_strength: str        # WEAK / MODERATE / STRONG / VERY_STRONG
    recommended_lot_size: float = 0.01


class SignalEngine:
    """Moteur de confluence multi-timeframe."""

    # Timeframe weights  (D > H4 > H1 > M15)
    TF_WEIGHTS: Dict[str, float] = {
        "D": 0.40,
        "H4": 0.30,
        "H1": 0.20,
        "M15": 0.10,
    }

    # Individual signal weights (sum = 120, normalised to 100)
    SIGNAL_WEIGHTS: Dict[str, int] = {
        "ema_trend_aligned": 20,
        "ema_cross_recent": 10,
        "rsi_zone": 15,
        "rsi_divergence": 10,
        "macd_cross": 15,
        "macd_momentum": 5,
        "bb_signal": 10,
        "stoch_zone": 8,
        "stoch_cross": 7,
        "sr_proximity": 10,
        "volume_confirmation": 5,
        "candlestick_pattern": 5,
    }
    _SIGNAL_TOTAL = sum(SIGNAL_WEIGHTS.values())  # 120

    MIN_CONFLUENCE_SCORE = 70
    MIN_RISK_REWARD = 2.5

    def __init__(self, market_data_service, indicator_service: TechnicalIndicators):
        self.market_data = market_data_service
        self.indicators = indicator_service
        self.active_signals: Dict[str, TradeSignal] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    async def analyze_all_pairs(self) -> Dict[str, TradeSignal]:
        """Analyse toutes les paires et retourne les signaux actifs."""
        tasks = [self.analyze_pair(pair) for pair in self.market_data.PAIRS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        signals: Dict[str, TradeSignal] = {}
        for pair, result in zip(self.market_data.PAIRS, results):
            if isinstance(result, Exception):
                logger.warning(f"Analysis failed for {pair}: {result}")
                continue
            if result is not None and result.confluence_score >= self.MIN_CONFLUENCE_SCORE:
                signals[pair] = result

        self.active_signals = signals
        return signals

    async def analyze_pair(self, pair: str) -> Optional[TradeSignal]:
        """Analyse multi-timeframe d'une paire."""
        tf_indicators: Dict[str, IndicatorResult] = {}

        # Fetch and compute indicators for each timeframe
        for tf in self.TF_WEIGHTS:
            try:
                df = await self.market_data.get_ohlcv(pair, tf, bars=500)
                if df is None or len(df) < 50:
                    continue
                result = self.indicators.calculate_all(df)
                tf_indicators[tf] = result
            except Exception as exc:
                logger.debug(f"Indicator calc failed {pair}/{tf}: {exc}")

        if not tf_indicators:
            return None

        # Determine dominant direction by majority vote (weighted by TF)
        bull_weight = 0.0
        bear_weight = 0.0
        for tf, ind in tf_indicators.items():
            w = self.TF_WEIGHTS.get(tf, 0.1)
            if ind.ema_trend == "BULLISH":
                bull_weight += w
            elif ind.ema_trend == "BEARISH":
                bear_weight += w

        if bull_weight == bear_weight:
            return None  # No clear direction

        direction = "BUY" if bull_weight > bear_weight else "SELL"

        # Calculate weighted confluence score
        tf_scores: Dict[str, float] = {}
        total_weighted_score = 0.0
        total_weight = 0.0

        for tf, ind in tf_indicators.items():
            tf_weight = self.TF_WEIGHTS.get(tf, 0.1)
            tf_score, _ = self.calculate_confluence_score(direction, ind)
            tf_scores[tf] = tf_score
            total_weighted_score += tf_score * tf_weight
            total_weight += tf_weight

        overall_score = total_weighted_score / total_weight if total_weight > 0 else 0.0

        if overall_score < self.MIN_CONFLUENCE_SCORE:
            return None

        # Use the most-weighted available TF for entry calculation
        primary_tf = next(
            (tf for tf in ("D", "H4", "H1", "M15") if tf in tf_indicators), None
        )
        if primary_tf is None:
            return None

        primary_ind = tf_indicators[primary_tf]

        # Collect signals from primary TF for the signal dict
        _, signal_booleans = self.calculate_confluence_score(direction, primary_ind)

        # Current price
        prices = await self.market_data.get_all_current_prices()
        price_info = prices.get(pair, {})
        if not price_info:
            return None

        mid_price = (price_info.get("bid", 0) + price_info.get("ask", 0)) / 2
        if mid_price <= 0:
            return None

        entry, stop_loss, take_profit = self.calculate_entry_sl_tp(
            pair=pair,
            direction=direction,
            current_price=mid_price,
            atr=primary_ind.atr,
            support=primary_ind.nearest_support,
            resistance=primary_ind.nearest_resistance,
        )

        strength = self._score_to_strength(overall_score)

        return TradeSignal(
            pair=pair,
            direction=direction,
            confluence_score=round(overall_score, 2),
            timeframe_scores={k: round(v, 2) for k, v in tf_scores.items()},
            signals=signal_booleans,
            entry_price=entry,
            stop_loss=stop_loss,
            take_profit=take_profit,
            atr=primary_ind.atr,
            nearest_support=primary_ind.nearest_support,
            nearest_resistance=primary_ind.nearest_resistance,
            timestamp=datetime.now(timezone.utc),
            signal_strength=strength,
        )

    # ------------------------------------------------------------------
    # Confluence calculation
    # ------------------------------------------------------------------
    def calculate_confluence_score(
        self, direction: str, ind: IndicatorResult
    ) -> Tuple[float, Dict[str, bool]]:
        """
        Returns (score_0_to_100, dict_of_signal_booleans).
        """
        is_buy = direction == "BUY"
        signals: Dict[str, bool] = {}
        raw_score = 0

        # 1. EMA trend aligned
        if is_buy:
            signals["ema_trend_aligned"] = ind.ema_trend == "BULLISH" and ind.ema_aligned
        else:
            signals["ema_trend_aligned"] = ind.ema_trend == "BEARISH" and ind.ema_aligned
        if signals["ema_trend_aligned"]:
            raw_score += self.SIGNAL_WEIGHTS["ema_trend_aligned"]

        # 2. EMA cross recent (within last 3 bars is represented by ema_trend alone
        #    since we don't expose a specific cross flag — we use EMA spread as proxy)
        if is_buy:
            signals["ema_cross_recent"] = (
                ind.ema8 > ind.ema21 and abs(ind.ema8 - ind.ema21) / ind.ema21 < 0.003
            )
        else:
            signals["ema_cross_recent"] = (
                ind.ema8 < ind.ema21 and abs(ind.ema8 - ind.ema21) / ind.ema21 < 0.003
            )
        if signals["ema_cross_recent"]:
            raw_score += self.SIGNAL_WEIGHTS["ema_cross_recent"]

        # 3. RSI zone
        if is_buy:
            signals["rsi_zone"] = ind.rsi_signal == "OVERSOLD" or (30 < ind.rsi < 55)
        else:
            signals["rsi_zone"] = ind.rsi_signal == "OVERBOUGHT" or (45 < ind.rsi < 70)
        if signals["rsi_zone"]:
            raw_score += self.SIGNAL_WEIGHTS["rsi_zone"]

        # 4. RSI divergence
        if is_buy:
            signals["rsi_divergence"] = ind.rsi_divergence == "BULLISH"
        else:
            signals["rsi_divergence"] = ind.rsi_divergence == "BEARISH"
        if signals["rsi_divergence"]:
            raw_score += self.SIGNAL_WEIGHTS["rsi_divergence"]

        # 5. MACD cross
        if is_buy:
            signals["macd_cross"] = ind.macd_cross == "GOLDEN"
        else:
            signals["macd_cross"] = ind.macd_cross == "DEATH"
        if signals["macd_cross"]:
            raw_score += self.SIGNAL_WEIGHTS["macd_cross"]

        # 6. MACD momentum (histogram direction)
        if is_buy:
            signals["macd_momentum"] = ind.macd_hist > 0
        else:
            signals["macd_momentum"] = ind.macd_hist < 0
        if signals["macd_momentum"]:
            raw_score += self.SIGNAL_WEIGHTS["macd_momentum"]

        # 7. BB signal
        if is_buy:
            signals["bb_signal"] = ind.bb_position in ("NEAR_LOWER", "BELOW_LOWER")
        else:
            signals["bb_signal"] = ind.bb_position in ("NEAR_UPPER", "ABOVE_UPPER")
        if signals["bb_signal"]:
            raw_score += self.SIGNAL_WEIGHTS["bb_signal"]

        # 8. Stochastic zone
        if is_buy:
            signals["stoch_zone"] = ind.stoch_signal == "OVERSOLD" or ind.stoch_k < 40
        else:
            signals["stoch_zone"] = ind.stoch_signal == "OVERBOUGHT" or ind.stoch_k > 60
        if signals["stoch_zone"]:
            raw_score += self.SIGNAL_WEIGHTS["stoch_zone"]

        # 9. Stochastic cross
        if is_buy:
            signals["stoch_cross"] = ind.stoch_cross == "BULLISH"
        else:
            signals["stoch_cross"] = ind.stoch_cross == "BEARISH"
        if signals["stoch_cross"]:
            raw_score += self.SIGNAL_WEIGHTS["stoch_cross"]

        # 10. S/R proximity
        price = ind.current_price
        sr_zone = ind.atr * 0.5 if ind.atr > 0 else price * 0.002
        if is_buy:
            signals["sr_proximity"] = abs(price - ind.nearest_support) < sr_zone
        else:
            signals["sr_proximity"] = abs(price - ind.nearest_resistance) < sr_zone
        if signals["sr_proximity"]:
            raw_score += self.SIGNAL_WEIGHTS["sr_proximity"]

        # 11. Volume confirmation (above average — proxy: atr_pct > 0.05%)
        signals["volume_confirmation"] = ind.atr_pct > 0.05
        if signals["volume_confirmation"]:
            raw_score += self.SIGNAL_WEIGHTS["volume_confirmation"]

        # 12. Candlestick patterns
        bullish_patterns = {"HAMMER", "BULLISH_ENGULFING", "BULLISH_PIN_BAR"}
        bearish_patterns = {"SHOOTING_STAR", "BEARISH_ENGULFING", "BEARISH_PIN_BAR"}
        current_patterns = set(ind.candlestick_patterns)
        if is_buy:
            signals["candlestick_pattern"] = bool(current_patterns & bullish_patterns)
        else:
            signals["candlestick_pattern"] = bool(current_patterns & bearish_patterns)
        if signals["candlestick_pattern"]:
            raw_score += self.SIGNAL_WEIGHTS["candlestick_pattern"]

        # Normalise to 0-100
        score = (raw_score / self._SIGNAL_TOTAL) * 100.0
        return score, signals

    # ------------------------------------------------------------------
    # Entry / SL / TP
    # ------------------------------------------------------------------
    def calculate_entry_sl_tp(
        self,
        pair: str,
        direction: str,
        current_price: float,
        atr: float,
        support: float,
        resistance: float,
    ) -> Tuple[float, float, float]:
        pip_size = 0.01 if "JPY" in pair else 0.0001
        atr_sl_mult = 1.5
        atr_sr_buffer = 0.3

        if direction == "BUY":
            entry = current_price
            sl_atr = entry - atr * atr_sl_mult
            sl_sr = support - atr * atr_sr_buffer
            stop_loss = max(sl_atr, sl_sr)

            if stop_loss >= entry:
                stop_loss = entry - atr * atr_sl_mult

            risk_pips = (entry - stop_loss) / pip_size
            tp_atr = entry + risk_pips * self.MIN_RISK_REWARD * pip_size
            tp_sr = resistance - atr * atr_sr_buffer
            take_profit = min(tp_atr, tp_sr) if tp_sr > entry else tp_atr

            # Ensure minimum R:R
            actual_rr = (take_profit - entry) / max(entry - stop_loss, 1e-10)
            if actual_rr < self.MIN_RISK_REWARD:
                take_profit = entry + (entry - stop_loss) * self.MIN_RISK_REWARD

        else:  # SELL
            entry = current_price
            sl_atr = entry + atr * atr_sl_mult
            sl_sr = resistance + atr * atr_sr_buffer
            stop_loss = min(sl_atr, sl_sr)

            if stop_loss <= entry:
                stop_loss = entry + atr * atr_sl_mult

            risk_pips = (stop_loss - entry) / pip_size
            tp_atr = entry - risk_pips * self.MIN_RISK_REWARD * pip_size
            tp_sr = support + atr * atr_sr_buffer
            take_profit = max(tp_atr, tp_sr) if tp_sr < entry else tp_atr

            # Ensure minimum R:R
            actual_rr = (entry - take_profit) / max(stop_loss - entry, 1e-10)
            if actual_rr < self.MIN_RISK_REWARD:
                take_profit = entry - (stop_loss - entry) * self.MIN_RISK_REWARD

        return entry, stop_loss, take_profit

    # ------------------------------------------------------------------
    # Currency strength matrix
    # ------------------------------------------------------------------
    def get_currency_strength_matrix(self) -> Dict[str, float]:
        """
        Calcule la force relative de chaque devise.
        Retourne {currency: strength -100 to +100}.
        """
        currencies = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD"]
        strength: Dict[str, float] = {c: 0.0 for c in currencies}
        count: Dict[str, int] = {c: 0 for c in currencies}

        for pair, signal in self.active_signals.items():
            parts = pair.split("_")
            if len(parts) != 2:
                continue
            base, quote = parts
            if base not in strength or quote not in strength:
                continue

            score_norm = signal.confluence_score  # 0-100

            if signal.direction == "BUY":
                strength[base] += score_norm
                strength[quote] -= score_norm
            else:
                strength[base] -= score_norm
                strength[quote] += score_norm

            count[base] += 1
            count[quote] += 1

        # Average and clamp to [-100, 100]
        for c in currencies:
            if count[c] > 0:
                strength[c] = max(-100.0, min(100.0, strength[c] / count[c]))

        return strength

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    @staticmethod
    def _score_to_strength(score: float) -> str:
        if score >= 90:
            return "VERY_STRONG"
        if score >= 80:
            return "STRONG"
        if score >= 70:
            return "MODERATE"
        return "WEAK"
