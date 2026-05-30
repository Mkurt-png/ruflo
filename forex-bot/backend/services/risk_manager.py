"""
Gestionnaire de risque - Protège le capital avec des règles strictes
- Risque max 1.5% par trade
- Max 4 trades simultanés
- Drawdown journalier max 5%
- Kelly Criterion modifié pour le sizing
"""
import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from loguru import logger


@dataclass
class RiskAssessment:
    approved: bool
    reason: str
    recommended_lot_size: float
    risk_amount: float
    risk_pct: float
    reward_amount: float
    risk_reward_ratio: float
    max_loss_today: float
    remaining_daily_risk: float
    open_trades_count: int


# Sentinel pour les champs non renseignés quand approved=False
_REJECTED = RiskAssessment(
    approved=False,
    reason="",
    recommended_lot_size=0.0,
    risk_amount=0.0,
    risk_pct=0.0,
    reward_amount=0.0,
    risk_reward_ratio=0.0,
    max_loss_today=0.0,
    remaining_daily_risk=0.0,
    open_trades_count=0,
)


def _rejected(reason: str, open_trades_count: int = 0,
              max_loss_today: float = 0.0, remaining_daily_risk: float = 0.0) -> RiskAssessment:
    """Crée un RiskAssessment refusé avec la raison donnée."""
    return RiskAssessment(
        approved=False,
        reason=reason,
        recommended_lot_size=0.0,
        risk_amount=0.0,
        risk_pct=0.0,
        reward_amount=0.0,
        risk_reward_ratio=0.0,
        max_loss_today=max_loss_today,
        remaining_daily_risk=remaining_daily_risk,
        open_trades_count=open_trades_count,
    )


# Carte des corrélations entre paires (partage de devise de base ou cotée)
_CORRELATIONS: Dict[str, List[str]] = {
    "EUR_USD": ["EUR_GBP", "EUR_JPY", "EUR_CHF"],
    "GBP_USD": ["EUR_GBP", "GBP_JPY", "GBP_CHF"],
    "USD_JPY": ["EUR_JPY", "GBP_JPY", "AUD_JPY", "CAD_JPY", "CHF_JPY"],
    "AUD_USD": ["AUD_JPY", "AUD_CAD", "AUD_NZD"],
    "USD_CAD": ["CAD_JPY", "AUD_CAD"],
    "USD_CHF": ["EUR_CHF", "GBP_CHF", "CHF_JPY"],
    "NZD_USD": ["AUD_NZD"],
    "EUR_GBP": ["EUR_USD", "GBP_USD"],
    "EUR_JPY": ["EUR_USD", "USD_JPY"],
    "GBP_JPY": ["GBP_USD", "USD_JPY"],
    "AUD_JPY": ["AUD_USD", "USD_JPY"],
    "CAD_JPY": ["USD_CAD", "USD_JPY"],
}


