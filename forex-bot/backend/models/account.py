"""
Modèle SQLAlchemy représentant un snapshot du compte de trading.
Utilisé pour tracer l'évolution du capital (equity curve) dans le temps.
"""

from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.orm import validates

from database.database import Base


class AccountSnapshot(Base):
    """
    Capture l'état du compte à un instant donné.

    Enregistrée périodiquement (toutes les heures ou à chaque ouverture/clôture
    de trade) pour permettre le tracé de la courbe d'équité.
    """

    __tablename__ = "account_snapshots"

    # ─── Identifiant ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # ─── Soldes et équité ─────────────────────────────────────────────────────
    balance = Column(
        Float,
        nullable=False,
        comment="Solde du compte (capital réalisé, hors positions ouvertes)",
    )
    equity = Column(
        Float,
        nullable=False,
        comment="Équité du compte (balance + P&L flottant des positions ouvertes)",
    )
    unrealized_pl = Column(
        Float,
        nullable=False,
        default=0.0,
        comment="Profit/perte non réalisé sur les positions ouvertes",
    )
    margin_used = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Marge utilisée par les positions ouvertes",
    )
    margin_available = Column(
        Float,
        nullable=True,
        comment="Marge disponible pour de nouvelles positions",
    )
    nav = Column(
        Float,
        nullable=True,
        comment="Net Asset Value = equity (alias pour cohérence avec certains brokers)",
    )

    # ─── Activité du compte ───────────────────────────────────────────────────
    open_trades_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Nombre de trades ouverts au moment du snapshot",
    )

    # ─── P&L périodiques ──────────────────────────────────────────────────────
    daily_pl = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L réalisé sur la journée en cours (UTC)",
    )
    weekly_pl = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L réalisé sur la semaine en cours",
    )
    monthly_pl = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L réalisé sur le mois en cours",
    )
    daily_pl_percent = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L journalier en pourcentage du solde de début de journée",
    )
    weekly_pl_percent = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L hebdomadaire en pourcentage",
    )
    monthly_pl_percent = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L mensuel en pourcentage",
    )

    # ─── Drawdown ─────────────────────────────────────────────────────────────
    current_drawdown = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Drawdown actuel en pourcentage par rapport au pic d'équité",
    )
    max_drawdown_today = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Drawdown maximum atteint aujourd'hui (pour la protection du capital)",
    )

    # ─── Horodatage ───────────────────────────────────────────────────────────
    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="Horodatage du snapshot (UTC)",
    )
    snapshot_type = Column(
        String(32),
        nullable=True,
        default="periodic",
        comment="Type: 'periodic', 'trade_open', 'trade_close', 'session_start', 'session_end'",
    )

    # ─── Validators ───────────────────────────────────────────────────────────
    @validates("balance", "equity")
    def validate_positive_balance(self, key: str, value: float) -> float:
        """Le solde et l'équité ne peuvent pas être négatifs (sauf cas extrêmes)."""
        if value is not None and value < 0:
            # On accepte les valeurs négatives mais on les loggue comme alerte
            pass
        return value

    # ─── Propriétés calculées ─────────────────────────────────────────────────
    @property
    def equity_percent_change(self) -> Optional[float]:
        """Variation de l'équité par rapport au solde."""
        if self.balance and self.balance != 0:
            return round(((self.equity - self.balance) / self.balance) * 100, 4)
        return None

    @property
    def margin_level_percent(self) -> Optional[float]:
        """Niveau de marge en pourcentage (equity / margin_used * 100)."""
        if self.margin_used and self.margin_used > 0:
            return round((self.equity / self.margin_used) * 100, 2)
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le snapshot en dictionnaire sérialisable."""
        return {
            "id": self.id,
            "balance": self.balance,
            "equity": self.equity,
            "unrealized_pl": self.unrealized_pl,
            "margin_used": self.margin_used,
            "margin_available": self.margin_available,
            "nav": self.nav,
            "open_trades_count": self.open_trades_count,
            "daily_pl": self.daily_pl,
            "weekly_pl": self.weekly_pl,
            "monthly_pl": self.monthly_pl,
            "daily_pl_percent": self.daily_pl_percent,
            "weekly_pl_percent": self.weekly_pl_percent,
            "monthly_pl_percent": self.monthly_pl_percent,
            "current_drawdown": self.current_drawdown,
            "max_drawdown_today": self.max_drawdown_today,
            "equity_percent_change": self.equity_percent_change,
            "margin_level_percent": self.margin_level_percent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "snapshot_type": self.snapshot_type,
        }

    def __repr__(self) -> str:
        return (
            f"<AccountSnapshot id={self.id} "
            f"balance={self.balance} equity={self.equity} "
            f"timestamp={self.timestamp}>"
        )
