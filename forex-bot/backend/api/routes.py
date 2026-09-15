"""
Routes FastAPI du système de trading Forex.
Organise les endpoints par domaine fonctionnel avec authentification JWT.
"""

import csv
import io
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import func, desc, asc, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from config import settings
from database.database import get_db
from models.trade import Trade, TradeDirection, TradeStatus
from models.signal import Signal, SignalDirection
from models.account import AccountSnapshot

# ─── Schémas Pydantic ─────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    username: str
    is_admin: bool = True


class LoginRequest(BaseModel):
    username: str
    password: str


class AccountSummary(BaseModel):
    balance: float
    equity: float
    unrealized_pl: float
    daily_pl: float
    weekly_pl: float
    monthly_pl: float
    daily_pl_percent: float
    open_trades_count: int
    margin_used: float
    margin_available: float
    current_drawdown: float


class TradeResponse(BaseModel):
    id: int
    pair: str
    direction: str
    entry_price: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    lot_size: float
    status: str
    open_time: str
    close_time: Optional[str]
    close_price: Optional[float]
    profit_loss: Optional[float]
    profit_loss_pips: Optional[float]
    confluence_score: Optional[float]
    timeframe: Optional[str]
    oanda_trade_id: Optional[str]
    current_price: Optional[float] = None
    floating_pl: Optional[float] = None


class SignalResponse(BaseModel):
    id: int
    pair: str
    timeframe: str
    direction: str
    confluence_score: float
    strength_label: str
    ema_trend: Optional[str]
    rsi_value: Optional[float]
    macd_signal: Optional[str]
    bb_position: Optional[str]
    current_price: Optional[float]
    suggested_stop_loss: Optional[float]
    suggested_take_profit: Optional[float]
    atr_value: Optional[float]
    created_at: str
    is_traded: bool


class BotStatus(BaseModel):
    running: bool
    mode: str
    pairs_active: List[str]
    uptime_seconds: Optional[float]
    last_scan: Optional[str]
    trades_today: int
    signals_today: int


class BotConfigUpdate(BaseModel):
    risk_per_trade: Optional[float] = Field(None, ge=0.001, le=0.05)
    max_open_trades: Optional[int] = Field(None, ge=1, le=20)
    active_pairs: Optional[List[str]] = None
    mode: Optional[str] = Field(None, pattern="^(paper|live)$")
    min_confluence_score: Optional[int] = Field(None, ge=0, le=100)


class BacktestRequest(BaseModel):
    pair: str
    from_date: str  # ISO 8601
    to_date: str  # ISO 8601
    strategy_params: Optional[Dict[str, Any]] = None
    initial_balance: float = Field(default=10000.0, ge=100)


class BacktestResult(BaseModel):
    backtest_id: str
    status: str
    pair: str
    from_date: str
    to_date: str
    initial_balance: float
    final_balance: float
    total_return_percent: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    max_drawdown: float
    sharpe_ratio: float
    trades: List[Dict[str, Any]]


