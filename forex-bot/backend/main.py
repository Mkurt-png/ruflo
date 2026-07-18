"""
Point d'entrée de l'application FastAPI du système de trading Forex automatisé.
Configure CORS, middleware, gestion d'erreurs, logging et démarrage du bot.
"""

import sys
import os
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings
from database.database import create_all, close_engine
from api.routes import include_all_routes, bot_state

# ─── Configuration du logging (loguru) ────────────────────────────────────────

def _configure_logging() -> None:
    """Configure loguru pour l'écriture structurée en console et fichier."""
    # Supprimer le handler par défaut
    logger.remove()

    # Console — format coloré
    logger.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    # Fichier — rotation et rétention configurables
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    logger.add(
        settings.LOG_FILE,
        level=settings.LOG_LEVEL,
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | "
            "{name}:{function}:{line} | {message}"
        ),
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        compression="zip",
        encoding="utf-8",
        backtrace=True,
        diagnose=False,  # Désactivé en fichier pour éviter les données sensibles
    )

    logger.info(
        f"Logging configuré — niveau: {settings.LOG_LEVEL}, fichier: {settings.LOG_FILE}"
    )


# ─── Rate Limiting (slowapi) ─────────────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)


# ─── Lifecycle de l'application ───────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gère le cycle de vie de l'application FastAPI.
    - Au démarrage: initialise la DB, démarre le bot si AUTO_START=true.
    - À l'arrêt: ferme les connexions proprement.
    """
    # ─── DÉMARRAGE ─────────────────────────────────────────────────
    logger.info("Démarrage de l'application Forex Bot API...")
    logger.info(f"Environnement: {settings.OANDA_ENVIRONMENT}")
    logger.info(f"Mode bot: {settings.BOT_MODE}")

    # Initialisation de la base de données
    try:
        await create_all()
        logger.info("Base de données initialisée avec succès")
    except Exception as exc:
        logger.critical(f"Échec initialisation base de données: {exc}")
        raise

    # Démarrage automatique du bot si configuré
    if settings.AUTO_START:
        try:
            bot_state.start()
            logger.info(
                f"Bot démarré automatiquement (AUTO_START=true) en mode {bot_state.mode}"
            )
        except Exception as exc:
            logger.error(f"Échec démarrage automatique du bot: {exc}")

    logger.info("Application prête à recevoir des requêtes")

    # ─── EXÉCUTION ─────────────────────────────────────────────────
    yield

    # ─── ARRÊT ────────────────────────────────────────────────────
    logger.info("Arrêt de l'application en cours...")

    if bot_state.running:
        bot_state.stop()
        logger.info("Bot arrêté proprement")

    try:
        await close_engine()
        logger.info("Connexion base de données fermée")
    except Exception as exc:
        logger.warning(f"Problème fermeture DB: {exc}")

    logger.info("Application arrêtée")


# ─── Création de l'application ────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Crée et configure l'application FastAPI."""

    _configure_logging()

    app = FastAPI(
        title="Forex Bot API",
        description=(
            "API REST du système de trading Forex automatisé. "
            "Fournit l'accès aux trades, signaux, statistiques de compte "
            "et contrôle du bot de trading via OANDA."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
        contact={
            "name": "Forex Bot",
            "url": "https://github.com/votre-repo/forex-bot",
        },
        license_info={
            "name": "MIT",
        },
        openapi_tags=[
            {"name": "Authentification", "description": "Connexion et gestion des tokens JWT"},
            {"name": "Compte", "description": "Solde, équité et statistiques du compte OANDA"},
            {"name": "Trades", "description": "Gestion des positions ouvertes et historique"},
            {"name": "Signaux", "description": "Signaux de trading et heatmap des devises"},
            {"name": "Bot", "description": "Contrôle et configuration du bot de trading"},
            {"name": "Backtest", "description": "Backtesting de stratégies sur données historiques"},
            {"name": "WebSocket", "description": "Flux temps réel: prix, P&L, alertes"},
        ],
    )

    # ─── Rate Limiter ─────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ─── CORS ─────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    # ─── Middleware de logging des requêtes ───────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next: Callable) -> Response:
        """Journalise chaque requête HTTP avec son temps de traitement."""
        start_time = time.perf_counter()
        request_id = request.headers.get("X-Request-ID", "")[:16]

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} "
                f"— ERREUR 500 ({duration_ms}ms): {exc}"
            )
            raise

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        log_level = "WARNING" if response.status_code >= 400 else "DEBUG"
        logger.log(
            log_level,
            f"[{request_id}] {request.method} {request.url.path} "
            f"— {response.status_code} ({duration_ms}ms) "
            f"[{request.client.host if request.client else 'unknown'}]",
        )

        response.headers["X-Process-Time-Ms"] = str(duration_ms)
        return response

    # ─── Gestion globale des erreurs ──────────────────────────────

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Formatte les erreurs HTTP en réponse JSON standardisée."""
        logger.warning(
            f"HTTPException {exc.status_code}: {exc.detail} "
            f"[{request.method} {request.url.path}]"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "status_code": exc.status_code,
                "detail": exc.detail,
                "path": str(request.url.path),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Formatte les erreurs de validation Pydantic en réponse lisible."""
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error.get("loc", []))
            errors.append({
                "field": field,
                "message": error.get("msg", ""),
                "type": error.get("type", ""),
            })

        logger.warning(
            f"Erreur de validation: {len(errors)} erreur(s) "
            f"[{request.method} {request.url.path}]"
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "status_code": 422,
                "detail": "Données invalides",
                "errors": errors,
                "path": str(request.url.path),
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Capture toutes les exceptions non gérées pour éviter les crashes."""
        logger.exception(
            f"Exception non gérée: {type(exc).__name__}: {exc} "
            f"[{request.method} {request.url.path}]"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "status_code": 500,
                "detail": "Erreur interne du serveur",
                "path": str(request.url.path),
            },
        )

    # ─── Routes ───────────────────────────────────────────────────

    # Health check (pas d'auth requise)
    @app.get(
        "/health",
        tags=["Monitoring"],
        summary="Vérification de l'état du service",
        response_description="État de santé de l'API",
    )
    async def health_check() -> JSONResponse:
        """
        Endpoint de santé pour les load balancers et systèmes de monitoring.
        Retourne 200 si l'API est opérationnelle.
        """
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "healthy",
                "service": "forex-bot-api",
                "version": "1.0.0",
                "environment": settings.OANDA_ENVIRONMENT,
                "bot_running": bot_state.running,
                "bot_mode": bot_state.mode,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
        )

    # Route racine de redirection vers la doc
    @app.get("/", include_in_schema=False)
    async def root() -> JSONResponse:
        """Redirige vers la documentation Swagger."""
        return JSONResponse(
            content={
                "message": "Forex Bot API v1.0.0",
                "docs": "/docs",
                "redoc": "/redoc",
                "health": "/health",
            }
        )

    # Enregistrement de toutes les routes API et WebSocket
    include_all_routes(app)

    logger.info(
        f"Application FastAPI créée — "
        f"{len(app.routes)} routes enregistrées"
    )

    return app


# ─── Instance de l'application ────────────────────────────────────────────────

app = create_app()


# ─── Point d'entrée pour exécution directe ────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    logger.info("Démarrage du serveur uvicorn en mode développement...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=False,  # Géré par notre middleware
    )
