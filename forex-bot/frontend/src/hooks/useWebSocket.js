/**
 * Hook WebSocket pour les données temps réel
 * Reconnexion automatique avec backoff exponentiel
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

export function useWebSocket(url) {
  const [data, setData] = useState({
    prices: {
      EUR_USD: { bid: 1.08542, ask: 1.08558, change: 0.0012, changePct: 0.11 },
      GBP_USD: { bid: 1.26341, ask: 1.26359, change: -0.0023, changePct: -0.18 },
      USD_JPY: { bid: 149.823, ask: 149.841, change: 0.341, changePct: 0.23 },
      USD_CHF: { bid: 0.89234, ask: 0.89252, change: -0.00089, changePct: -0.10 },
      AUD_USD: { bid: 0.65123, ask: 0.65141, change: 0.00234, changePct: 0.36 },
      USD_CAD: { bid: 1.35621, ask: 1.35639, change: -0.00312, changePct: -0.23 },
    },
    openTrades: [],
    signals: [],
    botStatus: { running: false, mode: 'practice', uptime: 0, tradesCount: 0 },
    accountData: { balance: 10000, equity: 10000, unrealized_pl: 0, margin_used: 0, margin_available: 10000 }
  });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      // Build websocket URL
      const wsUrl = url || (() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws/live`;
      })();

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('[WS] Connected to', wsUrl);
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        // Send auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log('[WS] Disconnected, code:', event.code);
        setConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        // onclose will be called after onerror
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      scheduleReconnect();
    }
  }, [url]);

  const handleMessage = useCallback((message) => {
    const { type, payload } = message;

    setData(prev => {
      switch (type) {
        case 'price': {
          // payload: { pair: 'EUR_USD', bid: 1.08542, ask: 1.08558, change: 0.0012, changePct: 0.11 }
          return {
            ...prev,
            prices: {
              ...prev.prices,
              [payload.pair]: {
                bid: payload.bid,
                ask: payload.ask,
                change: payload.change,
                changePct: payload.changePct,
                spread: payload.spread || ((payload.ask - payload.bid) * 10000).toFixed(1),
                timestamp: payload.timestamp || Date.now()
              }
            }
          };
        }

        case 'prices_batch': {
          // payload: { prices: { EUR_USD: {...}, ... } }
          return {
            ...prev,
            prices: {
              ...prev.prices,
              ...payload.prices
            }
          };
        }

        case 'trade_update': {
          // payload: { action: 'open'|'close'|'update', trade: {...} }
          if (payload.action === 'open') {
            return {
              ...prev,
              openTrades: [...prev.openTrades, payload.trade]
            };
          } else if (payload.action === 'close') {
            return {
              ...prev,
              openTrades: prev.openTrades.filter(t => t.id !== payload.trade.id)
            };
          } else if (payload.action === 'update') {
            return {
              ...prev,
              openTrades: prev.openTrades.map(t =>
                t.id === payload.trade.id ? { ...t, ...payload.trade } : t
              )
            };
          }
          return prev;
        }

        case 'trades_snapshot': {
          // payload: { trades: [...] }
          return {
            ...prev,
            openTrades: payload.trades || []
          };
        }

        case 'signal': {
          // payload: { pair, direction, score, timeframe, entry, sl, tp, ... }
          const existingIdx = prev.signals.findIndex(
            s => s.pair === payload.pair && s.timeframe === payload.timeframe
          );
          if (existingIdx >= 0) {
            const newSignals = [...prev.signals];
            newSignals[existingIdx] = payload;
            return { ...prev, signals: newSignals };
          }
          return { ...prev, signals: [...prev.signals, payload] };
        }

        case 'signals_snapshot': {
          return { ...prev, signals: payload.signals || [] };
        }

        case 'account': {
          // payload: { balance, equity, unrealized_pl, margin_used, margin_available, ... }
          return {
            ...prev,
            accountData: { ...prev.accountData, ...payload }
          };
        }

        case 'bot_status': {
          // payload: { running, mode, uptime, tradesCount, lastAction }
          return {
            ...prev,
            botStatus: { ...prev.botStatus, ...payload }
          };
        }

        case 'heartbeat': {
          // Just a keepalive, no state change needed
          return prev;
        }

        default:
          console.log('[WS] Unknown message type:', type);
          return prev;
      }
    });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(RECONNECT_MULTIPLIER, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
    reconnectAttemptsRef.current += 1;
    reconnectTimeoutRef.current = setTimeout(connect, delay);
  }, [connect]);

  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    isMountedRef.current = false;
    clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  // Simulate realistic price updates when not connected (dev/demo mode)
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(() => {
      setData(prev => {
        const newPrices = { ...prev.prices };
        Object.keys(newPrices).forEach(pair => {
          const price = newPrices[pair];
          const volatility = pair.includes('JPY') ? 0.005 : 0.0001;
          const delta = (Math.random() - 0.5) * volatility * 2;
          const newBid = parseFloat((price.bid + delta).toFixed(pair.includes('JPY') ? 3 : 5));
          const newAsk = parseFloat((newBid + (pair.includes('JPY') ? 0.015 : 0.0001)).toFixed(pair.includes('JPY') ? 3 : 5));
          newPrices[pair] = {
            ...price,
            bid: newBid,
            ask: newAsk,
            change: parseFloat((newBid - (pair.includes('JPY') ? 149.5 : 1.08)).toFixed(5)),
            changePct: parseFloat(((delta / price.bid) * 100).toFixed(3)),
          };
        });
        return { ...prev, prices: newPrices };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connected]);

  return { data, connected, send, disconnect };
}
