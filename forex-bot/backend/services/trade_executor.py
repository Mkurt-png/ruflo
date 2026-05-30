"""
Exécuteur de trades - Interface entre le signal engine et OANDA.
Gère l'envoi des ordres, le monitoring des positions ouvertes,
le trailing stop, le break-even et la synchronisation DB.
"""
import asyncio
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy import select


class TradeExecutor:
    """Exécute les trades et gère les positions ouvertes."""

    def __init__(self, oanda_client, risk_manager, db_session, config, notification_service=None):
        self.client = oanda_client
        self.risk_manager = risk_manager
        self.db = db_session
        self.config = config
        self.notif = notification_service
        self._monitoring = False
        self._check_interval = 30  # secondes entre chaque cycle de monitoring

    # ------------------------------------------------------------------
    # Exécution d'un signal
    # ------------------------------------------------------------------

    async def execute_signal(self, signal) -> Optional[dict]:
        """
        Exécute un signal de trading si toutes les conditions sont remplies.

        Étapes :
        1. Récupération de l'état du compte
        2. Validation des règles de risque (RiskManager)
        3. Envoi de l'ordre de marché à OANDA
        4. Persistance en base de données
        5. Notification (Telegram / Email)
        """
        try:
            # ── 1. État du compte ────────────────────────────────────────────
            account = await self.client.get_account_summary()
            balance = float(account["balance"])
            open_trades = await self.client.get_open_trades()

            # ── 2. Validation risque ─────────────────────────────────────────
            risk_check = await self.risk_manager.validate_new_trade(
                signal, balance, open_trades
            )
            if not risk_check.approved:
                logger.info(
                    f"Trade refusé — {signal.pair} {signal.direction}: {risk_check.reason}"
                )
                return None

            # ── 3. Envoi ordre OANDA ─────────────────────────────────────────
            units = risk_check.recommended_lot_size
            if signal.direction == "SELL":
                units = -units

            response = await self.client.create_market_order(
                instrument=signal.pair,
                units=int(units),
                stop_loss=signal.stop_loss,
                take_profit=signal.take_profit,
            )

            if "orderFillTransaction" not in response:
                logger.error(
                    f"Ordre non exécuté pour {signal.pair}: {response}"
                )
                return None

            fill = response["orderFillTransaction"]
            oanda_trade_id = fill.get("tradeOpened", {}).get("tradeID")

            if not oanda_trade_id:
                logger.error(f"tradeID manquant dans la réponse OANDA: {fill}")
                return None

            # ── 4. Persistance DB ────────────────────────────────────────────
            trade_record = await self._save_trade(signal, fill, risk_check, oanda_trade_id)

            # ── 5. Notification ──────────────────────────────────────────────
            if self.notif:
                await self.notif.send_trade_opened(trade_record, signal)

            logger.info(
                f"Trade ouvert : {signal.pair} {signal.direction} "
                f"@ {fill['price']} | SL: {signal.stop_loss} | TP: {signal.take_profit} "
                f"| Units: {units} | ID: {oanda_trade_id} "
                f"| Score: {signal.confluence_score:.0f}/100"
            )
            return trade_record

        except Exception as e:
            logger.exception(f"Erreur inattendue lors de l'exécution du trade {signal.pair}: {e}")
            return None

    # ------------------------------------------------------------------
    # Monitoring des positions ouvertes
    # ------------------------------------------------------------------

    async def start_monitoring(self) -> None:
        """Lance la boucle de monitoring des positions ouvertes en tâche de fond."""
        self._monitoring = True
        logger.info(
            f"Monitoring démarré — cycle toutes les {self._check_interval}s"
        )
        while self._monitoring:
            try:
                await self._monitor_open_positions()
            except Exception as e:
                logger.error(f"Erreur dans le cycle de monitoring: {e}")
            await asyncio.sleep(self._check_interval)

    async def stop_monitoring(self) -> None:
        """Arrête la boucle de monitoring."""
        self._monitoring = False
        logger.info("Monitoring arrêté")

    async def _monitor_open_positions(self) -> None:
        """
        Cycle de monitoring pour toutes les positions ouvertes :
        - Trailing stop (activé à +1 ATR de profit, trail à 1.5 ATR)
        - Break-even (SL déplacé à l'entrée à +1R de profit)
        - Mise à jour du P&L flottant en DB
        """
        open_trades = await self.client.get_open_trades()
        if not open_trades:
            return

        for trade in open_trades:
            trade_id = trade["id"]
            instrument = trade.get("instrument", "")

            try:
                current_price = await self._get_current_price(instrument)
                if current_price is None:
                    current_price = float(trade.get("price", 0))

                # Estimation ATR : 0.5% du prix courant comme proxy rapide
                # (en production, récupérer depuis le cache du service d'indicateurs)
                atr_estimate = current_price * 0.005

                # ── Trailing stop ────────────────────────────────────────────
                new_sl = await self.risk_manager.calculate_trailing_stop(
                    trade, current_price, atr_estimate
                )
                if new_sl is not None:
                    await self.client.modify_trade(trade_id, stop_loss=new_sl)
                    logger.info(
                        f"Trailing stop mis à jour : {instrument} | "
                        f"nouveau SL = {new_sl}"
                    )

                # ── Break-even ───────────────────────────────────────────────
                await self._check_breakeven(trade, current_price)

                # ── Mise à jour P&L flottant ─────────────────────────────────
                await self._update_trade_pl(trade)

            except Exception as e:
                logger.error(
                    f"Erreur monitoring trade {trade_id} ({instrument}): {e}"
                )

    async def _check_breakeven(self, trade: dict, current_price: float) -> None:
        """
        Déplace le SL au prix d'entrée (break-even) quand le profit
        atteint 1× le risque initial (1R).
        """
        try:
            sl_order = trade.get("stopLossOrder")
            if not sl_order:
                return

            entry = float(trade.get("price", 0))
            current_sl = float(sl_order["price"])
            direction = "BUY" if int(trade.get("currentUnits", 0)) > 0 else "SELL"
            initial_risk = abs(entry - current_sl)

            if direction == "BUY":
                profit = current_price - entry
                # Activer break-even à 1R de profit
                if profit >= initial_risk and current_sl < entry:
                    breakeven_sl = round(entry + 0.0002, 5)  # légèrement au-dessus pour couvrir spread
                    await self.client.modify_trade(trade["id"], stop_loss=breakeven_sl)
                    logger.info(
                        f"Break-even activé : {trade.get('instrument')} BUY | "
                        f"SL déplacé à {breakeven_sl}"
                    )
            else:
                profit = entry - current_price
                if profit >= initial_risk and current_sl > entry:
                    breakeven_sl = round(entry - 0.0002, 5)
                    await self.client.modify_trade(trade["id"], stop_loss=breakeven_sl)
                    logger.info(
                        f"Break-even activé : {trade.get('instrument')} SELL | "
                        f"SL déplacé à {breakeven_sl}"
                    )
        except Exception as e:
            logger.debug(f"Break-even check ignoré pour trade {trade.get('id')}: {e}")

    async def _get_current_price(self, instrument: str) -> Optional[float]:
        """
        Récupère le prix mid courant via l'API OANDA.
        Retourne None en cas d'erreur.
        """
        try:
            pricing = await self.client.get_pricing([instrument])
            if pricing and len(pricing) > 0:
                price_data = pricing[0]
                bid = float(price_data.get("bids", [{}])[0].get("price", 0))
                ask = float(price_data.get("asks", [{}])[0].get("price", 0))
                return round((bid + ask) / 2, 5) if bid and ask else None
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Fermeture manuelle
    # ------------------------------------------------------------------

    async def close_trade_manually(self, trade_id: str) -> dict:
        """
        Ferme manuellement un trade par son ID OANDA.
        Met à jour le statut en DB et le P&L journalier.
        """
        try:
            response = await self.client.close_trade(trade_id)
            fill = response.get("orderFillTransaction", {})
            pl = float(fill.get("pl", 0))

            async with self.db() as session:
                from backend.models.trade import Trade

                result = await session.execute(
                    select(Trade).where(Trade.oanda_trade_id == trade_id)
                )
                trade = result.scalar_one_or_none()

                if trade:
                    trade.status = "CLOSED"
                    trade.close_time = datetime.utcnow()
                    trade.close_price = float(fill.get("price", 0))
                    trade.profit_loss = pl
                    trade.close_reason = "MANUAL"
                    await session.commit()
                    logger.info(
                        f"Trade fermé manuellement : {trade_id} | "
                        f"P&L = {pl:+.2f}"
                    )
                else:
                    logger.warning(
                        f"Trade {trade_id} fermé chez OANDA mais introuvable en DB"
                    )

            await self.risk_manager.update_daily_pl(pl)

            if self.notif:
                trade_info = {"pair": fill.get("instrument", ""), "direction": ""}
                await self.notif.send_trade_closed(trade_info, pl)

            return fill

        except Exception as e:
            logger.error(f"Erreur lors de la fermeture manuelle du trade {trade_id}: {e}")
            raise

    async def close_all_trades(self, reason: str = "BOT_STOP") -> List[dict]:
        """
        Ferme toutes les positions ouvertes (utilisé lors de l'arrêt du bot
        ou en cas de drawdown journalier critique).
        """
        results = []
        try:
            open_trades = await self.client.get_open_trades()
            for trade in open_trades:
                try:
                    result = await self.close_trade_manually(trade["id"])
                    results.append(result)
                except Exception as e:
                    logger.error(f"Échec fermeture trade {trade['id']}: {e}")
            logger.info(
                f"{len(results)}/{len(open_trades)} trades fermés — raison: {reason}"
            )
        except Exception as e:
            logger.error(f"Erreur lors de la fermeture de toutes les positions: {e}")
        return results

    # ------------------------------------------------------------------
    # Persistance DB
    # ------------------------------------------------------------------

    async def _save_trade(
        self,
        signal,
        fill: dict,
        risk_check,
        oanda_trade_id: str,
    ) -> dict:
        """Persiste le trade en base de données après exécution chez OANDA."""
        from backend.models.trade import Trade

        trade = Trade(
            pair=signal.pair,
            direction=signal.direction,
            entry_price=float(fill["price"]),
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            lot_size=abs(int(fill.get("units", 0))),
            oanda_trade_id=oanda_trade_id,
            status="OPEN",
            open_time=datetime.utcnow(),
            confluence_score=signal.confluence_score,
            signals_used=json.dumps(signal.signals) if hasattr(signal, "signals") else None,
            timeframe=getattr(signal, "timeframe", "H1"),
            risk_amount=risk_check.risk_amount,
            reward_amount=risk_check.reward_amount,
            profit_loss=0.0,
        )

        async with self.db() as session:
            session.add(trade)
            await session.commit()
            await session.refresh(trade)

        return {
            "id": trade.id,
            "pair": trade.pair,
            "direction": trade.direction,
            "entry": trade.entry_price,
            "sl": trade.stop_loss,
            "tp": trade.take_profit,
            "lot_size": trade.lot_size,
            "oanda_trade_id": oanda_trade_id,
            "time": trade.open_time.isoformat(),
        }

    async def _update_trade_pl(self, oanda_trade: dict) -> None:
        """Met à jour le P&L flottant d'un trade ouvert en base de données."""
        try:
            unrealized_pl = float(oanda_trade.get("unrealizedPL", 0))
            trade_id = oanda_trade.get("id")

            async with self.db() as session:
                from backend.models.trade import Trade

                result = await session.execute(
                    select(Trade).where(Trade.oanda_trade_id == trade_id)
                )
                trade = result.scalar_one_or_none()
                if trade:
                    trade.profit_loss = unrealized_pl
                    await session.commit()
        except Exception as e:
            logger.debug(f"Mise à jour P&L flottant ignorée pour {oanda_trade.get('id')}: {e}")

    async def sync_closed_trades(self) -> int:
        """
        Synchronise les trades fermés côté OANDA avec la base de données locale.
        Utile au démarrage du bot pour rattraper les clôtures survenues hors session.
        Retourne le nombre de trades synchronisés.
        """
        count = 0
        try:
            from backend.models.trade import Trade

            async with self.db() as session:
                result = await session.execute(
                    select(Trade).where(Trade.status == "OPEN")
                )
                open_db_trades = result.scalars().all()

            if not open_db_trades:
                return 0

            oanda_open_ids = {
                t["id"] for t in await self.client.get_open_trades()
            }

            for trade in open_db_trades:
                if trade.oanda_trade_id and trade.oanda_trade_id not in oanda_open_ids:
                    # Trade fermé chez OANDA mais toujours OPEN en DB
                    try:
                        transaction = await self.client.get_trade_transactions(
                            trade.oanda_trade_id
                        )
                        close_tx = next(
                            (tx for tx in transaction if tx.get("type") == "ORDER_FILL"),
                            None,
                        )
                        async with self.db() as session:
                            result = await session.execute(
                                select(Trade).where(Trade.id == trade.id)
                            )
                            db_trade = result.scalar_one_or_none()
                            if db_trade:
                                db_trade.status = "CLOSED"
                                db_trade.close_time = datetime.utcnow()
                                if close_tx:
                                    db_trade.close_price = float(
                                        close_tx.get("price", 0)
                                    )
                                    db_trade.profit_loss = float(
                                        close_tx.get("pl", 0)
                                    )
                                    db_trade.close_reason = "SYNC"
                                await session.commit()
                                count += 1
                    except Exception as e:
                        logger.debug(
                            f"Impossible de récupérer les transactions pour {trade.oanda_trade_id}: {e}"
                        )

            if count:
                logger.info(f"Synchronisation DB : {count} trade(s) mis à jour")

        except Exception as e:
            logger.error(f"Erreur synchronisation trades fermés: {e}")

        return count
