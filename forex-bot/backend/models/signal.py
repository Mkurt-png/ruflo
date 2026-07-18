"""
Modèle SQLAlchemy représentant un signal de trading détecté par l'analyse technique.
Un signal correspond à une convergence d'indicateurs sur une paire/timeframe donné.
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


class SignalDirection(str, enum.Enum):
    """Sens du signal détecté."""
    BUY = "BUY"
    SELL = "SELL"
    NEUTRAL = "NEUTRAL"


class Signal(Base):
    """
    Représente un signal de trading généré par l'analyse technique multi-indicateurs.

    Le score de confluence agrège les signaux de plusieurs indicateurs
    pour produire une note de confiance entre 0 et 100.
    """

    __tablename__ = "signals"

    # ─── Identifiant ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # ─── Contexte du signal ───────────────────────────────────────────────────
    pair = Column(
        String(10),
        nullable=False,
        index=True,
        comment="Paire de devises (ex: EUR_USD)",
    )
    timeframe = Column(
        String(8),
        nullable=False,
        index=True,
        comment="Timeframe d'analyse (ex: H1, M15, H4)",
    )
    direction = Column(
        SAEnum(SignalDirection),
        nullable=False,
        comment="Direction du signal: BUY, SELL ou NEUTRAL",
    )

    # ─── Score de confluence ──────────────────────────────────────────────────
    confluence_score = Column(
        Float,
        nullable=False,
        default=0.0,
        comment="Score de confluence entre 0 et 100 (plus élevé = plus fiable)",
    )

    # ─── Données brutes des indicateurs ───────────────────────────────────────
    signals_data = Column(
        Text,
        nullable=True,
        comment="JSON: données complètes de tous les indicateurs calculés",
    )

    # ─── Indicateurs principaux (colonnes directes pour performances SQL) ─────
    ema_trend = Column(
        String(8),
        nullable=True,
        comment="Tendance EMA: BULLISH, BEARISH ou NEUTRAL",
    )
    rsi_value = Column(
        Float,
        nullable=True,
        comment="Valeur RSI au moment du signal (0-100)",
    )
    macd_signal = Column(
        String(16),
        nullable=True,
        comment="Signal MACD: BULLISH_CROSS, BEARISH_CROSS, BULLISH, BEARISH, NEUTRAL",
    )
    bb_position = Column(
        String(16),
        nullable=True,
        comment="Position par rapport aux Bandes de Bollinger: ABOVE, BELOW, INSIDE, UPPER, LOWER",
    )

    # ─── Niveaux clés ─────────────────────────────────────────────────────────
    support_level = Column(
        Float,
        nullable=True,
        comment="Niveau de support le plus proche",
    )
    resistance_level = Column(
        Float,
        nullable=True,
        comment="Niveau de résistance le plus proche",
    )
    atr_value = Column(
        Float,
        nullable=True,
        comment="Valeur ATR (Average True Range) pour le dimensionnement des stops",
    )
    current_price = Column(
        Float,
        nullable=True,
        comment="Prix de marché au moment de la génération du signal",
    )
    suggested_stop_loss = Column(
        Float,
        nullable=True,
        comment="Stop-loss suggéré basé sur l'ATR",
    )
    suggested_take_profit = Column(
        Float,
        nullable=True,
        comment="Take-profit suggéré basé sur l'ATR",
    )

    # ─── Indicateurs supplémentaires ──────────────────────────────────────────
    stochastic_k = Column(Float, nullable=True, comment="Valeur Stochastique %K")
    stochastic_d = Column(Float, nullable=True, comment="Valeur Stochastique %D")
    adx_value = Column(Float, nullable=True, comment="Valeur ADX (force de tendance)")
    volume_signal = Column(
        String(16),
        nullable=True,
        comment="Signal de volume: HIGH, NORMAL, LOW",
    )

    # ─── Statut et métadonnées ────────────────────────────────────────────────
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="Horodatage de création du signal (UTC)",
    )
    is_traded = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="True si ce signal a donné lieu à un trade",
    )
    trade_id = Column(
        Integer,
        nullable=True,
        comment="ID du trade généré par ce signal (si is_traded=True)",
    )
    expiry_time = Column(
        DateTime,
        nullable=True,
        comment="Horodatage d'expiration du signal (validité limitée dans le temps)",
    )

    # ─── Validators ───────────────────────────────────────────────────────────
    @validates("pair")
    def validate_pair(self, key: str, value: str) -> str:
        """Normalise la paire en majuscules."""
        if value:
            return value.upper().replace("/", "_")
        raise ValueError("La paire ne peut pas être vide")

    @validates("confluence_score")
    def validate_score(self, key: str, value: float) -> float:
        """S'assure que le score est dans la plage [0, 100]."""
        if value is not None:
            return max(0.0, min(100.0, float(value)))
        return 0.0

    # ─── Propriétés calculées ─────────────────────────────────────────────────
    @property
    def signals_dict(self) -> Dict[str, Any]:
        """Désérialise le JSON des données de signaux en dictionnaire."""
        if self.signals_data:
            try:
                return json.loads(self.signals_data)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @signals_dict.setter
    def signals_dict(self, value: Dict[str, Any]) -> None:
        """Sérialise le dictionnaire en JSON."""
        self.signals_data = json.dumps(value) if value else None

    @property
    def is_valid(self) -> bool:
        """Vérifie si le signal est encore valide (non expiré)."""
        if self.expiry_time:
            return datetime.utcnow() < self.expiry_time
        return True

    @property
    def strength_label(self) -> str:
        """Retourne un label lisible de la force du signal."""
        score = self.confluence_score or 0.0
        if score >= 85:
            return "TRÈS FORT"
        elif score >= 70:
            return "FORT"
        elif score >= 55:
            return "MODÉRÉ"
        elif score >= 40:
            return "FAIBLE"
        return "TRÈS FAIBLE"

    def to_dict(self) -> Dict[str, Any]:
        """Convertit le modèle en dictionnaire sérialisable."""
        return {
            "id": self.id,
            "pair": self.pair,
            "timeframe": self.timeframe,
            "direction": self.direction.value if self.direction else None,
            "confluence_score": self.confluence_score,
            "strength_label": self.strength_label,
            "ema_trend": self.ema_trend,
            "rsi_value": self.rsi_value,
            "macd_signal": self.macd_signal,
            "bb_position": self.bb_position,
            "support_level": self.support_level,
            "resistance_level": self.resistance_level,
            "atr_value": self.atr_value,
            "current_price": self.current_price,
            "suggested_stop_loss": self.suggested_stop_loss,
            "suggested_take_profit": self.suggested_take_profit,
            "stochastic_k": self.stochastic_k,
            "stochastic_d": self.stochastic_d,
            "adx_value": self.adx_value,
            "volume_signal": self.volume_signal,
            "signals_data": self.signals_dict,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_traded": self.is_traded,
            "trade_id": self.trade_id,
            "is_valid": self.is_valid,
        }

    def __repr__(self) -> str:
        return (
            f"<Signal id={self.id} pair={self.pair} "
            f"tf={self.timeframe} dir={self.direction} "
            f"score={self.confluence_score}>"
        )
