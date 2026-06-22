"""
Alembic migration environment — async SQLAlchemy configuration.

This module is executed by Alembic when running migration commands such as
`alembic upgrade head` or `alembic revision --autogenerate`.

It supports both synchronous (offline) and asynchronous (online) migration
modes, and auto-detects all model metadata by importing every model module
before the migration target is resolved.
"""

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ---------------------------------------------------------------------------
# Import all models so Alembic can discover their metadata for autogenerate.
# Add new model imports here as the project grows.
# ---------------------------------------------------------------------------
# pylint: disable=wrong-import-position
try:
    # Import Base et tous les modèles pour la détection automatique par Alembic
    from database.database import Base  # noqa: F401

    from models.trade import Trade  # noqa: F401
    from models.signal import Signal  # noqa: F401
    from models.account import AccountSnapshot  # noqa: F401
except ImportError:
    # Pendant l'initialisation initiale, les modèles peuvent ne pas exister encore.
    from sqlalchemy.orm import DeclarativeBase

    class Base(DeclarativeBase):  # type: ignore[no-redef]
        pass


# ---------------------------------------------------------------------------
# Alembic Config object — gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging if present.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point Alembic at our model metadata for --autogenerate support.
target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Allow DATABASE_URL env var to override the value in alembic.ini so that
# Docker / CI pipelines never need to modify the ini file.
# ---------------------------------------------------------------------------
database_url = os.environ.get("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)


# ---------------------------------------------------------------------------
# Offline migration (no live DB connection — generates raw SQL)
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Emit SQL to stdout without connecting to the database.

    This is useful for generating a migration script to review before
    applying it in a production environment.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online migration (async — connects to the real DB and applies changes)
# ---------------------------------------------------------------------------

def do_run_migrations(connection: Connection) -> None:
    """Run migrations inside an active connection transaction."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        # Render item types in autogenerate diffs
        render_as_batch=True,  # Required for SQLite ALTER TABLE emulation
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations inside a sync wrapper."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online (async) migrations."""
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Dispatch: offline vs online
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
