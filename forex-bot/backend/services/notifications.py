"""
Service de notifications multi-canal (Telegram + Email).
Envoie des alertes pour les trades ouverts/fermés, les alertes de risque,
les rapports journaliers et les changements de statut du bot.
"""
import asyncio
from datetime import datetime
from typing import Optional
import aiohttp
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from loguru import logger


class NotificationService:
    """
    Gère les notifications Telegram et Email du bot de trading.

    Les deux canaux sont optionnels et configurés via les variables
    d'environnement. Si un canal n'est pas configuré, les appels
    correspondants sont silencieusement ignorés.
    """

    def __init__(self, config):
        self.config = config
        self.telegram_enabled = bool(
            getattr(config, "TELEGRAM_BOT_TOKEN", None)
            and getattr(config, "TELEGRAM_CHAT_ID", None)
            and getattr(config, "TELEGRAM_ENABLED", False)
        )
        self.email_enabled = bool(
            getattr(config, "EMAIL_HOST", None)
            and getattr(config, "EMAIL_FROM", None)
            and getattr(config, "EMAIL_TO", None)
            and getattr(config, "EMAIL_ENABLED", False)
        )

        if self.telegram_enabled:
            logger.info("Notifications Telegram activées")
        if self.email_enabled:
            logger.info("Notifications Email activées")
        if not self.telegram_enabled and not self.email_enabled:
            logger.warning(
                "Aucun canal de notification configuré "
                "(TELEGRAM_ENABLED et EMAIL_ENABLED sont désactivés)"
            )

    # ------------------------------------------------------------------
    # Canal bas niveau : Telegram
    # ------------------------------------------------------------------

    async def send_telegram(self, message: str, parse_mode: str = "HTML") -> bool:
        """
        Envoie un message au chat Telegram configuré.

        Args:
            message:    Corps du message (supporte le HTML ou Markdown selon parse_mode)
            parse_mode: "HTML" ou "Markdown" (défaut: "HTML")

        Returns:
            True si envoyé avec succès, False sinon.
        """
        if not self.telegram_enabled:
            return False

        url = (
            f"https://api.telegram.org/bot"
            f"{self.config.TELEGRAM_BOT_TOKEN}/sendMessage"
        )
        payload = {
            "chat_id": self.config.TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True,
        }

        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        return True
                    body = await resp.text()
                    logger.warning(
                        f"Telegram API a retourné {resp.status}: {body[:200]}"
                    )
                    return False
        except asyncio.TimeoutError:
            logger.error("Timeout Telegram (>10s)")
            return False
        except Exception as e:
            logger.error(f"Erreur envoi Telegram: {e}")
            return False

    # ------------------------------------------------------------------
    # Canal bas niveau : Email
    # ------------------------------------------------------------------

    async def send_email(self, subject: str, body: str) -> bool:
        """
        Envoie un email HTML via SMTP asynchrone.

        Args:
            subject: Objet de l'email
            body:    Corps HTML de l'email

        Returns:
            True si envoyé avec succès, False sinon.
        """
        if not self.email_enabled:
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.config.EMAIL_FROM
            msg["To"] = self.config.EMAIL_TO
            msg.attach(MIMEText(body, "html", "utf-8"))

            await aiosmtplib.send(
                msg,
                hostname=self.config.EMAIL_HOST,
                port=self.config.EMAIL_PORT,
                username=getattr(self.config, "EMAIL_USERNAME", None),
                password=getattr(self.config, "EMAIL_PASSWORD", None),
                use_tls=getattr(self.config, "EMAIL_USE_TLS", True),
                timeout=15,
            )
            logger.debug(f"Email envoyé : {subject}")
            return True

        except Exception as e:
            logger.error(f"Erreur envoi email ({subject}): {e}")
            return False

    # ------------------------------------------------------------------
    # Notifications métier
    # ------------------------------------------------------------------

    async def send_trade_opened(self, trade: dict, signal) -> None:
        """Notification lors de l'ouverture d'un nouveau trade."""
        direction = trade.get("direction", "")
        entry = trade.get("entry", 0)
        sl = float(signal.stop_loss) if signal.stop_loss else 0
        tp = float(signal.take_profit) if signal.take_profit else 0
        score = getattr(signal, "confluence_score", 0)

        # Calcul R:R
        risk = abs(entry - sl)
        reward = abs(tp - entry)
        rr = round(reward / risk, 2) if risk > 0 else 0

        direction_emoji = "BUY" if direction == "BUY" else "SELL"
        direction_label = "ACHAT" if direction == "BUY" else "VENTE"
        status_emoji = "GREEN" if direction == "BUY" else "RED"

        tg_msg = (
            f"<b>NOUVEAU TRADE OUVERT</b>\n\n"
            f"<b>Paire:</b> {trade.get('pair', '')}\n"
            f"<b>Direction:</b> {direction_label} ({direction_emoji})\n"
            f"<b>Entree:</b> {entry:.5f}\n"
            f"<b>Stop Loss:</b> {sl:.5f}\n"
            f"<b>Take Profit:</b> {tp:.5f}\n"
            f"<b>Score confluence:</b> {score:.0f}/100\n"
            f"<b>R:R:</b> 1:{rr}\n"
            f"<b>Lot size:</b> {trade.get('lot_size', 0):,} units\n\n"
            f"<i>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )

        await self.send_telegram(tg_msg)

        email_body = (
            f"<h2>Nouveau trade ouvert</h2>"
            f"<table border='1' cellpadding='5' style='border-collapse:collapse'>"
            f"<tr><td><b>Paire</b></td><td>{trade.get('pair', '')}</td></tr>"
            f"<tr><td><b>Direction</b></td><td>{direction_label}</td></tr>"
            f"<tr><td><b>Entree</b></td><td>{entry:.5f}</td></tr>"
            f"<tr><td><b>Stop Loss</b></td><td>{sl:.5f}</td></tr>"
            f"<tr><td><b>Take Profit</b></td><td>{tp:.5f}</td></tr>"
            f"<tr><td><b>Score</b></td><td>{score:.0f}/100</td></tr>"
            f"<tr><td><b>R:R</b></td><td>1:{rr}</td></tr>"
            f"</table>"
        )
        await self.send_email(
            subject=f"Trade ouvert : {trade.get('pair', '')} {direction_label}",
            body=email_body,
        )

    async def send_trade_closed(self, trade: dict, pl: float) -> None:
        """Notification lors de la clôture d'un trade."""
        result_label = "WIN" if pl > 0 else "LOSS"
        pl_str = f"+{pl:.2f}" if pl >= 0 else f"{pl:.2f}"

        tg_msg = (
            f"<b>TRADE FERME</b>\n\n"
            f"<b>Paire:</b> {trade.get('pair', '')}\n"
            f"<b>Direction:</b> {trade.get('direction', '')}\n"
            f"<b>P&L:</b> {pl_str} $\n"
            f"<b>Resultat:</b> {result_label}\n\n"
            f"<i>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )

        await self.send_telegram(tg_msg)

    async def send_risk_alert(self, alert_type: str, details: str) -> None:
        """
        Alerte de risque critique envoyée sur Telegram ET par email.
        Utilisé pour les drawdowns, arrêts d'urgence, etc.
        """
        tg_msg = (
            f"<b>ALERTE RISQUE - {alert_type.upper()}</b>\n\n"
            f"{details}\n\n"
            f"<i>Bot Forex Trading - {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )

        await self.send_telegram(tg_msg)

        email_body = (
            f"<h2 style='color:red'>Alerte Risque : {alert_type}</h2>"
            f"<p>{details.replace(chr(10), '<br>')}</p>"
            f"<p><small>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</small></p>"
        )
        await self.send_email(
            subject=f"ALERTE RISQUE - {alert_type}",
            body=email_body,
        )

    async def send_daily_report(self, stats: dict) -> None:
        """
        Envoie le rapport journalier automatique sur Telegram.
        Typiquement appelé en fin de session de trading (17h00 NY).
        """
        pl = stats.get("daily_pl", 0.0)
        pl_str = f"+{pl:.2f}" if pl >= 0 else f"{pl:.2f}"
        trades_today = stats.get("trades_today", 0)
        wins_today = stats.get("wins_today", 0)
        win_rate = stats.get("win_rate", 0.0)
        balance = stats.get("balance", 0.0)
        daily_dd = stats.get("daily_drawdown", 0.0)

        tg_msg = (
            f"<b>RAPPORT JOURNALIER</b>\n\n"
            f"<b>P&L Jour:</b> {pl_str} $\n"
            f"<b>Trades:</b> {trades_today} "
            f"({wins_today}W / {trades_today - wins_today}L)\n"
            f"<b>Win Rate:</b> {win_rate:.1f}%\n"
            f"<b>Balance:</b> {balance:.2f} $\n"
            f"<b>Drawdown Jour:</b> {daily_dd:.2f}%\n\n"
            f"<i>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )

        await self.send_telegram(tg_msg)

        email_body = (
            f"<h2>Rapport Journalier - {datetime.utcnow().strftime('%Y-%m-%d')}</h2>"
            f"<table border='1' cellpadding='5' style='border-collapse:collapse'>"
            f"<tr><td><b>P&L Jour</b></td><td>{pl_str} $</td></tr>"
            f"<tr><td><b>Trades</b></td><td>{trades_today} "
            f"({wins_today}W / {trades_today - wins_today}L)</td></tr>"
            f"<tr><td><b>Win Rate</b></td><td>{win_rate:.1f}%</td></tr>"
            f"<tr><td><b>Balance</b></td><td>{balance:.2f} $</td></tr>"
            f"<tr><td><b>Drawdown Jour</b></td><td>{daily_dd:.2f}%</td></tr>"
            f"</table>"
        )
        await self.send_email(
            subject=f"Rapport Journalier {datetime.utcnow().strftime('%Y-%m-%d')} — P&L: {pl_str}$",
            body=email_body,
        )

    async def send_bot_status(self, status: str, reason: str = "") -> None:
        """
        Notification du changement de statut du bot (STARTED / STOPPED / ERROR).

        Args:
            status: "STARTED", "STOPPED" ou "ERROR"
            reason: Message explicatif optionnel
        """
        status_labels = {
            "STARTED": "DEMARRAGE",
            "STOPPED": "ARRET",
            "ERROR": "ERREUR",
        }
        label = status_labels.get(status.upper(), status.upper())
        reason_line = f"\n<i>Raison: {reason}</i>" if reason else ""

        tg_msg = (
            f"<b>Bot {label}</b>"
            f"{reason_line}\n\n"
            f"<i>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )

        await self.send_telegram(tg_msg)

        if status.upper() in ("STOPPED", "ERROR"):
            email_body = (
                f"<h2>Bot {label}</h2>"
                f"<p>{reason}</p>"
                f"<p><small>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</small></p>"
            )
            await self.send_email(
                subject=f"Bot Forex {label}",
                body=email_body,
            )

    async def send_signal_detected(self, pair: str, direction: str, score: float) -> None:
        """
        Notification légère lors de la détection d'un signal (avant validation risque).
        Utile pour le suivi en temps réel sans encombrer les canaux principaux.
        Envoyé uniquement sur Telegram.
        """
        direction_label = "ACHAT" if direction == "BUY" else "VENTE"
        tg_msg = (
            f"<b>Signal detecte</b>: {pair} {direction_label} "
            f"| Score: {score:.0f}/100 "
            f"| <i>{datetime.utcnow().strftime('%H:%M UTC')}</i>"
        )
        await self.send_telegram(tg_msg)

    async def send_drawdown_warning(
        self,
        current_drawdown_pct: float,
        daily_pl: float,
        balance: float,
        threshold_pct: float,
    ) -> None:
        """
        Avertissement de drawdown approchant le seuil maximum.
        Envoyé quand le drawdown dépasse 75% du seuil configuré.
        """
        tg_msg = (
            f"<b>AVERTISSEMENT DRAWDOWN</b>\n\n"
            f"Drawdown actuel: <b>{current_drawdown_pct:.1f}%</b> "
            f"(seuil: {threshold_pct:.1f}%)\n"
            f"P&L jour: {daily_pl:+.2f} $\n"
            f"Balance: {balance:.2f} $\n\n"
            f"Le bot sera arrete automatiquement si le drawdown "
            f"atteint {threshold_pct:.1f}%.\n\n"
            f"<i>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</i>"
        )
        await self.send_telegram(tg_msg)
