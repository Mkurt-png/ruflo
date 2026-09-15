"""
Moteur de calcul des indicateurs techniques
Utilise pandas-ta et numpy pour des calculs vectorisés rapides
"""
import pandas as pd
import numpy as np
import pandas_ta as ta
from dataclasses import dataclass, field
from typing import Optional, Tuple, List


@dataclass
class IndicatorResult:
    # EMA values
    ema8: float
    ema21: float
    ema55: float
    ema200: float
    ema_trend: str          # BULLISH / BEARISH / RANGING
    ema_aligned: bool       # True if fully aligned

    # RSI
    rsi: float
    rsi_signal: str         # OVERBOUGHT / OVERSOLD / NEUTRAL
    rsi_divergence: Optional[str]  # BULLISH / BEARISH / None

    # MACD
    macd: float
    macd_signal: float
    macd_hist: float
    macd_cross: Optional[str]   # GOLDEN / DEATH / None
    macd_above_zero: bool

    # Bollinger Bands
    bb_upper: float
    bb_middle: float
    bb_lower: float
    bb_width: float
    bb_position: str   # ABOVE_UPPER / NEAR_UPPER / MIDDLE / NEAR_LOWER / BELOW_LOWER
    bb_squeeze: bool

    # Stochastique
    stoch_k: float
    stoch_d: float
    stoch_signal: str       # OVERBOUGHT / OVERSOLD / NEUTRAL
    stoch_cross: Optional[str]  # BULLISH / BEARISH / None

    # ATR
    atr: float
    atr_pct: float

    # Support / Résistance
    support_levels: List[float]
    resistance_levels: List[float]
    nearest_support: float
    nearest_resistance: float

    # Volume Profile
    poc: Optional[float]
    value_area_high: Optional[float]
    value_area_low: Optional[float]

    # Prix actuel
    current_price: float

    # Patterns de bougies
    candlestick_patterns: List[str] = field(default_factory=list)