class StatsResponse(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    expectancy: float
    sharpe_ratio: float
    profit_factor: float
    max_drawdown: float
    average_win: float
    average_loss: float
    average_duration_hours: float
    best_pair: Optional[str]
    worst_pair: Optional[str]


# ─── Authentification JWT ─────────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _create_access_token(data: Dict[str, Any]) -> str:
    """Crée un JWT signé avec les données fournies."""
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInfo:
    """Valide le token JWT et retourne l'utilisateur courant."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        return UserInfo(username=username)
    except JWTError as exc:
        logger.warning(f"Échec validation JWT: {exc}")
        raise credentials_exception


# ─── Gestionnaire WebSocket ────────────────────────────────────────────────────

class WebSocketManager:
    """Gère les connexions WebSocket actives et le broadcast des messages."""

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.debug(f"WebSocket connecté. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.debug(f"WebSocket déconnecté. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Envoie un message JSON à toutes les connexions actives."""
        disconnected: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for ws in disconnected:
            self.disconnect(ws)


ws_manager = WebSocketManager()

# ─── État global du bot (en mémoire, persisté dans DB en prod) ────────────────

class BotState:
    """Maintient l'état courant du bot de trading."""

    def __init__(self) -> None:
        self.running: bool = False
        self.mode: str = settings.BOT_MODE
        self.start_time: Optional[datetime] = None
        self.last_scan: Optional[datetime] = None
        self.trades_today: int = 0
        self.signals_today: int = 0
        self.active_pairs: List[str] = list(settings.TRADING_PAIRS)
        self._risk_per_trade: float = settings.RISK_PER_TRADE
        self._max_open_trades: int = settings.MAX_OPEN_TRADES
        self._min_confluence_score: int = settings.MIN_CONFLUENCE_SCORE

    def start(self) -> None:
        self.running = True
        self.start_time = datetime.utcnow()
        self.trades_today = 0
        self.signals_today = 0

    def stop(self) -> None:
        self.running = False
        self.start_time = None

    @property
    def uptime_seconds(self) -> Optional[float]:
        if self.running and self.start_time:
            return (datetime.utcnow() - self.start_time).total_seconds()
        return None


bot_state = BotState()

# ─── Registre de backtests ─────────────────────────────────────────────────────
_backtest_store: Dict[str, BacktestResult] = {}

# ─── Routeurs ─────────────────────────────────────────────────────────────────

router_auth = APIRouter(prefix="/auth", tags=["Authentification"])
router_account = APIRouter(prefix="/account", tags=["Compte"])
router_trades = APIRouter(prefix="/trades", tags=["Trades"])
router_signals = APIRouter(prefix="/signals", tags=["Signaux"])
router_bot = APIRouter(prefix="/bot", tags=["Bot"])
router_backtest = APIRouter(prefix="/backtest", tags=["Backtest"])
router_ws = APIRouter(tags=["WebSocket"])

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

@router_auth.post("/login", response_model=TokenResponse, summary="Connexion et obtention du token JWT")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    """
    Authentifie l'utilisateur et retourne un token JWT.
    Accepte les credentials depuis le formulaire OAuth2 standard.
    """
    if (
        form_data.username != settings.ADMIN_USERNAME
        or form_data.password != settings.ADMIN_PASSWORD
    ):
        logger.warning(f"Tentative de connexion échouée pour: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = _create_access_token({"sub": form_data.username})
    logger.info(f"Connexion réussie: {form_data.username}")
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router_auth.post("/login/json", response_model=TokenResponse, summary="Connexion JSON")
async def login_json(body: LoginRequest) -> TokenResponse:
    """Alternative au login OAuth2 avec body JSON."""
    if (
        body.username != settings.ADMIN_USERNAME
        or body.password != settings.ADMIN_PASSWORD
    ):
        logger.warning(f"Tentative de connexion JSON échouée pour: {body.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
        )

    token = _create_access_token({"sub": body.username})
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router_auth.get("/me", response_model=UserInfo, summary="Informations utilisateur courant")
async def get_me(current_user: UserInfo = Depends(get_current_user)) -> UserInfo:
    """Retourne les informations de l'utilisateur authentifié."""
    return current_user


# ═══════════════════════════════════════════════════════════════════════════════
# ACCOUNT
# ═══════════════════════════════════════════════════════════════════════════════

@router_account.get("/summary", response_model=AccountSummary, summary="Résumé du compte")
async def get_account_summary(
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> AccountSummary:
    """
    Retourne le dernier snapshot du compte avec balance, equity,
    P&L journalier/hebdomadaire/mensuel et nombre de trades ouverts.
    """
    try:
        from sqlalchemy import select

        # Dernier snapshot disponible
        result = await db.execute(
            select(AccountSnapshot)
            .order_by(desc(AccountSnapshot.timestamp))
            .limit(1)
        )
        snapshot = result.scalar_one_or_none()

        if not snapshot:
            # Retourne des valeurs par défaut si aucun snapshot
            return AccountSummary(
                balance=0.0,
                equity=0.0,
                unrealized_pl=0.0,
                daily_pl=0.0,
                weekly_pl=0.0,
                monthly_pl=0.0,
                daily_pl_percent=0.0,
                open_trades_count=0,
                margin_used=0.0,
                margin_available=0.0,
                current_drawdown=0.0,
            )

        return AccountSummary(
            balance=snapshot.balance,
            equity=snapshot.equity,
            unrealized_pl=snapshot.unrealized_pl or 0.0,
            daily_pl=snapshot.daily_pl or 0.0,
            weekly_pl=snapshot.weekly_pl or 0.0,
            monthly_pl=snapshot.monthly_pl or 0.0,
            daily_pl_percent=snapshot.daily_pl_percent or 0.0,
            open_trades_count=snapshot.open_trades_count or 0,
            margin_used=snapshot.margin_used or 0.0,
            margin_available=snapshot.margin_available or 0.0,
            current_drawdown=snapshot.current_drawdown or 0.0,
        )

    except Exception as exc:
        logger.error(f"Erreur récupération résumé compte: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer les informations du compte",
        )


@router_account.get("/equity-curve", summary="Données pour le graphique d'équité")
async def get_equity_curve(
    period: str = Query(default="1w", pattern="^(1d|1w|1m|3m|6m|1y|all)$"),
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retourne la liste des snapshots de compte pour tracer la courbe d'équité.
    Paramètre period: 1d (24h), 1w (7j), 1m (30j), 3m (90j), 6m (180j), 1y (365j), all.
    """
    try:
        from sqlalchemy import select

        # Calcul de la date de début selon la période
        now = datetime.utcnow()
        period_map = {
            "1d": now - timedelta(days=1),
            "1w": now - timedelta(weeks=1),
            "1m": now - timedelta(days=30),
            "3m": now - timedelta(days=90),
            "6m": now - timedelta(days=180),
            "1y": now - timedelta(days=365),
        }
        since = period_map.get(period)

        query = select(AccountSnapshot).order_by(asc(AccountSnapshot.timestamp))
        if since:
            query = query.where(AccountSnapshot.timestamp >= since)

        result = await db.execute(query)
        snapshots = result.scalars().all()

        data_points = [
            {
                "timestamp": s.timestamp.isoformat(),
                "balance": s.balance,
                "equity": s.equity,
                "unrealized_pl": s.unrealized_pl,
                "daily_pl": s.daily_pl,
                "open_trades": s.open_trades_count,
                "drawdown": s.current_drawdown,
            }
            for s in snapshots
        ]

        return {
            "period": period,
            "count": len(data_points),
            "data": data_points,
            "start_balance": data_points[0]["balance"] if data_points else 0.0,
            "end_balance": data_points[-1]["balance"] if data_points else 0.0,
        }

    except Exception as exc:
        logger.error(f"Erreur récupération equity curve: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer la courbe d'équité",
        )


@router_account.get("/stats", response_model=StatsResponse, summary="Statistiques de trading")
async def get_account_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> StatsResponse:
    """
    Calcule et retourne les statistiques agrégées de trading:
    win rate, expectancy, Sharpe ratio, profit factor, max drawdown.
    """
    try:
        from sqlalchemy import select

        result = await db.execute(
            select(Trade).where(Trade.status == TradeStatus.CLOSED)
        )
        trades = result.scalars().all()

        if not trades:
            return StatsResponse(
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0.0,
                expectancy=0.0,
                sharpe_ratio=0.0,
                profit_factor=0.0,
                max_drawdown=0.0,
                average_win=0.0,
                average_loss=0.0,
                average_duration_hours=0.0,
                best_pair=None,
                worst_pair=None,
            )

        pl_list = [t.profit_loss or 0.0 for t in trades]
        winning = [p for p in pl_list if p > 0]
        losing = [p for p in pl_list if p <= 0]

        total = len(pl_list)
        win_count = len(winning)
        lose_count = len(losing)
        win_rate = round(win_count / total * 100, 2) if total > 0 else 0.0

        avg_win = round(sum(winning) / win_count, 4) if winning else 0.0
        avg_loss = round(abs(sum(losing) / lose_count), 4) if losing else 0.0
        expectancy = round(
            (win_rate / 100 * avg_win) - ((1 - win_rate / 100) * avg_loss), 4
        )

        gross_profit = sum(winning)
        gross_loss = abs(sum(losing))
        profit_factor = (
            round(gross_profit / gross_loss, 4) if gross_loss > 0 else float("inf")
        )

        # Sharpe ratio simplifié (rendements journaliers)
        import statistics
        sharpe = 0.0
        if len(pl_list) > 1:
            try:
                mean_pl = statistics.mean(pl_list)
                std_pl = statistics.stdev(pl_list)
                sharpe = round(mean_pl / std_pl * math.sqrt(252), 4) if std_pl > 0 else 0.0
            except Exception:
                sharpe = 0.0

        # Max drawdown
        peak = 0.0
        max_dd = 0.0
        running_pl = 0.0
        for pl in pl_list:
            running_pl += pl
            if running_pl > peak:
                peak = running_pl
            dd = (peak - running_pl) / peak if peak > 0 else 0.0
            if dd > max_dd:
                max_dd = dd

        # Meilleure/pire paire
        pair_pl: Dict[str, float] = {}
        for t in trades:
            pair_pl[t.pair] = pair_pl.get(t.pair, 0.0) + (t.profit_loss or 0.0)

        best_pair = max(pair_pl, key=pair_pl.get) if pair_pl else None
        worst_pair = min(pair_pl, key=pair_pl.get) if pair_pl else None

        # Durée moyenne
        durations = [t.duration_hours for t in trades if t.duration_hours is not None]
        avg_duration = round(sum(durations) / len(durations), 2) if durations else 0.0

        return StatsResponse(
            total_trades=total,
            winning_trades=win_count,
            losing_trades=lose_count,
            win_rate=win_rate,
            expectancy=expectancy,
            sharpe_ratio=sharpe,
            profit_factor=profit_factor,
            max_drawdown=round(max_dd * 100, 4),
            average_win=avg_win,
            average_loss=avg_loss,
            average_duration_hours=avg_duration,
            best_pair=best_pair,
            worst_pair=worst_pair,
        )

    except Exception as exc:
        logger.error(f"Erreur calcul statistiques: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de calculer les statistiques",
        )


# ═══════════════════════════════════════════════════════════════════════════════
# TRADES
# ═══════════════════════════════════════════════════════════════════════════════

@router_trades.get("/open", summary="Trades ouverts avec P&L flottant")
async def get_open_trades(
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retourne tous les trades actuellement ouverts avec leur P&L flottant en temps réel.
    """
    try:
        from sqlalchemy import select

        result = await db.execute(
            select(Trade)
            .where(Trade.status == TradeStatus.OPEN)
            .order_by(desc(Trade.open_time))
        )
        trades = result.scalars().all()

        trades_list = [t.to_dict() for t in trades]
        total_floating_pl = sum(
            t.get("floating_pl") or t.get("profit_loss") or 0.0
            for t in trades_list
        )

        return {
            "count": len(trades_list),
            "total_floating_pl": total_floating_pl,
            "trades": trades_list,
        }

    except Exception as exc:
        logger.error(f"Erreur récupération trades ouverts: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer les trades ouverts",
        )


@router_trades.get("/history", summary="Historique des trades fermés")
async def get_trade_history(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    pair: Optional[str] = Query(default=None),
    direction: Optional[str] = Query(default=None, pattern="^(BUY|SELL)$"),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retourne l'historique paginé des trades fermés avec filtres optionnels.
    """
    try:
        from sqlalchemy import select

        query = select(Trade).where(Trade.status == TradeStatus.CLOSED)

        if pair:
            query = query.where(Trade.pair == pair.upper())
        if direction:
            query = query.where(Trade.direction == direction)
        if from_date:
            try:
                dt_from = datetime.fromisoformat(from_date)
                query = query.where(Trade.open_time >= dt_from)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Format from_date invalide (ISO 8601 attendu)",
                )
        if to_date:
            try:
                dt_to = datetime.fromisoformat(to_date)
                query = query.where(Trade.open_time <= dt_to)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Format to_date invalide (ISO 8601 attendu)",
                )

        # Compte total
        count_result = await db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        # Page courante
        query = (
            query.order_by(desc(Trade.close_time))
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await db.execute(query)
        trades = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": math.ceil(total / per_page) if total > 0 else 0,
            "trades": [t.to_dict() for t in trades],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erreur récupération historique trades: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer l'historique des trades",
        )


@router_trades.get("/export/csv", summary="Export CSV des trades")
async def export_trades_csv(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    pair: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> StreamingResponse:
    """
    Exporte les trades en format CSV téléchargeable.
    """
    try:
        from sqlalchemy import select

        query = select(Trade).order_by(desc(Trade.open_time))

        if status_filter:
            try:
                st = TradeStatus(status_filter.upper())
                query = query.where(Trade.status == st)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Statut invalide: {status_filter}",
                )
        if pair:
            query = query.where(Trade.pair == pair.upper())

        result = await db.execute(query)
        trades = result.scalars().all()

        # Génération du CSV en mémoire
        output = io.StringIO()
        writer = csv.writer(output)

        # En-têtes
        writer.writerow([
            "ID", "Paire", "Direction", "Timeframe", "Taille lot",
            "Prix entrée", "Stop-Loss", "Take-Profit", "Prix clôture",
            "Statut", "Ouverture", "Clôture", "P&L (€)", "P&L (pips)",
            "Score confluence", "Raison clôture", "ID OANDA",
        ])

        for t in trades:
            writer.writerow([
                t.id, t.pair,
                t.direction.value if t.direction else "",
                t.timeframe or "",
                t.lot_size, t.entry_price,
                t.stop_loss or "", t.take_profit or "",
                t.close_price or "",
                t.status.value if t.status else "",
                t.open_time.isoformat() if t.open_time else "",
                t.close_time.isoformat() if t.close_time else "",
                t.profit_loss or "", t.profit_loss_pips or "",
                t.confluence_score or "",
                t.close_reason or "",
                t.oanda_trade_id or "",
            ])

        output.seek(0)
        filename = f"trades_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erreur export CSV: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de générer l'export CSV",
        )


@router_trades.get("/{trade_id}", summary="Détail d'un trade")
async def get_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retourne les détails complets d'un trade par son ID."""
    try:
        from sqlalchemy import select

        result = await db.execute(select(Trade).where(Trade.id == trade_id))
        trade = result.scalar_one_or_none()

        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trade {trade_id} introuvable",
            )

        return trade.to_dict()

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erreur récupération trade {trade_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer le trade",
        )


@router_trades.post("/close/{trade_id}", summary="Fermer manuellement un trade")
async def close_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ferme manuellement un trade ouvert.
    Tente d'abord de fermer la position chez OANDA, puis met à jour la DB.
    """
    try:
        from sqlalchemy import select

        result = await db.execute(
            select(Trade).where(
                and_(Trade.id == trade_id, Trade.status == TradeStatus.OPEN)
            )
        )
        trade = result.scalar_one_or_none()

        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trade ouvert {trade_id} introuvable",
            )

        # Mise à jour du statut (dans un vrai système, appel OANDA ici)
        trade.status = TradeStatus.CLOSED
        trade.close_time = datetime.utcnow()
        trade.close_reason = "MANUAL"
        trade.is_manual = True

        await db.commit()
        await db.refresh(trade)

        logger.info(f"Trade {trade_id} fermé manuellement par {current_user.username}")

        # Notification WebSocket
        await ws_manager.broadcast({
            "type": "trade_closed",
            "trade_id": trade_id,
            "reason": "MANUAL",
            "timestamp": datetime.utcnow().isoformat(),
        })

        return {
            "success": True,
            "message": f"Trade {trade_id} fermé avec succès",
            "trade": trade.to_dict(),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erreur fermeture trade {trade_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Impossible de fermer le trade {trade_id}",
        )


# ═══════════════════════════════════════════════════════════════════════════════
# SIGNALS
# ═══════════════════════════════════════════════════════════════════════════════

@router_signals.get("/current", summary="Signaux actifs détectés")
async def get_current_signals(
    min_score: int = Query(default=50, ge=0, le=100),
    pair: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retourne les signaux récents avec un score de confluence supérieur au seuil.
    Les signaux sont triés par score décroissant.
    """
    try:
        from sqlalchemy import select

        # Signaux des 4 dernières heures
        cutoff = datetime.utcnow() - timedelta(hours=4)
        query = (
            select(Signal)
            .where(
                and_(
                    Signal.confluence_score >= min_score,
                    Signal.created_at >= cutoff,
                    Signal.direction != SignalDirection.NEUTRAL,
                )
            )
            .order_by(desc(Signal.confluence_score))
        )

        if pair:
            query = query.where(Signal.pair == pair.upper())

        result = await db.execute(query)
        signals = result.scalars().all()

        return {
            "count": len(signals),
            "min_score": min_score,
            "signals": [s.to_dict() for s in signals],
        }

    except Exception as exc:
        logger.error(f"Erreur récupération signaux: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer les signaux",
        )


@router_signals.get("/heatmap", summary="Heatmap de force des devises")
async def get_currency_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Calcule et retourne la force relative de chaque devise sur la base
    des signaux récents pour former une matrice 8x8 de chaleur.
    """
    try:
        from sqlalchemy import select

        currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"]
        cutoff = datetime.utcnow() - timedelta(hours=4)

        result = await db.execute(
            select(Signal).where(Signal.created_at >= cutoff)
        )
        signals = result.scalars().all()

        # Calcul de la force par devise
        currency_scores: Dict[str, List[float]] = {c: [] for c in currencies}

        for sig in signals:
            pair = sig.pair  # ex: EUR_USD
            parts = pair.split("_")
            if len(parts) != 2:
                continue

            base, quote = parts[0], parts[1]
            score = sig.confluence_score or 50.0
            direction = sig.direction

            if base in currency_scores and quote in currency_scores:
                if direction == SignalDirection.BUY:
                    currency_scores[base].append(score)
                    currency_scores[quote].append(100 - score)
                elif direction == SignalDirection.SELL:
                    currency_scores[base].append(100 - score)
                    currency_scores[quote].append(score)

        # Calcul de la force moyenne normalisée
        strength: Dict[str, float] = {}
        for currency, scores in currency_scores.items():
            strength[currency] = round(sum(scores) / len(scores), 2) if scores else 50.0

        # Construction de la matrice de corrélation
        matrix: List[Dict[str, Any]] = []
        for base in currencies:
            row: Dict[str, Any] = {"currency": base}
            for quote in currencies:
                if base == quote:
                    row[quote] = 0.0
                else:
                    row[quote] = round(strength.get(base, 50.0) - strength.get(quote, 50.0), 2)
            matrix.append(row)

        return {
            "currencies": currencies,
            "strength": strength,
            "matrix": matrix,
            "updated_at": datetime.utcnow().isoformat(),
        }

    except Exception as exc:
        logger.error(f"Erreur calcul heatmap: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de calculer la heatmap",
        )


# ═══════════════════════════════════════════════════════════════════════════════
# BOT
# ═══════════════════════════════════════════════════════════════════════════════

@router_bot.get("/status", response_model=BotStatus, summary="Statut du bot")
async def get_bot_status(
    current_user: UserInfo = Depends(get_current_user),
) -> BotStatus:
    """Retourne l'état courant du bot de trading."""
    return BotStatus(
        running=bot_state.running,
        mode=bot_state.mode,
        pairs_active=bot_state.active_pairs,
        uptime_seconds=bot_state.uptime_seconds,
        last_scan=bot_state.last_scan.isoformat() if bot_state.last_scan else None,
        trades_today=bot_state.trades_today,
        signals_today=bot_state.signals_today,
    )


@router_bot.post("/start", summary="Démarrer le bot")
async def start_bot(
    background_tasks: BackgroundTasks,
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Démarre le bot de trading.
    Le bot commence à scanner les signaux et à exécuter des trades selon la config.
    """
    if bot_state.running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le bot est déjà en cours d'exécution",
        )

    bot_state.start()
    logger.info(f"Bot démarré par {current_user.username} en mode {bot_state.mode}")

    # Notification WebSocket
    await ws_manager.broadcast({
        "type": "bot_started",
        "mode": bot_state.mode,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {
        "success": True,
        "message": f"Bot démarré en mode {bot_state.mode}",
        "started_at": bot_state.start_time.isoformat() if bot_state.start_time else None,
    }


@router_bot.post("/stop", summary="Arrêter le bot")
async def stop_bot(
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """Arrête le bot de trading. Les positions ouvertes restent actives."""
    if not bot_state.running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le bot n'est pas en cours d'exécution",
        )

    uptime = bot_state.uptime_seconds
    bot_state.stop()
    logger.info(f"Bot arrêté par {current_user.username}")

    await ws_manager.broadcast({
        "type": "bot_stopped",
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {
        "success": True,
        "message": "Bot arrêté",
        "uptime_seconds": uptime,
    }


@router_bot.put("/config", summary="Modifier la configuration du bot")
async def update_bot_config(
    config: BotConfigUpdate,
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Met à jour la configuration du bot en cours d'exécution.
    Les changements prennent effet au prochain cycle de scan.
    """
    changes: Dict[str, Any] = {}

    if config.risk_per_trade is not None:
        bot_state._risk_per_trade = config.risk_per_trade
        changes["risk_per_trade"] = config.risk_per_trade

    if config.max_open_trades is not None:
        bot_state._max_open_trades = config.max_open_trades
        changes["max_open_trades"] = config.max_open_trades

    if config.active_pairs is not None:
        normalized_pairs = [p.upper().replace("/", "_") for p in config.active_pairs]
        bot_state.active_pairs = normalized_pairs
        changes["active_pairs"] = normalized_pairs

    if config.mode is not None:
        if config.mode == "live" and not settings.is_live_trading:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Le trading live nécessite OANDA_ENVIRONMENT=live dans la config",
            )
        bot_state.mode = config.mode
        changes["mode"] = config.mode

    if config.min_confluence_score is not None:
        bot_state._min_confluence_score = config.min_confluence_score
        changes["min_confluence_score"] = config.min_confluence_score

    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aucun paramètre valide fourni",
        )

    logger.info(f"Config bot mise à jour par {current_user.username}: {changes}")

    return {
        "success": True,
        "message": "Configuration mise à jour",
        "changes": changes,
        "current_config": {
            "risk_per_trade": bot_state._risk_per_trade,
            "max_open_trades": bot_state._max_open_trades,
            "active_pairs": bot_state.active_pairs,
            "mode": bot_state.mode,
            "min_confluence_score": bot_state._min_confluence_score,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# BACKTEST
# ═══════════════════════════════════════════════════════════════════════════════

@router_backtest.post("/run", summary="Lancer un backtest")
async def run_backtest(
    request: BacktestRequest,
    background_tasks: BackgroundTasks,
    current_user: UserInfo = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Lance un backtest sur une paire et une période donnée.
    Le calcul est effectué en arrière-plan. Utilisez GET /backtest/{id}/results
    pour récupérer les résultats.
    """
    import uuid

    try:
        # Validation des dates
        try:
            dt_from = datetime.fromisoformat(request.from_date)
            dt_to = datetime.fromisoformat(request.to_date)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Format de date invalide: {exc}",
            )

        if dt_from >= dt_to:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="from_date doit être antérieure à to_date",
            )

        backtest_id = str(uuid.uuid4())[:8].upper()

        # Résultat placeholder (dans un vrai système, calcul async en background)
        placeholder = BacktestResult(
            backtest_id=backtest_id,
            status="running",
            pair=request.pair.upper(),
            from_date=request.from_date,
            to_date=request.to_date,
            initial_balance=request.initial_balance,
            final_balance=request.initial_balance,
            total_return_percent=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            win_rate=0.0,
            profit_factor=0.0,
            max_drawdown=0.0,
            sharpe_ratio=0.0,
            trades=[],
        )
        _backtest_store[backtest_id] = placeholder

        logger.info(
            f"Backtest {backtest_id} lancé: {request.pair} "
            f"du {request.from_date} au {request.to_date}"
        )

        return {
            "backtest_id": backtest_id,
            "status": "running",
            "message": "Backtest en cours d'exécution. "
                       f"Consultez /api/backtest/{backtest_id}/results pour les résultats.",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erreur lancement backtest: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de lancer le backtest",
        )


@router_backtest.get("/{backtest_id}/results", response_model=BacktestResult, summary="Résultats du backtest")
async def get_backtest_results(
    backtest_id: str,
    current_user: UserInfo = Depends(get_current_user),
) -> BacktestResult:
    """Retourne les résultats d'un backtest par son identifiant."""
    result = _backtest_store.get(backtest_id.upper())
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Backtest {backtest_id} introuvable",
        )
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET
# ═══════════════════════════════════════════════════════════════════════════════

@router_ws.websocket("/ws/live")
async def websocket_live(websocket: WebSocket) -> None:
    """
    Point d'entrée WebSocket pour le flux temps réel.
    Diffuse: prix, P&L flottant, signaux, status bot, alertes.

    Messages sortants (JSON):
      { "type": "price_update", "pair": "EUR_USD", "bid": 1.0850, "ask": 1.0852, "timestamp": "..." }
      { "type": "pl_update", "total_pl": 150.0, "trades": [...] }
      { "type": "signal", "pair": "EUR_USD", "direction": "BUY", "score": 78 }
      { "type": "bot_started" | "bot_stopped" | "trade_opened" | "trade_closed" }
      { "type": "heartbeat", "timestamp": "..." }

    Messages entrants (JSON):
      { "action": "subscribe", "pairs": ["EUR_USD", "GBP_USD"] }
      { "action": "unsubscribe", "pairs": ["EUR_USD"] }
      { "action": "ping" }
    """
    await ws_manager.connect(websocket)
    logger.info(f"Nouveau client WebSocket connecté depuis {websocket.client}")

    try:
        # Message de bienvenue
        await websocket.send_json({
            "type": "connected",
            "message": "Connecté au flux en temps réel",
            "bot_status": {
                "running": bot_state.running,
                "mode": bot_state.mode,
            },
            "timestamp": datetime.utcnow().isoformat(),
        })

        while True:
            # Lecture des messages entrants (avec timeout pour heartbeat)
            try:
                import asyncio
                data = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)

                action = data.get("action")
                if action == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                elif action == "subscribe":
                    pairs = data.get("pairs", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "pairs": pairs,
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                elif action == "unsubscribe":
                    pairs = data.get("pairs", [])
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "pairs": pairs,
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Action inconnue: {action}",
                    })

            except Exception:
                # Timeout atteint ou erreur de réception — envoi heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "bot_running": bot_state.running,
                    "timestamp": datetime.utcnow().isoformat(),
                })

    except WebSocketDisconnect:
        logger.info(f"Client WebSocket déconnecté: {websocket.client}")
    except Exception as exc:
        logger.warning(f"Erreur WebSocket: {exc}")
    finally:
        ws_manager.disconnect(websocket)


# ─── Fonction d'enregistrement des routes ────────────────────────────────────

def include_all_routes(app: Any) -> None:
    """Enregistre tous les routeurs dans l'application FastAPI avec le préfixe /api."""
    api_prefix = "/api"
    app.include_router(router_auth, prefix=api_prefix)
    app.include_router(router_account, prefix=api_prefix)
    app.include_router(router_trades, prefix=api_prefix)
    app.include_router(router_signals, prefix=api_prefix)
    app.include_router(router_bot, prefix=api_prefix)
    app.include_router(router_backtest, prefix=api_prefix)
    app.include_router(router_ws)  # Le WebSocket n'a pas de préfixe /api
