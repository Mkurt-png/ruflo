"""
Moteur de backtesting vectorisé.
Teste la stratégie multi-confluence sur des données historiques OANDA.
Métriques calculées : Win rate, Profit Factor, Max Drawdown, Sharpe Ratio,
Expectancy, courbe d'équité et journal de trades.
"""
import asyncio
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from loguru import logger


@dataclass
class BacktestResult:
    pair: str
    from_date: str
    to_date: str
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_profit_loss: float
    profit_factor: float
    max_drawdown: float        # en devise
    max_drawdown_pct: float    # en %
    sharpe_ratio: float
    expectancy: float          # gain moyen par trade en devise
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    best_month: str
    worst_month: str
    monthly_returns: Dict[str, float]
    equity_curve: List[dict]   # [{"date": str, "equity": float}, …]
    trade_log: List[dict]


class BacktestEngine:
    """
    Backtesteur bar-by-bar de la stratégie multi-confluence.

    Le moteur :
    - Récupère les données OANDA sur plusieurs timeframes (D, H4, H1, M15)
    - Simule les trades M15 bar-by-bar en appliquant le même scoring
      que le signal engine en production
    - Respecte le look-ahead bias : seules les bougies passées sont utilisées
    - Calcule toutes les métriques de performance
    """

    # Granularités OANDA autorisées par ordre croissant de durée
    _VALID_GRANULARITIES = ("M1", "M5", "M15", "M30", "H1", "H2", "H4", "H8", "D", "W", "M")

    def __init__(self, oanda_client, indicator_service):
        self.client = oanda_client
        self.indicators = indicator_service
        self.initial_balance: float = 10_000.0

    # ------------------------------------------------------------------
    # Point d'entrée principal
    # ------------------------------------------------------------------

    async def run_backtest(
        self,
        pair: str,
        from_date: str,
        to_date: str,
        initial_balance: float = 10_000.0,
        risk_per_trade: float = 0.015,
    ) -> Optional[BacktestResult]:
        """
        Lance un backtest complet sur une paire et une période données.

        Args:
            pair:             Paire OANDA, ex: "EUR_USD"
            from_date:        Date de début au format "YYYY-MM-DD"
            to_date:          Date de fin au format "YYYY-MM-DD"
            initial_balance:  Capital de départ en devise du compte
            risk_per_trade:   Fraction du capital risquée par trade (défaut 1.5%)

        Returns:
            BacktestResult avec toutes les métriques, ou None si données insuffisantes.
        """
        logger.info(
            f"Backtest : {pair} | {from_date} → {to_date} "
            f"| capital {initial_balance:.0f} | risque {risk_per_trade:.1%}"
        )
        self.initial_balance = initial_balance

        # Conversion des dates en format RFC3339 pour OANDA
        from_rfc = from_date + "T00:00:00Z" if "T" not in from_date else from_date
        to_rfc = to_date + "T23:59:59Z" if "T" not in to_date else to_date

        # Récupération des données multi-timeframe en parallèle
        results = await asyncio.gather(
            self._get_historical_data(pair, "D", from_rfc, to_rfc),
            self._get_historical_data(pair, "H4", from_rfc, to_rfc),
            self._get_historical_data(pair, "H1", from_rfc, to_rfc),
            self._get_historical_data(pair, "M15", from_rfc, to_rfc),
            return_exceptions=True,
        )

        df_daily, df_h4, df_h1, df_m15 = [
            r if not isinstance(r, Exception) else None for r in results
        ]

        if df_m15 is None or len(df_m15) < 200:
            logger.error(
                f"Données M15 insuffisantes pour {pair} "
                f"(reçu: {len(df_m15) if df_m15 is not None else 0} bougies, minimum: 200)"
            )
            return None

        logger.info(
            f"Données chargées : D={len(df_daily) if df_daily is not None else 0} | "
            f"H4={len(df_h4) if df_h4 is not None else 0} | "
            f"H1={len(df_h1) if df_h1 is not None else 0} | "
            f"M15={len(df_m15)}"
        )

        trades = await self._simulate_trades(
            pair, df_daily, df_h4, df_h1, df_m15,
            initial_balance, risk_per_trade,
        )

        result = self._calculate_metrics(pair, from_date, to_date, trades, initial_balance)
        logger.info(
            f"Backtest terminé : {result.total_trades} trades | "
            f"WR {result.win_rate:.1%} | PF {result.profit_factor:.2f} | "
            f"P&L {result.total_profit_loss:+.2f} | "
            f"MaxDD {result.max_drawdown_pct:.1f}%"
        )
        return result

    # ------------------------------------------------------------------
    # Récupération des données historiques
    # ------------------------------------------------------------------

    async def _get_historical_data(
        self,
        pair: str,
        granularity: str,
        from_time: str,
        to_time: str,
    ) -> Optional[pd.DataFrame]:
        """
        Récupère les données OHLCV historiques depuis OANDA.
        Découpe automatiquement en chunks de 5 000 bougies max.
        """
        try:
            all_chunks: List[pd.DataFrame] = []
            current_from = from_time

            while current_from < to_time:
                candles = await self.client.get_candles(
                    pair,
                    granularity,
                    from_time=current_from,
                    to_time=to_time,
                    count=5000,
                )

                if candles is None or (isinstance(candles, pd.DataFrame) and candles.empty):
                    break
                if isinstance(candles, list) and len(candles) == 0:
                    break

                # Accepter DataFrame ou liste de dicts
                if not isinstance(candles, pd.DataFrame):
                    candles = self._parse_candles(candles)

                if candles is None or candles.empty:
                    break

                all_chunks.append(candles)

                # Avancer au-delà de la dernière bougie
                last_time = candles.index[-1]
                if hasattr(last_time, "isoformat"):
                    current_from = last_time.isoformat().replace("+00:00", "Z")
                    if not current_from.endswith("Z"):
                        current_from += "Z"
                else:
                    current_from = str(last_time)

                if len(candles) < 5000:
                    break  # Dernier chunk — pas besoin de continuer

            if not all_chunks:
                logger.warning(f"Aucune donnée reçue pour {pair} {granularity}")
                return None

            df = pd.concat(all_chunks)
            df = df[~df.index.duplicated(keep="first")]
            df = df.sort_index()
            return df

        except Exception as e:
            logger.error(f"Erreur récupération données {pair} {granularity}: {e}")
            return None

    def _parse_candles(self, candles: list) -> Optional[pd.DataFrame]:
        """Convertit la réponse OANDA (liste de dicts) en DataFrame OHLCV."""
        try:
            rows = []
            for c in candles:
                mid = c.get("mid", {})
                rows.append({
                    "open": float(mid.get("o", 0)),
                    "high": float(mid.get("h", 0)),
                    "low": float(mid.get("l", 0)),
                    "close": float(mid.get("c", 0)),
                    "volume": int(c.get("volume", 0)),
                })
            df = pd.DataFrame(rows)
            df.index = pd.to_datetime([c["time"] for c in candles])
            df.index.name = "time"
            return df
        except Exception as e:
            logger.error(f"Erreur parsing candles: {e}")
            return None

    # ------------------------------------------------------------------
    # Simulation bar-by-bar
    # ------------------------------------------------------------------

    async def _simulate_trades(
        self,
        pair: str,
        df_daily: Optional[pd.DataFrame],
        df_h4: Optional[pd.DataFrame],
        df_h1: Optional[pd.DataFrame],
        df_m15: pd.DataFrame,
        balance: float,
        risk_pct: float,
    ) -> List[dict]:
        """
        Simule les trades bar-by-bar sur M15 sans look-ahead bias.

        Règles de simulation :
        - Un seul trade simultané (simplification par rapport au live)
        - Signal recherché toutes les 4 bougies M15 (= 1H)
        - Score minimum de confluence : 70/100
        - SL/TP vérifiés à chaque bougie (low/high de la bougie)
        - Position sizing proportionnel au capital courant
        """
        trades: List[dict] = []
        current_balance = balance
        open_trade: Optional[dict] = None

        for i in range(200, len(df_m15)):
            current_bar = df_m15.iloc[i]
            current_time = df_m15.index[i]

            # ── Vérification SL/TP du trade ouvert ──────────────────────────
            if open_trade is not None:
                direction = open_trade["direction"]
                sl = open_trade["stop_loss"]
                tp = open_trade["take_profit"]
                entry = open_trade["entry"]
                units = open_trade["units"]

                if direction == "BUY":
                    if current_bar["low"] <= sl:
                        pl = (sl - entry) * units
                        current_balance += pl
                        open_trade.update({
                            "exit_price": sl,
                            "exit_time": current_time,
                            "pl": round(pl, 4),
                            "result": "LOSS",
                        })
                        trades.append(open_trade)
                        open_trade = None
                        continue

                    if current_bar["high"] >= tp:
                        pl = (tp - entry) * units
                        current_balance += pl
                        open_trade.update({
                            "exit_price": tp,
                            "exit_time": current_time,
                            "pl": round(pl, 4),
                            "result": "WIN",
                        })
                        trades.append(open_trade)
                        open_trade = None
                        continue

                else:  # SELL
                    if current_bar["high"] >= sl:
                        pl = (entry - sl) * units
                        current_balance -= pl
                        open_trade.update({
                            "exit_price": sl,
                            "exit_time": current_time,
                            "pl": round(-pl, 4),
                            "result": "LOSS",
                        })
                        trades.append(open_trade)
                        open_trade = None
                        continue

                    if current_bar["low"] <= tp:
                        pl = (entry - tp) * units
                        current_balance += pl
                        open_trade.update({
                            "exit_price": tp,
                            "exit_time": current_time,
                            "pl": round(pl, 4),
                            "result": "WIN",
                        })
                        trades.append(open_trade)
                        open_trade = None
                        continue

            # ── Recherche de signal (toutes les 4 bougies M15 = 1H) ─────────
            if open_trade is None and i % 4 == 0:
                try:
                    m15_slice = df_m15.iloc[max(0, i - 200): i + 1]
                    if len(m15_slice) < 50:
                        continue

                    h1_slice = (
                        df_h1[df_h1.index <= current_time].tail(200)
                        if df_h1 is not None else None
                    )
                    h4_slice = (
                        df_h4[df_h4.index <= current_time].tail(200)
                        if df_h4 is not None else None
                    )
                    d_slice = (
                        df_daily[df_daily.index <= current_time].tail(200)
                        if df_daily is not None else None
                    )

                    ind_m15 = self.indicators.calculate_all(m15_slice)
                    ind_h1 = (
                        self.indicators.calculate_all(h1_slice)
                        if h1_slice is not None and len(h1_slice) >= 50
                        else None
                    )
                    ind_h4 = (
                        self.indicators.calculate_all(h4_slice)
                        if h4_slice is not None and len(h4_slice) >= 50
                        else None
                    )
                    ind_d = (
                        self.indicators.calculate_all(d_slice)
                        if d_slice is not None and len(d_slice) >= 50
                        else None
                    )

                    score, direction = self._calculate_backtest_signal(
                        ind_m15, ind_h1, ind_h4, ind_d
                    )

                    if score >= 70 and direction is not None:
                        atr = ind_m15.atr if ind_m15 else current_bar["close"] * 0.005
                        entry_price = current_bar["close"]

                        if direction == "BUY":
                            sl = entry_price - atr * 1.5
                            tp = entry_price + atr * 1.5 * 2.5
                        else:
                            sl = entry_price + atr * 1.5
                            tp = entry_price - atr * 1.5 * 2.5

                        stop_distance = abs(entry_price - sl)
                        if stop_distance <= 0:
                            continue

                        risk_amount = current_balance * risk_pct
                        units = risk_amount / stop_distance
                        if units < 1:
                            continue

                        open_trade = {
                            "pair": pair,
                            "direction": direction,
                            "entry": entry_price,
                            "stop_loss": sl,
                            "take_profit": tp,
                            "units": units,
                            "entry_time": current_time,
                            "score": score,
                            "balance_at_entry": current_balance,
                            "risk_amount": round(risk_amount, 2),
                        }

                except Exception as e:
                    logger.debug(f"Signal ignoré à {current_time}: {e}")
                    continue

        # Trade encore ouvert en fin de période — fermer au dernier close
        if open_trade is not None:
            last_price = df_m15.iloc[-1]["close"]
            last_time = df_m15.index[-1]
            direction = open_trade["direction"]
            entry = open_trade["entry"]
            units = open_trade["units"]

            if direction == "BUY":
                pl = (last_price - entry) * units
            else:
                pl = (entry - last_price) * units

            open_trade.update({
                "exit_price": last_price,
                "exit_time": last_time,
                "pl": round(pl, 4),
                "result": "WIN" if pl > 0 else "LOSS",
            })
            trades.append(open_trade)

        return trades

    # ------------------------------------------------------------------
    # Calcul du score de confluence pour le backtest
    # ------------------------------------------------------------------

    def _calculate_backtest_signal(
        self,
        ind_m15,
        ind_h1,
        ind_h4,
        ind_d,
    ) -> Tuple[float, Optional[str]]:
        """
        Calcule le score de confluence simplifié pour le backtesting.

        Score max théorique : 100 points répartis sur :
        - EMA M15   : 25 pts (tendance sur le timeframe d'entrée)
        - RSI M15   : 15 pts (momentum)
        - MACD M15  : 15 pts (croisement ou position)
        - EMA H1    : 20 pts (confirmation intermédiaire)
        - EMA H4    : 15 pts (tendance principale)
        - Stoch M15 : 10 pts (zones extrêmes)

        Retourne (score, direction) avec direction ∈ {"BUY", "SELL", None}.
        """
        bull_score = 0.0
        bear_score = 0.0

        # ── EMA trend M15 (25 pts) ───────────────────────────────────────────
        if ind_m15:
            if ind_m15.ema_trend == "BULLISH":
                bull_score += 25
            elif ind_m15.ema_trend == "BEARISH":
                bear_score += 25
            elif ind_m15.ema_trend == "RANGING":
                pass  # Aucun point pour les marchés sans tendance

        # ── RSI M15 (15 pts) ─────────────────────────────────────────────────
        if ind_m15:
            if ind_m15.rsi < 35:
                bull_score += 15
            elif ind_m15.rsi < 45:
                bull_score += 7
            elif ind_m15.rsi > 65:
                bear_score += 15
            elif ind_m15.rsi > 55:
                bear_score += 7

        # ── MACD M15 (15 pts) ────────────────────────────────────────────────
        if ind_m15:
            if ind_m15.macd_cross == "GOLDEN":
                bull_score += 15
            elif ind_m15.macd_cross == "DEATH":
                bear_score += 15
            elif ind_m15.macd > ind_m15.macd_signal and ind_m15.macd_above_zero:
                bull_score += 8
            elif ind_m15.macd < ind_m15.macd_signal and not ind_m15.macd_above_zero:
                bear_score += 8
            elif ind_m15.macd > ind_m15.macd_signal:
                bull_score += 4
            elif ind_m15.macd < ind_m15.macd_signal:
                bear_score += 4

        # ── EMA H1 — confirmation intermédiaire (20 pts) ────────────────────
        if ind_h1:
            if ind_h1.ema_trend == "BULLISH":
                bull_score += 20
            elif ind_h1.ema_trend == "BEARISH":
                bear_score += 20

        # ── EMA H4 — tendance principale (15 pts) ────────────────────────────
        if ind_h4:
            if ind_h4.ema_trend == "BULLISH":
                bull_score += 15
            elif ind_h4.ema_trend == "BEARISH":
                bear_score += 15

        # ── Stochastique M15 — zones extrêmes (10 pts) ───────────────────────
        if ind_m15:
            if ind_m15.stoch_signal == "OVERSOLD":
                bull_score += 10
                if ind_m15.stoch_cross == "BULLISH":
                    bull_score += 5
            elif ind_m15.stoch_signal == "OVERBOUGHT":
                bear_score += 10
                if ind_m15.stoch_cross == "BEARISH":
                    bear_score += 5

        # ── Décision ─────────────────────────────────────────────────────────
        if bull_score >= 70 and bull_score > bear_score:
            return bull_score, "BUY"
        if bear_score >= 70 and bear_score > bull_score:
            return bear_score, "SELL"

        return max(bull_score, bear_score), None

    # ------------------------------------------------------------------
    # Calcul des métriques de performance
    # ------------------------------------------------------------------

    def _calculate_metrics(
        self,
        pair: str,
        from_date: str,
        to_date: str,
        trades: List[dict],
        initial_balance: float,
    ) -> BacktestResult:
        """
        Calcule l'ensemble des métriques de performance à partir de la liste de trades.
        """
        if not trades:
            return BacktestResult(
                pair=pair, from_date=from_date, to_date=to_date,
                total_trades=0, winning_trades=0, losing_trades=0,
                win_rate=0.0, total_profit_loss=0.0, profit_factor=0.0,
                max_drawdown=0.0, max_drawdown_pct=0.0, sharpe_ratio=0.0,
                expectancy=0.0, avg_win=0.0, avg_loss=0.0,
                largest_win=0.0, largest_loss=0.0,
                best_month="N/A", worst_month="N/A",
                monthly_returns={}, equity_curve=[], trade_log=[],
            )

        winning = [t for t in trades if t["result"] == "WIN"]
        losing = [t for t in trades if t["result"] == "LOSS"]

        total_profit = sum(t["pl"] for t in winning)
        total_loss = abs(sum(t["pl"] for t in losing))

        # ── Courbe d'équité & Drawdown ────────────────────────────────────────
        equity = initial_balance
        max_equity = equity
        max_drawdown_abs = 0.0
        equity_curve = [{
            "date": str(trades[0]["entry_time"]),
            "equity": round(equity, 2),
        }]

        for t in trades:
            equity += t["pl"]
            equity_curve.append({
                "date": str(t.get("exit_time", t["entry_time"])),
                "equity": round(equity, 2),
            })
            max_equity = max(max_equity, equity)
            dd = max_equity - equity
            max_drawdown_abs = max(max_drawdown_abs, dd)

        max_drawdown_pct = (max_drawdown_abs / initial_balance * 100) if initial_balance > 0 else 0.0

        # ── Sharpe Ratio annualisé ────────────────────────────────────────────
        pls = pd.Series([t["pl"] for t in trades])
        sharpe = 0.0
        if len(pls) > 1 and pls.std() > 0:
            # Annualisation par approximation : 252 jours de trading
            sharpe = float((pls.mean() / pls.std()) * np.sqrt(252))

        # ── Retours mensuels ──────────────────────────────────────────────────
        monthly_returns: Dict[str, float] = {}
        for t in trades:
            exit_time = t.get("exit_time", t["entry_time"])
            if hasattr(exit_time, "strftime"):
                month_key = exit_time.strftime("%Y-%m")
            else:
                month_key = str(exit_time)[:7]
            monthly_returns[month_key] = round(
                monthly_returns.get(month_key, 0.0) + t["pl"], 2
            )

        best_month = (
            max(monthly_returns, key=monthly_returns.get)
            if monthly_returns else "N/A"
        )
        worst_month = (
            min(monthly_returns, key=monthly_returns.get)
            if monthly_returns else "N/A"
        )

        # ── Journal de trades ─────────────────────────────────────────────────
        trade_log = []
        for t in trades:
            exit_time = t.get("exit_time", "")
            trade_log.append({
                "pair": t["pair"],
                "direction": t["direction"],
                "entry": round(t["entry"], 5),
                "exit": round(t.get("exit_price", 0), 5),
                "stop_loss": round(t["stop_loss"], 5),
                "take_profit": round(t["take_profit"], 5),
                "pl": t["pl"],
                "result": t["result"],
                "entry_time": str(t["entry_time"]),
                "exit_time": str(exit_time),
                "score": round(t.get("score", 0), 1),
                "risk_amount": t.get("risk_amount", 0),
            })

        return BacktestResult(
            pair=pair,
            from_date=from_date,
            to_date=to_date,
            total_trades=len(trades),
            winning_trades=len(winning),
            losing_trades=len(losing),
            win_rate=round(len(winning) / len(trades), 4) if trades else 0.0,
            total_profit_loss=round(equity - initial_balance, 2),
            profit_factor=round(total_profit / total_loss, 3) if total_loss > 0 else float("inf"),
            max_drawdown=round(max_drawdown_abs, 2),
            max_drawdown_pct=round(max_drawdown_pct, 2),
            sharpe_ratio=round(sharpe, 3),
            expectancy=round((equity - initial_balance) / len(trades), 2) if trades else 0.0,
            avg_win=round(total_profit / len(winning), 2) if winning else 0.0,
            avg_loss=round(total_loss / len(losing), 2) if losing else 0.0,
            largest_win=round(max((t["pl"] for t in winning), default=0.0), 2),
            largest_loss=round(min((t["pl"] for t in losing), default=0.0), 2),
            best_month=best_month,
            worst_month=worst_month,
            monthly_returns=monthly_returns,
            equity_curve=equity_curve,
            trade_log=trade_log,
        )