class TechnicalIndicators:
    def __init__(self):
        self.sr_lookback = 100

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------
    def calculate_all(self, df: pd.DataFrame) -> IndicatorResult:
        """Calcule tous les indicateurs sur le DataFrame OHLCV."""
        if df is None or len(df) < 30:
            raise ValueError("DataFrame too short — need at least 30 bars.")

        df = df.copy()
        # Ensure float columns
        for col in ("open", "high", "low", "close", "volume"):
            if col in df.columns:
                df[col] = df[col].astype(float)

        current_price = float(df["close"].iloc[-1])

        ema_data = self.calculate_ema_indicators(df)
        rsi_data = self.calculate_rsi(df)
        macd_data = self.calculate_macd(df)
        bb_data = self.calculate_bollinger(df)
        stoch_data = self.calculate_stochastic(df)
        atr_data = self.calculate_atr(df)
        sr_data = self.detect_support_resistance(df, lookback=self.sr_lookback)
        vp_data = self.calculate_volume_profile(df)
        patterns = self.detect_candlestick_patterns(df)

        return IndicatorResult(
            # EMA
            ema8=ema_data["ema8"],
            ema21=ema_data["ema21"],
            ema55=ema_data["ema55"],
            ema200=ema_data["ema200"],
            ema_trend=ema_data["trend"],
            ema_aligned=ema_data["aligned"],
            # RSI
            rsi=rsi_data["rsi"],
            rsi_signal=rsi_data["signal"],
            rsi_divergence=rsi_data["divergence"],
            # MACD
            macd=macd_data["macd"],
            macd_signal=macd_data["signal"],
            macd_hist=macd_data["hist"],
            macd_cross=macd_data["cross"],
            macd_above_zero=macd_data["above_zero"],
            # Bollinger Bands
            bb_upper=bb_data["upper"],
            bb_middle=bb_data["middle"],
            bb_lower=bb_data["lower"],
            bb_width=bb_data["width"],
            bb_position=bb_data["position"],
            bb_squeeze=bb_data["squeeze"],
            # Stochastic
            stoch_k=stoch_data["k"],
            stoch_d=stoch_data["d"],
            stoch_signal=stoch_data["signal"],
            stoch_cross=stoch_data["cross"],
            # ATR
            atr=atr_data["atr"],
            atr_pct=atr_data["atr_pct"],
            # S/R
            support_levels=sr_data["supports"],
            resistance_levels=sr_data["resistances"],
            nearest_support=sr_data["nearest_support"],
            nearest_resistance=sr_data["nearest_resistance"],
            # Volume Profile
            poc=vp_data.get("poc"),
            value_area_high=vp_data.get("value_area_high"),
            value_area_low=vp_data.get("value_area_low"),
            # Price & patterns
            current_price=current_price,
            candlestick_patterns=patterns,
        )

    # ------------------------------------------------------------------
    # EMA
    # ------------------------------------------------------------------
    def calculate_ema_indicators(self, df: pd.DataFrame) -> dict:
        close = df["close"]

        ema8 = ta.ema(close, length=8)
        ema21 = ta.ema(close, length=21)
        ema55 = ta.ema(close, length=55)
        ema200 = ta.ema(close, length=200)

        v8 = float(ema8.iloc[-1]) if ema8 is not None and not ema8.empty else float("nan")
        v21 = float(ema21.iloc[-1]) if ema21 is not None and not ema21.empty else float("nan")
        v55 = float(ema55.iloc[-1]) if ema55 is not None and not ema55.empty else float("nan")
        v200 = float(ema200.iloc[-1]) if ema200 is not None and not ema200.empty else float("nan")

        # Trend determination
        if all(np.isfinite(v) for v in (v8, v21, v55, v200)):
            if v8 > v21 > v55 > v200:
                trend = "BULLISH"
                aligned = True
            elif v8 < v21 < v55 < v200:
                trend = "BEARISH"
                aligned = True
            elif v8 > v21 and v55 > v200:
                trend = "BULLISH"
                aligned = False
            elif v8 < v21 and v55 < v200:
                trend = "BEARISH"
                aligned = False
            else:
                trend = "RANGING"
                aligned = False
        else:
            trend = "RANGING"
            aligned = False

        return {
            "ema8": v8,
            "ema21": v21,
            "ema55": v55,
            "ema200": v200,
            "trend": trend,
            "aligned": aligned,
        }

    # ------------------------------------------------------------------
    # RSI
    # ------------------------------------------------------------------
    def calculate_rsi(self, df: pd.DataFrame, period: int = 14) -> dict:
        close = df["close"]
        rsi_series = ta.rsi(close, length=period)

        if rsi_series is None or rsi_series.dropna().empty:
            return {"rsi": 50.0, "signal": "NEUTRAL", "divergence": None}

        current_rsi = float(rsi_series.iloc[-1])

        if current_rsi >= 70:
            signal = "OVERBOUGHT"
        elif current_rsi <= 30:
            signal = "OVERSOLD"
        else:
            signal = "NEUTRAL"

        # Divergence detection using last 5 bars
        divergence = None
        lookback = 5
        if len(close) >= lookback + 1 and len(rsi_series.dropna()) >= lookback + 1:
            prices = close.values[-lookback:]
            rsi_vals = rsi_series.values[-lookback:]
            valid = ~np.isnan(rsi_vals)
            if valid.sum() >= 3:
                p_filtered = prices[valid]
                r_filtered = rsi_vals[valid]

                price_trend = np.polyfit(np.arange(len(p_filtered)), p_filtered, 1)[0]
                rsi_trend = np.polyfit(np.arange(len(r_filtered)), r_filtered, 1)[0]

                if price_trend < 0 and rsi_trend > 0:
                    divergence = "BULLISH"   # price falling, RSI rising
                elif price_trend > 0 and rsi_trend < 0:
                    divergence = "BEARISH"   # price rising, RSI falling

        return {"rsi": current_rsi, "signal": signal, "divergence": divergence}

    # ------------------------------------------------------------------
    # MACD
    # ------------------------------------------------------------------
    def calculate_macd(self, df: pd.DataFrame) -> dict:
        close = df["close"]
        macd_df = ta.macd(close, fast=12, slow=26, signal=9)

        if macd_df is None or macd_df.empty:
            return {
                "macd": 0.0, "signal": 0.0, "hist": 0.0,
                "cross": None, "above_zero": False,
            }

        # pandas_ta columns: MACD_12_26_9, MACDs_12_26_9, MACDh_12_26_9
        macd_col = [c for c in macd_df.columns if c.startswith("MACD_")]
        sig_col = [c for c in macd_df.columns if c.startswith("MACDs_")]
        hist_col = [c for c in macd_df.columns if c.startswith("MACDh_")]

        if not macd_col or not sig_col or not hist_col:
            return {
                "macd": 0.0, "signal": 0.0, "hist": 0.0,
                "cross": None, "above_zero": False,
            }

        macd_val = float(macd_df[macd_col[0]].iloc[-1])
        sig_val = float(macd_df[sig_col[0]].iloc[-1])
        hist_val = float(macd_df[hist_col[0]].iloc[-1])

        above_zero = macd_val > 0

        # Crossover detection (last 3 bars)
        cross = None
        macd_series = macd_df[macd_col[0]].values
        sig_series = macd_df[sig_col[0]].values

        if len(macd_series) >= 3:
            for i in range(-3, -1):
                prev_macd = macd_series[i]
                prev_sig = sig_series[i]
                cur_macd = macd_series[i + 1]
                cur_sig = sig_series[i + 1]
                if np.isnan(prev_macd) or np.isnan(prev_sig):
                    continue
                if prev_macd < prev_sig and cur_macd >= cur_sig:
                    cross = "GOLDEN"
                elif prev_macd > prev_sig and cur_macd <= cur_sig:
                    cross = "DEATH"

        return {
            "macd": macd_val,
            "signal": sig_val,
            "hist": hist_val,
            "cross": cross,
            "above_zero": above_zero,
        }

    # ------------------------------------------------------------------
    # Bollinger Bands
    # ------------------------------------------------------------------
    def calculate_bollinger(
        self, df: pd.DataFrame, period: int = 20, std: float = 2.0
    ) -> dict:
        close = df["close"]
        bb = ta.bbands(close, length=period, std=std)

        if bb is None or bb.empty:
            price = float(close.iloc[-1])
            return {
                "upper": price, "middle": price, "lower": price,
                "width": 0.0, "position": "MIDDLE", "squeeze": False,
            }

        upper_col = [c for c in bb.columns if "BBU" in c]
        mid_col = [c for c in bb.columns if "BBM" in c]
        lower_col = [c for c in bb.columns if "BBL" in c]
        bw_col = [c for c in bb.columns if "BBB" in c]  # bandwidth

        upper = float(bb[upper_col[0]].iloc[-1]) if upper_col else 0.0
        middle = float(bb[mid_col[0]].iloc[-1]) if mid_col else 0.0
        lower = float(bb[lower_col[0]].iloc[-1]) if lower_col else 0.0
        bw = float(bb[bw_col[0]].iloc[-1]) if bw_col else 0.0

        price = float(close.iloc[-1])
        width = upper - lower

        # Position
        near_threshold = width * 0.1
        if price > upper:
            position = "ABOVE_UPPER"
        elif price >= upper - near_threshold:
            position = "NEAR_UPPER"
        elif price <= lower + near_threshold:
            position = "NEAR_LOWER"
        elif price < lower:
            position = "BELOW_LOWER"
        else:
            position = "MIDDLE"

        # Squeeze: current BW vs 20-period historical BW
        squeeze = False
        if bw_col and len(bb) >= 20:
            hist_bw = bb[bw_col[0]].dropna().values[-20:]
            if len(hist_bw) > 1:
                avg_bw = np.mean(hist_bw[:-1])
                squeeze = bw < avg_bw * 0.8

        return {
            "upper": upper,
            "middle": middle,
            "lower": lower,
            "width": width,
            "position": position,
            "squeeze": squeeze,
        }

    # ------------------------------------------------------------------
    # Stochastic
    # ------------------------------------------------------------------
    def calculate_stochastic(
        self, df: pd.DataFrame, k: int = 14, d: int = 3, smooth: int = 3
    ) -> dict:
        stoch = ta.stoch(df["high"], df["low"], df["close"], k=k, d=d, smooth_k=smooth)

        if stoch is None or stoch.empty:
            return {"k": 50.0, "d": 50.0, "signal": "NEUTRAL", "cross": None}

        k_col = [c for c in stoch.columns if "STOCHk" in c]
        d_col = [c for c in stoch.columns if "STOCHd" in c]

        k_val = float(stoch[k_col[0]].iloc[-1]) if k_col else 50.0
        d_val = float(stoch[d_col[0]].iloc[-1]) if d_col else 50.0

        if k_val >= 80:
            signal = "OVERBOUGHT"
        elif k_val <= 20:
            signal = "OVERSOLD"
        else:
            signal = "NEUTRAL"

        # Crossover detection
        cross = None
        if k_col and d_col and len(stoch) >= 3:
            k_arr = stoch[k_col[0]].values
            d_arr = stoch[d_col[0]].values
            for i in range(-3, -1):
                pk, pd_ = k_arr[i], d_arr[i]
                ck, cd = k_arr[i + 1], d_arr[i + 1]
                if np.isnan(pk) or np.isnan(pd_):
                    continue
                if pk < pd_ and ck >= cd:
                    cross = "BULLISH"
                elif pk > pd_ and ck <= cd:
                    cross = "BEARISH"

        return {"k": k_val, "d": d_val, "signal": signal, "cross": cross}

    # ------------------------------------------------------------------
    # ATR
    # ------------------------------------------------------------------
    def calculate_atr(self, df: pd.DataFrame, period: int = 14) -> dict:
        atr_series = ta.atr(df["high"], df["low"], df["close"], length=period)
        current_price = float(df["close"].iloc[-1])

        if atr_series is None or atr_series.dropna().empty:
            return {"atr": 0.0, "atr_pct": 0.0}

        atr_val = float(atr_series.iloc[-1])
        atr_pct = (atr_val / current_price * 100) if current_price > 0 else 0.0

        return {"atr": atr_val, "atr_pct": atr_pct}

    # ------------------------------------------------------------------
    # Support / Resistance (fractal pivots)
    # ------------------------------------------------------------------
    def detect_support_resistance(
        self, df: pd.DataFrame, lookback: int = 100
    ) -> dict:
        data = df.tail(lookback).copy()
        highs = data["high"].values
        lows = data["low"].values
        closes = data["close"].values
        current_price = float(closes[-1])

        pivot_highs: List[float] = []
        pivot_lows: List[float] = []

        # Fractal method: a pivot high needs to be higher than 2 bars on each side
        for i in range(2, len(highs) - 2):
            if highs[i] == max(highs[i - 2: i + 3]):
                pivot_highs.append(highs[i])
            if lows[i] == min(lows[i - 2: i + 3]):
                pivot_lows.append(lows[i])

        def cluster_levels(levels: List[float], threshold_pct: float = 0.001) -> List[float]:
            if not levels:
                return []
            sorted_levels = sorted(set(levels))
            clusters: List[List[float]] = []
            current_cluster = [sorted_levels[0]]
            for level in sorted_levels[1:]:
                if (level - current_cluster[-1]) / current_cluster[-1] < threshold_pct:
                    current_cluster.append(level)
                else:
                    clusters.append(current_cluster)
                    current_cluster = [level]
            clusters.append(current_cluster)
            return [float(np.mean(c)) for c in clusters]

        supports = cluster_levels(pivot_lows)
        resistances = cluster_levels(pivot_highs)

        # Nearest below = support, nearest above = resistance
        below = [s for s in supports if s < current_price]
        above = [r for r in resistances if r > current_price]

        nearest_support = float(max(below)) if below else (current_price * 0.995)
        nearest_resistance = float(min(above)) if above else (current_price * 1.005)

        return {
            "supports": sorted(supports),
            "resistances": sorted(resistances),
            "nearest_support": nearest_support,
            "nearest_resistance": nearest_resistance,
        }

    # ------------------------------------------------------------------
    # Volume Profile
    # ------------------------------------------------------------------
    def calculate_volume_profile(
        self, df: pd.DataFrame, bins: int = 20
    ) -> dict:
        if "volume" not in df.columns or df["volume"].sum() == 0:
            return {"poc": None, "value_area_high": None, "value_area_low": None}

        high_max = float(df["high"].max())
        low_min = float(df["low"].min())
        price_range = high_max - low_min

        if price_range <= 0:
            return {"poc": None, "value_area_high": None, "value_area_low": None}

        bin_edges = np.linspace(low_min, high_max, bins + 1)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        volume_profile = np.zeros(bins)

        for _, row in df.iterrows():
            row_mid = (row["high"] + row["low"]) / 2
            idx = int((row_mid - low_min) / price_range * (bins - 1))
            idx = max(0, min(bins - 1, idx))
            volume_profile[idx] += row["volume"]

        poc_idx = int(np.argmax(volume_profile))
        poc = float(bin_centers[poc_idx])

        # Value Area: 70% of total volume centred around POC
        total_volume = volume_profile.sum()
        target_volume = total_volume * 0.70

        va_indices = [poc_idx]
        accumulated = volume_profile[poc_idx]

        lower_idx = poc_idx - 1
        upper_idx = poc_idx + 1

        while accumulated < target_volume:
            lower_vol = volume_profile[lower_idx] if lower_idx >= 0 else 0
            upper_vol = volume_profile[upper_idx] if upper_idx < bins else 0

            if lower_vol == 0 and upper_vol == 0:
                break

            if lower_vol >= upper_vol and lower_idx >= 0:
                accumulated += lower_vol
                va_indices.append(lower_idx)
                lower_idx -= 1
            elif upper_idx < bins:
                accumulated += upper_vol
                va_indices.append(upper_idx)
                upper_idx += 1
            else:
                break

        va_indices.sort()
        value_area_low = float(bin_centers[va_indices[0]])
        value_area_high = float(bin_centers[va_indices[-1]])

        return {
            "poc": poc,
            "value_area_high": value_area_high,
            "value_area_low": value_area_low,
        }

    # ------------------------------------------------------------------
    # Candlestick patterns
    # ------------------------------------------------------------------
    def detect_candlestick_patterns(self, df: pd.DataFrame) -> List[str]:
        patterns: List[str] = []
        if len(df) < 3:
            return patterns

        last3 = df.tail(3)
        rows = last3.to_dict("records")
        o2, h2, l2, c2 = rows[-1]["open"], rows[-1]["high"], rows[-1]["low"], rows[-1]["close"]
        o1, h1, l1, c1 = rows[-2]["open"], rows[-2]["high"], rows[-2]["low"], rows[-2]["close"]

        body2 = abs(c2 - o2)
        range2 = h2 - l2 if (h2 - l2) > 0 else 1e-10
        upper_wick2 = h2 - max(o2, c2)
        lower_wick2 = min(o2, c2) - l2

        # Doji: very small body relative to range
        if body2 / range2 < 0.1:
            patterns.append("DOJI")

        # Hammer: small body at top, long lower wick, little upper wick (bullish)
        if (
            lower_wick2 >= 2 * body2
            and upper_wick2 <= body2 * 0.5
            and c1 < o1  # previous candle bearish
        ):
            patterns.append("HAMMER")

        # Shooting Star: small body at bottom, long upper wick (bearish)
        if (
            upper_wick2 >= 2 * body2
            and lower_wick2 <= body2 * 0.5
            and c1 > o1  # previous candle bullish
        ):
            patterns.append("SHOOTING_STAR")

        # Bullish Engulfing
        if (
            c1 < o1          # prev bearish
            and c2 > o2      # current bullish
            and o2 <= c1     # current opens at or below prev close
            and c2 >= o1     # current closes at or above prev open
        ):
            patterns.append("BULLISH_ENGULFING")

        # Bearish Engulfing
        if (
            c1 > o1          # prev bullish
            and c2 < o2      # current bearish
            and o2 >= c1     # current opens at or above prev close
            and c2 <= o1     # current closes at or below prev open
        ):
            patterns.append("BEARISH_ENGULFING")

        # Pin Bar (long wick > 2/3 of range)
        if lower_wick2 / range2 > 0.66:
            patterns.append("BULLISH_PIN_BAR")
        if upper_wick2 / range2 > 0.66:
            patterns.append("BEARISH_PIN_BAR")

        return patterns
