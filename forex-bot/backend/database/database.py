"""
Configuration de la base de données SQLAlchemy avec support asynchrone (aiosqlite).
Fournit le moteur, la session et les utilitaires d'initialisation.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool
from loguru import logger

from config import settings


class Base(DeclarativeBase):
    """Classe de base pour tous les modèles SQLAlchemy."""
    pass


# ─── Création du moteur async ──────────────────────────────────────────────────
def _build_engine():
    """Construit et retourne le moteur SQLAlchemy selon la configuration."""
    db_url = settings.DATABASE_URL

    # Options spécifiques à SQLite (aiosqlite)
    if "sqlite" in db_url:
        engine = create_async_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=settings.LOG_LEVEL == "DEBUG",
        )
        logger.info(f"Moteur SQLite (async) créé: {db_url}")
    else:
        # PostgreSQL ou autre base relationnelle
        engine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=settings.LOG_LEVEL == "DEBUG",
        )
        logger.info(f"Moteur de base de données (async) créé")

    return engine


engine = _build_engine()

# ─── Factory de sessions ───────────────────────────────────────────────────────
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─── Dependency injection FastAPI ─────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Générateur de sessions de base de données pour l'injection de dépendances FastAPI.

    Usage dans une route FastAPI:
        async def ma_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(f"Erreur de session DB, rollback effectué: {exc}")
            raise
        finally:
            await session.close()


# ─── Initialisation des tables ─────────────────────────────────────────────────
async def create_all() -> None:
    """
    Crée toutes les tables définies dans les modèles si elles n'existent pas.
    À appeler lors du démarrage de l'application.
    """
    try:
        # Import des modèles pour s'assurer qu'ils sont enregistrés dans Base.metadata
        from models.trade import Trade  # noqa: F401
        from models.signal import Signal  # noqa: F401
        from models.account import AccountSnapshot  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Tables de la base de données créées avec succès")
    except Exception as exc:
        logger.error(f"Échec de la création des tables: {exc}")
        raise


async def drop_all() -> None:
    """
    Supprime toutes les tables (DANGER: usage développement uniquement).
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.warning("Toutes les tables ont été supprimées")
    except Exception as exc:
        logger.error(f"Échec de la suppression des tables: {exc}")
        raise


async def close_engine() -> None:
    """Ferme proprement le moteur de base de données."""
    await engine.dispose()
    logger.info("Moteur de base de données fermé")
