"""
Modèle SQLAlchemy représentant un trade Forex.
Stocke toutes les informations d'un trade de son ouverture à sa clôture.
"""

import json
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    Text,
    Enum as SAEnum,
)
from sqlalchemy.orm import validates
import enum

from database.database import Base


class TradeDirection(str, enum.Enum):
    """Sens du trade."""
    BUY = "BUY"
    SELL = "SELL"


class TradeStatus(str, enum.Enum):
    """Statut du trade."""
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    PENDING = "PENDING"


class Trade(Base):
    """
    Représente un trade individuel dans le système.

    Chaque enregistrement correspond à une position ouverte ou fermée
    sur une paire de devises via OANDA.
    """

    __tablename__ = "trades"

    # ─── Identifiants ─────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    oanda_trade_id = Column(
        String(64),
        unique=True,
        nullable=True,
        index=True,
        comment="ID du trade côté OANDA",
    )

    # ─── Paramètres du trade ──────────────────────────────────────────────────
    pair = Column(
        String(10),
        nullable=False,
        index=True,
        comment="Paire de devises (ex: EUR_USD)",
    )
    direction = Column(
        SAEnum(TradeDirection),
        nullable=False,
        comment="Sens du trade: BUY ou SELL",
    )
    timeframe = Column(
        String(8),
        nullable=True,
        comment="Timeframe d'entrée (ex: H1, M15)",
    )
    lot_size = Column(
        Float,
        nullable=False,
        comment="Taille du lot (nombre d'unités)",
    )

    # ─── Prix ─────────────────────────────────────────────────────────────────
    entry_price = Column(Float, nullable=False, comment="Prix d'entrée")
    stop_loss = Column(Float, nullable=True, comment="Niveau stop-loss")
    take_profit = Column(Float, nullable=True, comment="Niveau take-profit")
    close_price = Column(Float, nullable=True, comment="Prix de clôture")

    # ─── Statut et timing ─────────────────────────────────────────────────────
    status = Column(
        SAEnum(TradeStatus),
        nullable=False,
        default=TradeStatus.OPEN,
        index=True,
        comment="Statut actuel du trade",
    )
    open_time = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="Horodatage d'ouverture (UTC)",
    )
    close_time = Column(
        DateTime,
        nullable=True,
        comment="Horodatage de clôture (UTC)",
    )

    # ─── Résultats financiers ─────────────────────────────────────────────────
    profit_loss = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L réalisé en devise du compte",
    )
    profit_loss_pips = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="P&L en pips",
    )
    risk_amount = Column(
        Float,
        nullable=True,
        comment="Montant risqué en devise du compte",
    )
    reward_amount = Column(
        Float,
        nullable=True,
        comment="Gain potentiel en devise du compte",
    )
    commission = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Commission prélevée par le broker",
    )
    swap = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Swap/rollover overnight",
    )

    # ─── Signaux et analyse ────────────────────────────────────────────────────
    confluence_score = Column(
        Float,
        nullable=True,
        comment="Score de confluence entre 0 et 100 au moment de l'entrée",
    )
    signals_used = Column(
        Text,
        nullable=True,
        comment="JSON: dictionnaire des indicateurs ayant déclenché le trade",
    )

    # ─── Métadonnées ──────────────────────────────────────────────────────────
    is_manual = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="True si le trade a été ouvert manuellement",
    )
    close_reason = Column(
        String(64),
        nullable=True,
        comment="Raison de clôture: TP, SL, MANUAL, BOT_STOP, etc.",
    )
    notes = Column(Text, nullable=True, comment="Notes libres sur le trade")

    # ─── Validators ───────────────────────────────────────────────────────────
    @validates("pair")
    def validate_pair(self, key: str, value: str) -> str:
        """Normalise la paire en majuscules avec underscore."""
        if value:
            return value.upper().replace("/", "_")
        raise ValueError("La paire de devises ne peut pas être vide")

    @validates("lot_size")
    def validate_lot_size(self, key: str, value: float) -> float:
        """Vérifie que la taille du lot est positive."""
        if value is not None and value <= 0:
            raise ValueError("La taille du lot doit être positive")
        return value

    # ─── Propriétés calculées ─────────────────────────────────────────────────
    @property
    def signals_dict(self) -> Dict[str, Any]:
        """Désérialise le JSON des signaux en dictionnaire."""
        if self.signals_used:
            try:
                return json.loads(self.signals_used)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @signals_dict.setter
    def signals_dict(self, value: Dict[str, Any]) -> None:
        """Sérialise le dictionnaire des signaux en JSON."""
        self.signals_used = json.dumps(value) if value else None

    @property
    def risk_reward_ratio(self) -> Optional[float]:
        """Calcule le ratio risque/récompense."""
        if self.risk_amount and self.reward_amount and self.risk_amount != 0:
            return round(self.reward_amount / self.risk_amount, 2)
        return None

    @property
    def duration_hours(self) -> Optional[float]:
        """Durée du trade en heures."""
        if self.open_time:
            end_time = self.close_time or datetime.utcnow()
            delta = end_time - self.open_time
            return round(delta.total_seconds() / 3600, 2)
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le modèle en dictionnaire sérialisable."""
        return {
            "id": self.id,
            "oanda_trade_id": self.oanda_trade_id,
            "pair": self.pair,
            "direction": self.direction.value if self.direction else None,
            "timeframe": self.timeframe,
            "lot_size": self.lot_size,
            "entry_price": self.entry_price,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "close_price": self.close_price,
            "status": self.status.value if self.status else None,
            "open_time": self.open_time.isoformat() if self.open_time else None,
            "close_time": self.close_time.isoformat() if self.close_time else None,
            "profit_loss": self.profit_loss,
            "profit_loss_pips": self.profit_loss_pips,
            "risk_amount": self.risk_amount,
            "reward_amount": self.reward_amount,
            "risk_reward_ratio": self.risk_reward_ratio,
            "commission": self.commission,
            "swap": self.swap,
            "confluence_score": self.confluence_score,
            "signals_used": self.signals_dict,
            "is_manual": self.is_manual,
            "close_reason": self.close_reason,
            "duration_hours": self.duration_hours,
            "notes": self.notes,
        }

    def __repr__(self) -> str:
        return (
            f"<Trade id={self.id} pair={self.pair} "
            f"direction={self.direction} status={self.status}>"
        )
