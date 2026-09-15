"""
Service de reporting - Calcule les statistiques de performance du compte
et génère des exports CSV pour analyse externe.
Métriques couvertes : Win rate, Profit Factor, Expectancy, Sharpe Ratio,
Max Drawdown, résultats par paire, P&L périodique, courbe d'équité.
"""
import io
import csv
from typing import Dict, List, Optional
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from loguru import logger


class ReportingService:
    """Génère les rapports et statistiques de performance du bot."""

    def __init__(self, db_session):
        self.db = db_session

    # ------------------------------------------------------------------
    # Statistiques globales du compte
    # ------------------------------------------------------------------

    async def get_account_stats(self) -> dict:
        """
        Calcule les statistiques de performance complètes sur l'ensemble
        des trades fermés disponibles en base de données.

        Métriques retournées :
        - Win rate, Profit Factor, Expectancy
        - Moyenne des gains / pertes, extremes
        - Max Drawdown (absolu et %)
        - Sharpe Ratio annualisé (approximation sur série P&L)
        - Statistiques par paire
        """
        from models.trade import Trade

        async with self.db() as session:
            result = await session.execute(
                select(Trade)
                .where(Trade.status == "CLOSED")
                .order_by(Trade.close_time.asc())
            )
            trades = result.scalars().all()

        if not trades:
            return self._empty_stats()

        pls = [t.profit_loss for t in trades if t.profit_loss is not None]
        if not pls:
            return self._empty_stats()

        winning = [pl for pl in pls if pl > 0]
        losing = [pl for pl in pls if pl < 0]

        gross_profit = sum(winning) if winning else 0.0
        gross_loss = abs(sum(losing)) if losing else 0.0
        win_rate = len(winning) / len(pls)
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float("inf")

        avg_win = float(np.mean(winning)) if winning else 0.0
        avg_loss = abs(float(np.mean(losing))) if losing else 0.0
        expectancy = (win_rate * avg_win) - ((1.0 - win_rate) * avg_loss)

        # ── Max Drawdown ──────────────────────────────────────────────────────
        initial_equity = 10_000.0  # Capital de référence par défaut
        equity = initial_equity
        max_eq = equity
        max_dd_abs = 0.0

        for pl in pls:
            equity += pl
            max_eq = max(max_eq, equity)
            dd = (max_eq - equity) / max_eq if max_eq > 0 else 0.0
            max_dd_abs = max(max_dd_abs, dd)

        # ── Sharpe Ratio ──────────────────────────────────────────────────────
        pl_series = pd.Series(pls)
        sharpe = 0.0
        if len(pl_series) > 1 and pl_series.std() > 0:
            sharpe = float((pl_series.mean() / pl_series.std()) * np.sqrt(252))

        # ── Statistiques par paire ─────────────────────────────────────────
        pair_stats: Dict[str, dict] = {}
        for trade in trades:
            p = trade.pair
            if p not in pair_stats:
                pair_stats[p] = {
                    "trades": 0,
                    "wins": 0,
                    "losses": 0,
                    "pl": 0.0,
                    "win_rate": 0.0,
                }
            pair_stats[p]["trades"] += 1
            pl = trade.profit_loss or 0.0
            pair_stats[p]["pl"] = round(pair_stats[p]["pl"] + pl, 2)
            if pl > 0:
                pair_stats[p]["wins"] += 1
            else:
                pair_stats[p]["losses"] += 1

        for p, stats in pair_stats.items():
            t = stats["trades"]
            stats["win_rate"] = round(stats["wins"] / t * 100, 1) if t > 0 else 0.0
            stats["pl"] = round(stats["pl"], 2)

        # ── Séquences ────────────────────────────────────────────────────────
        max_consecutive_wins, max_consecutive_losses = self._calculate_streaks(pls)

        return {
            "total_trades": len(pls),
            "winning_trades": len(winning),
            "losing_trades": len(losing),
            "win_rate": round(win_rate * 100, 2),
            "profit_factor": round(profit_factor, 3),
            "expectancy": round(expectancy, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "largest_win": round(max(winning, default=0.0), 2),
            "largest_loss": round(min(losing, default=0.0), 2),
            "max_drawdown_pct": round(max_dd_abs * 100, 2),
            "sharpe_ratio": round(sharpe, 3),
            "gross_profit": round(gross_profit, 2),
            "gross_loss": round(gross_loss, 2),
            "net_profit": round(sum(pls), 2),
            "max_consecutive_wins": max_consecutive_wins,
            "max_consecutive_losses": max_consecutive_losses,
            "pair_stats": pair_stats,
        }

    # ------------------------------------------------------------------
    # P&L par période
    # ------------------------------------------------------------------

    async def get_period_pl(self, period: str = "day") -> dict:
        """
        Calcule le P&L réalisé pour une période donnée.

        Périodes supportées : "day", "week", "month", "all"
        """
        from models.trade import Trade

        now = datetime.utcnow()

        if period == "day":
            from_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            days_since_monday = now.weekday()
            from_time = (now - timedelta(days=days_since_monday)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        elif period == "month":
            from_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "all":
            from_time = datetime(2000, 1, 1)
        else:
            # Fallback : 30 jours glissants
            from_time = now - timedelta(days=30)

        async with self.db() as session:
            result = await session.execute(
                select(
                    func.sum(Trade.profit_loss).label("total_pl"),
                    func.count(Trade.id).label("trade_count"),
                    func.sum(
                        (Trade.profit_loss > 0).cast(type_=None)
                    ).label("win_count"),
                ).where(
                    and_(
                        Trade.status == "CLOSED",
                        Trade.close_time >= from_time,
                    )
                )
            )
            row = result.one()

        total_pl = float(row.total_pl or 0)
        trade_count = int(row.trade_count or 0)

        # Compter les wins séparément si la requête agrégée ne le permet pas
        win_count = 0
        if trade_count > 0:
            async with self.db() as session:
                win_result = await session.execute(
                    select(func.count(Trade.id)).where(
                        and_(
                            Trade.status == "CLOSED",
                            Trade.close_time >= from_time,
                            Trade.profit_loss > 0,
                        )
                    )
                )
                win_count = int(win_result.scalar() or 0)

        return {
            "period": period,
            "pl": round(total_pl, 2),
            "trades": trade_count,
            "wins": win_count,
            "losses": trade_count - win_count,
            "win_rate": round(win_count / trade_count * 100, 1) if trade_count > 0 else 0.0,
            "from": from_time.isoformat(),
            "to": now.isoformat(),
        }

    # ------------------------------------------------------------------
    # Export CSV
    # ------------------------------------------------------------------

    async def export_trades_csv(self) -> str:
        """
        Exporte tous les trades (ouverts et fermés) en CSV.
        Retourne le contenu CSV comme chaîne de caractères.
        """
        from models.trade import Trade

        async with self.db() as session:
            result = await session.execute(
                select(Trade).order_by(Trade.open_time.desc())
            )
            trades = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        writer.writerow([
            "ID",
            "Paire",
            "Direction",
            "Prix Entrée",
            "Stop Loss",
            "Take Profit",
            "Lot Size (units)",
            "Statut",
            "Ouverture (UTC)",
            "Fermeture (UTC)",
            "Prix Sortie",
            "P&L ($)",
            "P&L (pips)",
            "R:R",
            "Score Confluence",
            "Timeframe",
            "Risque ($)",
            "Récompense ($)",
            "Raison Clôture",
            "Commission",
            "Swap",
        ])

        for t in trades:
            rr = t.risk_reward_ratio if hasattr(t, "risk_reward_ratio") else (
                round(t.reward_amount / t.risk_amount, 2)
                if t.risk_amount and t.reward_amount and t.risk_amount > 0
                else ""
            )
            writer.writerow([
                t.id,
                t.pair,
                t.direction.value if hasattr(t.direction, "value") else t.direction,
                t.entry_price,
                t.stop_loss or "",
                t.take_profit or "",
                t.lot_size,
                t.status.value if hasattr(t.status, "value") else t.status,
                t.open_time.isoformat() if t.open_time else "",
                t.close_time.isoformat() if t.close_time else "",
                t.close_price or "",
                round(t.profit_loss, 4) if t.profit_loss is not None else "",
                round(t.profit_loss_pips, 1) if t.profit_loss_pips is not None else "",
                rr,
                round(t.confluence_score, 1) if t.confluence_score is not None else "",
                t.timeframe or "",
                round(t.risk_amount, 2) if t.risk_amount is not None else "",
                round(t.reward_amount, 2) if t.reward_amount is not None else "",
                t.close_reason or "",
                round(t.commission, 4) if t.commission is not None else 0,
                round(t.swap, 4) if t.swap is not None else 0,
            ])

        return output.getvalue()

    # ------------------------------------------------------------------
    # Courbe d'équité
    # ------------------------------------------------------------------

    async def get_equity_curve(self, period: str = "1m") -> List[dict]:
        """
        Retourne les snapshots de compte pour le tracé de la courbe d'équité.

        Périodes : "1d", "1w", "1m", "3m", "6m", "1y", "all"
        """
        from models.account import AccountSnapshot

        period_days = {
            "1d": 1,
            "1w": 7,
            "1m": 30,
            "3m": 90,
            "6m": 180,
            "1y": 365,
            "all": 36_500,
        }
        days = period_days.get(period, 30)
        from_time = datetime.utcnow() - timedelta(days=days)

        async with self.db() as session:
            result = await session.execute(
                select(AccountSnapshot)
                .where(AccountSnapshot.timestamp >= from_time)
                .order_by(AccountSnapshot.timestamp.asc())
            )
            snapshots = result.scalars().all()

        return [
            {
                "timestamp": s.timestamp.isoformat(),
                "equity": s.equity,
                "balance": s.balance,
                "daily_pl": s.daily_pl,
                "unrealized_pl": s.unrealized_pl,
                "open_trades": s.open_trades_count,
                "drawdown_pct": s.current_drawdown,
            }
            for s in snapshots
        ]

    # ------------------------------------------------------------------
    # Performances mensuelles
    # ------------------------------------------------------------------

    async def get_monthly_breakdown(self) -> List[dict]:
        """
        Retourne les statistiques de performance mois par mois.
        Utile pour le calendrier de performance dans le dashboard.
        """
        from models.trade import Trade

        async with self.db() as session:
            result = await session.execute(
                select(Trade)
                .where(Trade.status == "CLOSED")
                .order_by(Trade.close_time.asc())
            )
            trades = result.scalars().all()

        if not trades:
            return []

        monthly: Dict[str, dict] = {}
        for trade in trades:
            if not trade.close_time:
                continue
            month_key = trade.close_time.strftime("%Y-%m")
            if month_key not in monthly:
                monthly[month_key] = {
                    "month": month_key,
                    "trades": 0,
                    "wins": 0,
                    "losses": 0,
                    "pl": 0.0,
                    "gross_profit": 0.0,
                    "gross_loss": 0.0,
                }
            pl = trade.profit_loss or 0.0
            monthly[month_key]["trades"] += 1
            monthly[month_key]["pl"] = round(monthly[month_key]["pl"] + pl, 2)
            if pl > 0:
                monthly[month_key]["wins"] += 1
                monthly[month_key]["gross_profit"] = round(
                    monthly[month_key]["gross_profit"] + pl, 2
                )
            else:
                monthly[month_key]["losses"] += 1
                monthly[month_key]["gross_loss"] = round(
                    monthly[month_key]["gross_loss"] + abs(pl), 2
                )

        breakdown = []
        for key in sorted(monthly.keys()):
            m = monthly[key]
            t = m["trades"]
            m["win_rate"] = round(m["wins"] / t * 100, 1) if t > 0 else 0.0
            m["profit_factor"] = (
                round(m["gross_profit"] / m["gross_loss"], 3)
                if m["gross_loss"] > 0
                else float("inf")
            )
            breakdown.append(m)

        return breakdown

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _calculate_streaks(self, pls: List[float]) -> tuple:
        """
        Calcule les séquences consécutives maximales de gains et de pertes.
        Retourne (max_wins, max_losses).
        """
        max_wins = 0
        max_losses = 0
        current_wins = 0
        current_losses = 0

        for pl in pls:
            if pl > 0:
                current_wins += 1
                current_losses = 0
                max_wins = max(max_wins, current_wins)
            elif pl < 0:
                current_losses += 1
                current_wins = 0
                max_losses = max(max_losses, current_losses)
            else:
                current_wins = 0
                current_losses = 0

        return max_wins, max_losses

    def _empty_stats(self) -> dict:
        """Retourne un dictionnaire de statistiques vides (aucun trade)."""
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0.0,
            "profit_factor": 0.0,
            "expectancy": 0.0,
            "avg_win": 0.0,
            "avg_loss": 0.0,
            "largest_win": 0.0,
            "largest_loss": 0.0,
            "max_drawdown_pct": 0.0,
            "sharpe_ratio": 0.0,
            "gross_profit": 0.0,
            "gross_loss": 0.0,
            "net_profit": 0.0,
            "max_consecutive_wins": 0,
            "max_consecutive_losses": 0,
            "pair_stats": {},
        }
