"""
Configuration centrale du système de trading Forex automatisé.
Utilise Pydantic Settings pour la gestion des variables d'environnement.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import os


class Settings(BaseSettings):
    """Paramètres de configuration chargés depuis les variables d'environnement."""

    # ─── OANDA API ─────────────────────────────────────────────────────────────
    OANDA_API_KEY: str = Field(..., description="Clé API OANDA")
    OANDA_ACCOUNT_ID: str = Field(..., description="ID du compte OANDA")
    OANDA_ENVIRONMENT: str = Field(
        default="practice",
        description="Environnement OANDA: 'practice' ou 'live'",
    )

    @validator("OANDA_ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        if v not in ("practice", "live"):
            raise ValueError("OANDA_ENVIRONMENT doit être 'practice' ou 'live'")
        return v

    # ─── SÉCURITÉ ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = Field(
        default="changez-moi-en-production-avec-openssl-rand-hex-32",
        description="Clé secrète JWT",
    )
    ALGORITHM: str = Field(default="HS256", description="Algorithme JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440, description="Durée de validité du token JWT en minutes (24h)"
    )

    # Identifiants admin (à définir dans .env)
    ADMIN_USERNAME: str = Field(default="admin", description="Nom d'utilisateur admin")
    ADMIN_PASSWORD: str = Field(
        default="changez-moi", description="Mot de passe admin (hashé en bcrypt en prod)"
    )

    # ─── BASE DE DONNÉES ───────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./forex_bot.db",
        description="URL de connexion à la base de données",
    )

    # ─── REDIS (cache et pub/sub) ──────────────────────────────────────────────
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="URL de connexion Redis",
    )
    REDIS_ENABLED: bool = Field(
        default=False,
        description="Activer Redis (False = mode dégradé sans cache distribué)",
    )

    # ─── NOTIFICATIONS TELEGRAM ────────────────────────────────────────────────
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(
        default=None, description="Token du bot Telegram"
    )
    TELEGRAM_CHAT_ID: Optional[str] = Field(
        default=None, description="ID du chat Telegram pour les alertes"
    )
    TELEGRAM_ENABLED: bool = Field(default=False, description="Activer les alertes Telegram")

    # ─── NOTIFICATIONS EMAIL ───────────────────────────────────────────────────
    EMAIL_HOST: Optional[str] = Field(default=None, description="Serveur SMTP")
    EMAIL_PORT: int = Field(default=587, description="Port SMTP")
    EMAIL_USERNAME: Optional[str] = Field(default=None, description="Identifiant SMTP")
    EMAIL_PASSWORD: Optional[str] = Field(default=None, description="Mot de passe SMTP")
    EMAIL_FROM: Optional[str] = Field(default=None, description="Adresse expéditeur")
    EMAIL_TO: Optional[str] = Field(default=None, description="Adresse destinataire des alertes")
    EMAIL_ENABLED: bool = Field(default=False, description="Activer les alertes email")

    # ─── GESTION DU RISQUE ─────────────────────────────────────────────────────
    RISK_PER_TRADE: float = Field(
        default=0.015,
        ge=0.001,
        le=0.05,
        description="Risque par trade en fraction du capital (défaut: 1.5%)",
    )
    MAX_OPEN_TRADES: int = Field(
        default=4,
        ge=1,
        le=20,
        description="Nombre maximum de trades ouverts simultanément",
    )
    MAX_DAILY_DRAWDOWN: float = Field(
        default=0.05,
        ge=0.01,
        le=0.20,
        description="Drawdown journalier maximum avant arrêt du bot (défaut: 5%)",
    )
    MIN_CONFLUENCE_SCORE: int = Field(
        default=65,
        ge=0,
        le=100,
        description="Score de confluence minimum pour prendre un trade",
    )
    MAX_SPREAD_PIPS: float = Field(
        default=3.0,
        description="Spread maximum accepté en pips avant d'entrer en trade",
    )
    SLIPPAGE_PIPS: float = Field(
        default=1.0,
        description="Slippage estimé en pips pour les calculs",
    )

    # ─── PAIRES DE TRADING ─────────────────────────────────────────────────────
    TRADING_PAIRS: List[str] = Field(
        default=[
            "EUR_USD",
            "GBP_USD",
            "USD_JPY",
            "USD_CHF",
            "AUD_USD",
            "USD_CAD",
            "NZD_USD",
            "EUR_GBP",
        ],
        description="Liste des paires de devises à trader",
    )

    # ─── TIMEFRAMES ────────────────────────────────────────────────────────────
    TIMEFRAMES: List[str] = Field(
        default=["M15", "H1", "H4"],
        description="Timeframes utilisés pour l'analyse (notation OANDA)",
    )
    PRIMARY_TIMEFRAME: str = Field(
        default="H1",
        description="Timeframe principal pour les entrées",
    )
    HIGHER_TIMEFRAME: str = Field(
        default="H4",
        description="Timeframe supérieur pour le biais directionnel",
    )

    # ─── INDICATEURS TECHNIQUES ────────────────────────────────────────────────
    EMA_FAST: int = Field(default=20, description="Période EMA rapide")
    EMA_MEDIUM: int = Field(default=50, description="Période EMA médiane")
    EMA_SLOW: int = Field(default=200, description="Période EMA lente")
    RSI_PERIOD: int = Field(default=14, description="Période RSI")
    RSI_OVERBOUGHT: float = Field(default=70.0, description="Seuil RSI suracheté")
    RSI_OVERSOLD: float = Field(default=30.0, description="Seuil RSI survendu")
    MACD_FAST: int = Field(default=12, description="Période MACD rapide")
    MACD_SLOW: int = Field(default=26, description="Période MACD lente")
    MACD_SIGNAL: int = Field(default=9, description="Période signal MACD")
    BB_PERIOD: int = Field(default=20, description="Période Bandes de Bollinger")
    BB_STD: float = Field(default=2.0, description="Écart-type Bandes de Bollinger")
    ATR_PERIOD: int = Field(default=14, description="Période ATR")
    ATR_MULTIPLIER_SL: float = Field(
        default=1.5, description="Multiplicateur ATR pour le Stop-Loss"
    )
    ATR_MULTIPLIER_TP: float = Field(
        default=2.5, description="Multiplicateur ATR pour le Take-Profit"
    )

    # ─── BOT ───────────────────────────────────────────────────────────────────
    AUTO_START: bool = Field(
        default=False, description="Démarrer le bot automatiquement au lancement"
    )
    BOT_MODE: str = Field(
        default="paper",
        description="Mode du bot: 'paper' (simulation) ou 'live' (réel)",
    )
    SCAN_INTERVAL_SECONDS: int = Field(
        default=60,
        description="Intervalle de scan des signaux en secondes",
    )
    CANDLES_HISTORY: int = Field(
        default=300,
        description="Nombre de bougies chargées pour les calculs",
    )

    # ─── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
        ],
        description="Origines autorisées pour CORS",
    )

    # ─── LOGGING ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = Field(default="INFO", description="Niveau de log (DEBUG/INFO/WARNING/ERROR)")
    LOG_FILE: str = Field(default="logs/forex_bot.log", description="Chemin du fichier de log")
    LOG_ROTATION: str = Field(default="10 MB", description="Taille de rotation des logs")
    LOG_RETENTION: str = Field(default="30 days", description="Durée de rétention des logs")

    # ─── RATE LIMITING ─────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60, description="Nombre maximum de requêtes par minute par IP"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def oanda_base_url(self) -> str:
        """URL de base de l'API OANDA selon l'environnement."""
        if self.OANDA_ENVIRONMENT == "live":
            return "https://api-fxtrade.oanda.com"
        return "https://api-fxpractice.oanda.com"

    @property
    def oanda_stream_url(self) -> str:
        """URL de streaming OANDA selon l'environnement."""
        if self.OANDA_ENVIRONMENT == "live":
            return "https://stream-fxtrade.oanda.com"
        return "https://stream-fxpractice.oanda.com"

    @property
    def is_live_trading(self) -> bool:
        """Vérifie si le trading réel est activé."""
        return self.OANDA_ENVIRONMENT == "live" and self.BOT_MODE == "live"


# Instance singleton de la configuration
settings = Settings()