class RiskManager:
    """Gestionnaire de risque pour le bot de trading."""

    def __init__(self, db_session, config):
        self.db = db_session
        self.config = config
        self.daily_pl: float = 0.0
        self.daily_start_balance: float = 0.0
        self.bot_stopped_by_drawdown: bool = False

    # ------------------------------------------------------------------
    # Initialisation / reset
    # ------------------------------------------------------------------

    async def initialize(self, account_balance: float) -> None:
        """Initialise le gestionnaire avec le solde de début de session."""
        self.daily_start_balance = account_balance
        self.daily_pl = 0.0
        self.bot_stopped_by_drawdown = False
        logger.info(
            f"RiskManager initialisé — balance: {account_balance:.2f} "
            f"| max drawdown: {self.config.MAX_DAILY_DRAWDOWN:.1%} "
            f"| risque/trade: {self.config.RISK_PER_TRADE:.1%}"
        )

    async def reset_daily_counters(self, new_balance: float) -> None:
        """Reset des compteurs journaliers (appelé à minuit UTC)."""
        self.daily_start_balance = new_balance
        self.daily_pl = 0.0
        self.bot_stopped_by_drawdown = False
        logger.info(f"Compteurs journaliers réinitialisés — nouvelle balance: {new_balance:.2f}")

    # ------------------------------------------------------------------
    # Validation d'un nouveau trade
    # ------------------------------------------------------------------

    async def validate_new_trade(
        self,
        signal,
        account_balance: float,
        open_trades: List[dict],
    ) -> RiskAssessment:
        """
        Valide si un nouveau trade peut être pris.

        Vérifie dans l'ordre :
        1. Bot arrêté par drawdown
        2. Nombre maximum de trades simultanés
        3. Paire déjà tradée
        4. Corrélation excessive entre paires ouvertes
        5. Drawdown journalier résiduel
        6. R:R minimum
        7. Position sizing avec Kelly Criterion modifié
        """
        open_count = len(open_trades)

        # ── 1. Drawdown journalier déjà atteint ─────────────────────────────
        if self.bot_stopped_by_drawdown:
            return _rejected(
                "Bot arrêté : drawdown journalier maximum atteint",
                open_trades_count=open_count,
                max_loss_today=self.config.MAX_DAILY_DRAWDOWN * self.daily_start_balance,
                remaining_daily_risk=0.0,
            )

        # ── 2. Max trades simultanés ─────────────────────────────────────────
        if open_count >= self.config.MAX_OPEN_TRADES:
            return _rejected(
                f"Max {self.config.MAX_OPEN_TRADES} trades simultanés atteints",
                open_trades_count=open_count,
            )

        # ── 3. Paire déjà ouverte ────────────────────────────────────────────
        open_pairs = [t.get("instrument", t.get("pair", "")) for t in open_trades]
        if signal.pair in open_pairs:
            return _rejected(
                f"Position déjà ouverte sur {signal.pair}",
                open_trades_count=open_count,
            )

        # ── 4. Corrélation excessive ─────────────────────────────────────────
        correlated = self._get_correlated_pairs(signal.pair)
        active_correlated = [p for p in open_pairs if p in correlated]
        if len(active_correlated) >= 2:
            return _rejected(
                f"Trop de paires corrélées ouvertes : {active_correlated}",
                open_trades_count=open_count,
            )

        # ── 5. Drawdown journalier résiduel ──────────────────────────────────
        if self.daily_start_balance > 0:
            daily_loss_pct = abs(min(0.0, self.daily_pl)) / self.daily_start_balance
        else:
            daily_loss_pct = 0.0

        if daily_loss_pct >= self.config.MAX_DAILY_DRAWDOWN:
            self.bot_stopped_by_drawdown = True
            logger.warning(
                f"DRAWDOWN JOURNALIER ATTEINT : {daily_loss_pct:.1%} — bot arrêté"
            )
            return _rejected(
                f"Drawdown journalier de {daily_loss_pct:.1%} atteint — seuil {self.config.MAX_DAILY_DRAWDOWN:.1%}",
                open_trades_count=open_count,
                max_loss_today=self.config.MAX_DAILY_DRAWDOWN * self.daily_start_balance,
                remaining_daily_risk=0.0,
            )

        remaining_daily_risk = (
            self.config.MAX_DAILY_DRAWDOWN - daily_loss_pct
        ) * account_balance

        # ── 6. R:R minimum ───────────────────────────────────────────────────
        risk_pips = abs(signal.entry_price - signal.stop_loss)
        reward_pips = abs(signal.take_profit - signal.entry_price)
        rr_ratio = reward_pips / risk_pips if risk_pips > 0 else 0.0

        if rr_ratio < self.config.MIN_RISK_REWARD:
            return _rejected(
                f"R:R insuffisant : {rr_ratio:.2f} (minimum requis : {self.config.MIN_RISK_REWARD})",
                open_trades_count=open_count,
                remaining_daily_risk=remaining_daily_risk,
            )

        # ── 7. Position sizing ───────────────────────────────────────────────
        lot_size, risk_amount = self.calculate_position_size(
            account_balance, signal.entry_price, signal.stop_loss, signal.pair
        )

        if lot_size <= 0:
            return _rejected(
                "Impossible de calculer une taille de position valide",
                open_trades_count=open_count,
                remaining_daily_risk=remaining_daily_risk,
            )

        reward_amount = risk_amount * rr_ratio

        return RiskAssessment(
            approved=True,
            reason="Toutes les conditions de risque validées",
            recommended_lot_size=lot_size,
            risk_amount=round(risk_amount, 2),
            risk_pct=round(risk_amount / account_balance, 5) if account_balance else 0.0,
            reward_amount=round(reward_amount, 2),
            risk_reward_ratio=round(rr_ratio, 3),
            max_loss_today=round(self.config.MAX_DAILY_DRAWDOWN * self.daily_start_balance, 2),
            remaining_daily_risk=round(remaining_daily_risk, 2),
            open_trades_count=open_count,
        )

    # ------------------------------------------------------------------
    # Position sizing
    # ------------------------------------------------------------------

    def calculate_position_size(
        self,
        account_balance: float,
        entry: float,
        stop_loss: float,
        pair: str,
    ) -> Tuple[float, float]:
        """
        Calcule la taille de position avec Kelly Criterion modifié (quart-Kelly).

        Formula de base :
            units = (balance × risk%) / |entry - stop_loss|

        Le quart-Kelly réduit la taille calculée selon :
            kelly% = win_rate - (1 - win_rate) / win_loss_ratio
            final_units = units × 0.25 × max(0.1, kelly%)

        On prend le minimum entre la taille brute et la taille Kelly pour
        limiter la variance sur les séries défavorables.

        Les paires JPY utilisent pip_size = 0.01 (au lieu de 0.0001).
        """
        stop_distance = abs(entry - stop_loss)
        if stop_distance == 0:
            logger.warning(f"Stop distance nul pour {pair} — position size = 0")
            return 0, 0.0

        risk_amount = account_balance * self.config.RISK_PER_TRADE

        # Taille brute basée uniquement sur le risque monétaire
        raw_units = risk_amount / stop_distance

        # Kelly Criterion — paramètres estimés sur la stratégie multi-confluence
        win_rate = 0.60
        win_loss_ratio = max(self.config.MIN_RISK_REWARD, 1.0)
        kelly_pct = win_rate - (1.0 - win_rate) / win_loss_ratio  # ≈ 0.44 pour 60% / 2.0

        # Quart-Kelly pour réduire la variance
        kelly_fraction = 0.25
        kelly_units = raw_units * kelly_fraction * max(0.1, kelly_pct)

        # Minimum entre brut et Kelly, mais plancher à 50% du brut pour éviter
        # des positions trop petites sur les bons setups
        final_units = min(raw_units, max(kelly_units, raw_units * 0.5))
        final_units = max(1, int(final_units))  # arrondi à l'unité entière (OANDA)

        actual_risk = final_units * stop_distance

        logger.debug(
            f"Position sizing {pair}: raw={int(raw_units)} units | "
            f"kelly={int(kelly_units)} units | final={final_units} units | "
            f"risk=${actual_risk:.2f}"
        )
        return final_units, actual_risk

    # ------------------------------------------------------------------
    # Mise à jour du P&L journalier
    # ------------------------------------------------------------------

    async def update_daily_pl(self, pl_amount: float) -> None:
        """
        Met à jour le P&L journalier après la clôture d'un trade.
        Déclenche automatiquement l'arrêt du bot si le seuil est dépassé.
        """
        self.daily_pl += pl_amount

        if self.daily_start_balance > 0:
            drawdown = abs(min(0.0, self.daily_pl)) / self.daily_start_balance
            if drawdown >= self.config.MAX_DAILY_DRAWDOWN and not self.bot_stopped_by_drawdown:
                self.bot_stopped_by_drawdown = True
                logger.warning(
                    f"DRAWDOWN JOURNALIER ATTEINT : {drawdown:.1%} "
                    f"(P&L jour: {self.daily_pl:.2f}) — bot arrêté jusqu'à demain"
                )

        logger.debug(f"P&L journalier mis à jour : {self.daily_pl:+.2f} (dernier: {pl_amount:+.2f})")

    # ------------------------------------------------------------------
    # Trailing stop
    # ------------------------------------------------------------------

    async def calculate_trailing_stop(
        self,
        trade: dict,
        current_price: float,
        atr: float,
    ) -> Optional[float]:
        """
        Calcule le nouveau niveau de trailing stop pour un trade ouvert.

        Logique :
        - Active le trailing uniquement quand le profit dépasse 1× ATR
        - Trail à 1.5× ATR derrière le prix courant
        - Ne remonte jamais le SL dans le sens défavorable

        Retourne None si le trailing stop ne doit pas être modifié.
        """
        if atr <= 0:
            return None

        entry = float(trade.get("price", 0))
        sl_order = trade.get("stopLossOrder")
        current_sl = float(sl_order["price"]) if sl_order else None
        direction = "BUY" if int(trade.get("currentUnits", 0)) > 0 else "SELL"

        if not current_sl or not entry:
            return None

        trail_distance = atr * 1.5
        activation_threshold = atr  # profit minimum pour activer le trailing

        if direction == "BUY":
            profit = current_price - entry
            if profit < activation_threshold:
                return None  # Pas encore assez de profit
            new_sl = round(current_price - trail_distance, 5)
            if new_sl > current_sl:  # Améliore le stop (remontée)
                return new_sl

        else:  # SELL
            profit = entry - current_price
            if profit < activation_threshold:
                return None
            new_sl = round(current_price + trail_distance, 5)
            if new_sl < current_sl:  # Améliore le stop (descente)
                return new_sl

        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_correlated_pairs(self, pair: str) -> List[str]:
        """Retourne la liste des paires corrélées à la paire donnée."""
        return _CORRELATIONS.get(pair, [])

    @property
    def current_drawdown_pct(self) -> float:
        """Drawdown journalier actuel en pourcentage."""
        if self.daily_start_balance <= 0:
            return 0.0
        return abs(min(0.0, self.daily_pl)) / self.daily_start_balance

    @property
    def is_trading_allowed(self) -> bool:
        """True si le bot est autorisé à prendre de nouveaux trades."""
        return not self.bot_stopped_by_drawdown
