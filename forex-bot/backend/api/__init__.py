"""
Package api — routes FastAPI du système de trading Forex.
"""

from api.routes import (
    include_all_routes,
    ws_manager,
    bot_state,
    get_current_user,
)

__all__ = [
    "include_all_routes",
    "ws_manager",
    "bot_state",
    "get_current_user",
]
