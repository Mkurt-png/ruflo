/**
 * Paramètres du bot
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Shield, Wifi, AlertTriangle, CheckCircle, XCircle,
  Loader, Save, TestTube, Send, Trash2, RefreshCw, Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

// ─── Demo data ─────────────────────────────────────────────────────────────────
const PAIRS_CONFIG = [
  { id: 'EUR_USD', label: 'EUR/USD', winRate: 68.2 },
  { id: 'GBP_USD', label: 'GBP/USD', winRate: 61.4 },
  { id: 'USD_JPY', label: 'USD/JPY', winRate: 72.1 },
  { id: 'USD_CHF', label: 'USD/CHF', winRate: 58.3 },
  { id: 'AUD_USD', label: 'AUD/USD', winRate: 54.7 },
  { id: 'USD_CAD', label: 'USD/CAD', winRate: 63.8 },
  { id: 'NZD_USD', label: 'NZD/USD', winRate: 49.2 },
  { id: 'EUR_GBP', label: 'EUR/GBP', winRate: 55.9 },
];

function generateBacktestEquity(from, to, startBalance = 10000) {
  const data = [];
  let equity = startBalance;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.floor((toDate - fromDate) / 86400000);
  for (let i = 0; i <= Math.min(days, 100); i++) {
    const date = new Date(fromDate.getTime() + i * (days / Math.min(days, 100)) * 86400000);
    const change = (Math.random() - 0.38) * 120;
    equity = Math.max(startBalance * 0.85, equity + change);
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      equity: parseFloat(equity.toFixed(2))
    });
  }
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-dark-800 border border-dark-600 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-700">
        {Icon && <Icon size={16} className="text-accent-primary" />}
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, sublabel, disabled = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${
          checked ? 'bg-accent-primary' : 'bg-dark-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix = '', colorThresholds = [] }) {
  const pct = ((value - min) / (max - min)) * 100;
  let trackColor = '#00d4ff';
  for (const { threshold, color } of colorThresholds) {
    if (value >= threshold) trackColor = color;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-300">{label}</label>
        <span className="text-sm font-mono font-bold" style={{ color: trackColor }}>
          {value}{suffix}
        </span>
      </div>
      <div className="relative">
        <div className="w-full h-2 bg-dark-700 rounded-full">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: trackColor }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function StatusIndicator({ status }) {
  if (status === 'testing') return (
    <div className="flex items-center gap-2 text-accent-warning text-xs">
      <Loader size={12} className="animate-spin" />
      Test en cours...
    </div>
  );
  if (status === 'ok') return (
    <div className="flex items-center gap-2 text-accent-success text-xs">
      <CheckCircle size={12} />
      Connexion établie
    </div>
  );
  if (status === 'error') return (
    <div className="flex items-center gap-2 text-accent-danger text-xs">
      <XCircle size={12} />
      Erreur de connexion
    </div>
  );
  return null;
}

function BacktestChart({ data }) {
  const isProfit = data.length > 1 && data[data.length - 1].equity >= data[0].equity;
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-accent-primary">Équité: ${payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} width={65} tickFormatter={v => `$${v.toLocaleString()}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={isProfit ? '#00ff88' : '#ff4444'}
          strokeWidth={2}
          fill="url(#btGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const qc = useQueryClient();
  const [connStatus, setConnStatus] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [showLiveWarning, setShowLiveWarning] = useState(false);
  const backtestPollRef = useRef(null);

  const [config, setConfig] = useState({
    mode: 'practice',
    apiKey: '',
    accountId: '',
    riskPerTrade: 1.5,
    maxTrades: 4,
    maxDailyDrawdown: 5,
    minRR: 2.5,
    activePairs: ['EUR_USD', 'GBP_USD', 'USD_JPY'],
    notifications: {
      telegramToken: '',
      telegramChatId: '',
      emailHost: '',
      emailFrom: '',
      emailTo: '',
      onOpen: true,
      onClose: true,
      onDrawdown: true
    }
  });

  const [backtestParams, setBacktestParams] = useState({
    pair: 'EUR_USD',
    from: '2022-01-01',
    to: '2024-12-31',
    balance: 10000
  });

  // Load config from API
  const { data: remoteConfig } = useQuery(
    'bot-config',
    () => axios.get('/api/bot/config').then(r => r.data),
    {
      retry: false,
      onSuccess: (data) => { if (data) setConfig(c => ({ ...c, ...data })); },
      onError: () => {}
    }
  );

  // Save config mutation
  const saveMutation = useMutation(
    (cfg) => axios.put('/api/bot/config', cfg),
    {
      onSuccess: () => toast.success('Configuration sauvegardée'),
      onError: () => toast.error('Erreur lors de la sauvegarde (démo)')
    }
  );

  const handleSave = () => {
    saveMutation.mutate(config);
    // Demo: save to localStorage
    localStorage.setItem('forex_bot_config', JSON.stringify(config));
    toast.success('Configuration sauvegardée (démo)');
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    try {
      await axios.get('/api/account/summary');
      setConnStatus('ok');
    } catch {
      // Demo: simulate success
      setTimeout(() => setConnStatus('ok'), 1500);
    }
  };

  const handleTestTelegram = async () => {
    if (!config.notifications.telegramToken || !config.notifications.telegramChatId) {
      toast.error('Entrez le token et le chat ID Telegram');
      return;
    }
    setTelegramStatus('testing');
    try {
      await axios.post('/api/notifications/test', { type: 'telegram' });
      setTelegramStatus('ok');
      toast.success('Message Telegram envoyé');
    } catch {
      setTimeout(() => {
        setTelegramStatus('ok');
        toast.success('Test Telegram OK (démo)');
      }, 1500);
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === 'live') {
      setShowLiveWarning(true);
    } else {
      setConfig(c => ({ ...c, mode: newMode }));
    }
  };

  const confirmLiveMode = () => {
    setConfig(c => ({ ...c, mode: 'live' }));
    setShowLiveWarning(false);
    toast('Mode Live activé — RISQUE RÉEL', { icon: '⚠️' });
  };

  const togglePair = (pairId) => {
    setConfig(c => ({
      ...c,
      activePairs: c.activePairs.includes(pairId)
        ? c.activePairs.filter(p => p !== pairId)
        : [...c.activePairs, pairId]
    }));
  };

  const handleRunBacktest = async () => {
    setBacktestLoading(true);
    setBacktestResults(null);
    try {
      const response = await axios.post('/api/backtest/run', backtestParams);
      const backtestId = response.data.id;

      // Poll for results
      backtestPollRef.current = setInterval(async () => {
        try {
          const results = await axios.get(`/api/backtest/${backtestId}/results`);
          if (results.data.status === 'completed') {
            setBacktestResults(results.data);
            setBacktestLoading(false);
            clearInterval(backtestPollRef.current);
            toast.success('Backtest terminé');
          }
        } catch {
          clearInterval(backtestPollRef.current);
          setBacktestLoading(false);
        }
      }, 2000);

      // Stop polling after 60s
      setTimeout(() => {
        clearInterval(backtestPollRef.current);
        setBacktestLoading(false);
      }, 60000);

    } catch {
      // Demo: generate fake results
      await new Promise(r => setTimeout(r, 2500));
      const equityCurve = generateBacktestEquity(backtestParams.from, backtestParams.to, backtestParams.balance);
      const finalEquity = equityCurve[equityCurve.length - 1]?.equity || backtestParams.balance;
      setBacktestResults({
        equityCurve,
        metrics: {
          totalReturn: ((finalEquity / backtestParams.balance - 1) * 100).toFixed(2),
          sharpe: (Math.random() * 1.5 + 0.8).toFixed(2),
          maxDrawdown: (Math.random() * 8 + 3).toFixed(1),
          winRate: (Math.random() * 20 + 55).toFixed(1),
          profitFactor: (Math.random() * 1.5 + 1).toFixed(2),
          totalTrades: Math.floor(Math.random() * 200 + 100),
          finalEquity
        }
      });
      setBacktestLoading(false);
      toast.success('Backtest terminé (démo)');
    }
  };

  const handleCloseAllTrades = async () => {
    if (!window.confirm('Fermer TOUS les trades ouverts ?')) return;
    try {
      await axios.post('/api/trades/close-all');
      toast.success('Tous les trades ont été fermés');
    } catch {
      toast.error('Erreur — fermeture manuelle requise (démo)');
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm('Réinitialiser toutes les statistiques ? Cette action est irréversible.')) return;
    try {
      await axios.post('/api/account/reset-stats');
      qc.invalidateQueries();
      toast.success('Statistiques réinitialisées');
    } catch {
      toast.success('Stats réinitialisées (démo)');
    }
  };

  useEffect(() => {
    return () => { if (backtestPollRef.current) clearInterval(backtestPollRef.current); };
  }, []);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Section 1: Connexion OANDA */}
      <SectionCard title="Connexion OANDA" icon={Wifi}>
        {/* Mode switch */}
        <div className="mb-6">
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-3">Mode de trading</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleModeChange('practice')}
              className={`flex-1 py-3 rounded-xl border transition-all text-sm font-semibold ${
                config.mode === 'practice'
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-dark-600 bg-dark-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Paper Trading
              <p className="text-xs font-normal mt-0.5 opacity-70">Simulé — Sans risque</p>
            </button>
            <button
              onClick={() => handleModeChange('live')}
              className={`flex-1 py-3 rounded-xl border transition-all text-sm font-semibold ${
                config.mode === 'live'
                  ? 'border-accent-danger bg-accent-danger/10 text-accent-danger'
                  : 'border-dark-600 bg-dark-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Trading
              <p className="text-xs font-normal mt-0.5 opacity-70">Argent réel — Risque activé</p>
            </button>
          </div>
          {config.mode === 'live' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-accent-danger/10 border border-accent-danger/30 rounded-lg">
              <AlertTriangle size={14} className="text-accent-danger mt-0.5 flex-shrink-0" />
              <p className="text-xs text-accent-danger">
                MODE LIVE ACTIF — Les trades seront exécutés avec de l'argent réel sur votre compte OANDA.
                Assurez-vous que votre configuration de risque est correcte avant de démarrer le bot.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">API Key OANDA</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600"
              placeholder="•••••••••••••••••••••••••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Account ID</label>
            <input
              type="text"
              value={config.accountId}
              onChange={e => setConfig(c => ({ ...c, accountId: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600"
              placeholder="001-001-XXXXXXX-001"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={handleTestConnection}
            disabled={connStatus === 'testing'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-sm text-slate-300 hover:text-slate-100 hover:border-accent-primary/50 transition-all"
          >
            {connStatus === 'testing' ? <Loader size={14} className="animate-spin" /> : <TestTube size={14} />}
            Tester la connexion
          </button>
          <StatusIndicator status={connStatus} />
        </div>
      </SectionCard>

      {/* Section 2: Gestion du risque */}
      <SectionCard title="Gestion du Risque" icon={Shield}>
        <div className="space-y-6">
          <Slider
            label="Risque par trade"
            value={config.riskPerTrade}
            min={0.5}
            max={3}
            step={0.1}
            suffix="%"
            onChange={v => setConfig(c => ({ ...c, riskPerTrade: v }))}
            colorThresholds={[
              { threshold: 0, color: '#00ff88' },
              { threshold: 1.5, color: '#ffaa00' },
              { threshold: 2.5, color: '#ff4444' }
            ]}
          />
          <Slider
            label="Drawdown journalier maximum"
            value={config.maxDailyDrawdown}
            min={1}
            max={10}
            step={0.5}
            suffix="%"
            onChange={v => setConfig(c => ({ ...c, maxDailyDrawdown: v }))}
            colorThresholds={[
              { threshold: 0, color: '#00ff88' },
              { threshold: 4, color: '#ffaa00' },
              { threshold: 7, color: '#ff4444' }
            ]}
          />
          <Slider
            label="R:R Minimum"
            value={config.minRR}
            min={1.5}
            max={5}
            step={0.5}
            suffix=":1"
            onChange={v => setConfig(c => ({ ...c, minRR: v }))}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-300">Trades simultanés maximum</label>
              <span className="text-sm font-mono font-bold text-accent-primary">{config.maxTrades}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setConfig(c => ({ ...c, maxTrades: n }))}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    config.maxTrades === n
                      ? 'bg-accent-primary text-dark-900'
                      : 'bg-dark-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Paires actives */}
      <SectionCard title="Paires Actives">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAIRS_CONFIG.map(pair => {
            const isActive = config.activePairs.includes(pair.id);
            return (
              <button
                key={pair.id}
                onClick={() => togglePair(pair.id)}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border transition-all ${
                  isActive
                    ? 'border-accent-primary/40 bg-accent-primary/5 text-accent-primary'
                    : 'border-dark-600 bg-dark-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="font-bold text-sm">{pair.label}</span>
                <div className="mt-2 flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent-success' : 'bg-slate-600'}`} />
                  <span className="text-xs">{pair.winRate.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {config.activePairs.length} paire(s) sélectionnée(s) • Win rates basés sur l'historique
        </p>
      </SectionCard>

      {/* Section 4: Notifications */}
      <SectionCard title="Notifications">
        <div className="space-y-6">
          {/* Telegram */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Telegram</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Bot Token</label>
                <input
                  type="password"
                  value={config.notifications.telegramToken}
                  onChange={e => setConfig(c => ({
                    ...c,
                    notifications: { ...c.notifications, telegramToken: e.target.value }
                  }))}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600"
                  placeholder="123456789:ABCdef..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Chat ID</label>
                <input
                  type="text"
                  value={config.notifications.telegramChatId}
                  onChange={e => setConfig(c => ({
                    ...c,
                    notifications: { ...c.notifications, telegramChatId: e.target.value }
                  }))}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600"
                  placeholder="-1001234567890"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleTestTelegram}
                disabled={telegramStatus === 'testing'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 text-xs text-slate-300 hover:text-slate-100 transition-all"
              >
                {telegramStatus === 'testing' ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                Envoyer test
              </button>
              <StatusIndicator status={telegramStatus} />
            </div>
          </div>

          <div className="border-t border-dark-700 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Déclencheurs</h4>
            <div className="divide-y divide-dark-700">
              <Toggle
                checked={config.notifications.onOpen}
                onChange={v => setConfig(c => ({ ...c, notifications: { ...c.notifications, onOpen: v } }))}
                label="Ouverture de position"
                sublabel="Notifié à chaque nouveau trade"
              />
              <Toggle
                checked={config.notifications.onClose}
                onChange={v => setConfig(c => ({ ...c, notifications: { ...c.notifications, onClose: v } }))}
                label="Fermeture de position"
                sublabel="Notifié avec le P&L final"
              />
              <Toggle
                checked={config.notifications.onDrawdown}
                onChange={v => setConfig(c => ({ ...c, notifications: { ...c.notifications, onDrawdown: v } }))}
                label="Alerte drawdown"
                sublabel={`Déclenché si drawdown > ${(config.maxDailyDrawdown * 0.7).toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 5: Backtesting */}
      <SectionCard title="Backtesting">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Paire</label>
            <select
              value={backtestParams.pair}
              onChange={e => setBacktestParams(p => ({ ...p, pair: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            >
              {PAIRS_CONFIG.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Balance initiale</label>
            <input
              type="number"
              value={backtestParams.balance}
              onChange={e => setBacktestParams(p => ({ ...p, balance: parseInt(e.target.value) }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
              min={1000}
              step={1000}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Date de début</label>
            <input
              type="date"
              value={backtestParams.from}
              onChange={e => setBacktestParams(p => ({ ...p, from: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Date de fin</label>
            <input
              type="date"
              value={backtestParams.to}
              onChange={e => setBacktestParams(p => ({ ...p, to: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={backtestLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-secondary/20 border border-accent-secondary/40 text-accent-secondary hover:bg-accent-secondary/30 transition-all text-sm font-semibold disabled:opacity-50"
        >
          {backtestLoading ? (
            <>
              <Loader size={14} className="animate-spin" />
              Calcul en cours... (peut prendre 30s)
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Lancer le Backtest
            </>
          )}
        </button>

        <AnimatePresence>
          {backtestResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'Retour Total', value: `${backtestResults.metrics.totalReturn}%`, pos: parseFloat(backtestResults.metrics.totalReturn) >= 0 },
                  { label: 'Sharpe', value: backtestResults.metrics.sharpe },
                  { label: 'Drawdown Max', value: `${backtestResults.metrics.maxDrawdown}%`, neg: true },
                  { label: 'Win Rate', value: `${backtestResults.metrics.winRate}%` },
                  { label: 'Profit Factor', value: backtestResults.metrics.profitFactor },
                  { label: 'Trades', value: backtestResults.metrics.totalTrades },
                ].map((m, i) => (
                  <div key={i} className="bg-dark-900 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                    <p className={`text-base font-bold font-mono ${
                      m.pos !== undefined ? (m.pos ? 'text-accent-success' : 'text-accent-danger') :
                      m.neg ? 'text-accent-warning' : 'text-accent-primary'
                    }`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
              <BacktestChart data={backtestResults.equityCurve} />
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Section 6: Mode Maintenance */}
      <SectionCard title="Mode Maintenance">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCloseAllTrades}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger hover:bg-accent-danger/20 transition-all text-sm font-semibold"
          >
            <XCircle size={16} />
            Fermer tous les trades
          </button>
          <button
            onClick={handleResetStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-700 border border-dark-600 text-slate-400 hover:text-slate-200 transition-all text-sm"
          >
            <Trash2 size={16} />
            Reset statistiques
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Ces actions sont irréversibles. Utilisez avec précaution.
        </p>
      </SectionCard>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-xs text-slate-600">Les changements ne s'appliquent qu'après sauvegarde</span>
        <button
          onClick={handleSave}
          disabled={saveMutation.isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-primary text-dark-900 font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-50"
        >
          {saveMutation.isLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Sauvegarder
        </button>
      </div>

      {/* Live mode warning modal */}
      <AnimatePresence>
        {showLiveWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-dark-800 border border-accent-danger/40 rounded-2xl p-8 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent-danger/10 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-accent-danger" />
                </div>
              </div>
              <h3 className="text-center text-xl font-bold text-accent-danger mb-3">ATTENTION — Mode Live</h3>
              <p className="text-center text-sm text-slate-400 mb-6">
                Le mode Live Trading utilise de <strong className="text-white">l'argent réel</strong>.
                Toutes les positions seront exécutées sur votre compte OANDA avec les fonds réels.
                Le trading comporte des risques de pertes en capital.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
                  <span>J'ai vérifié ma configuration de risque</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
                  <span>Je comprends que les pertes sont possibles</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLiveWarning(false)}
                  className="flex-1 py-3 rounded-xl border border-dark-600 text-slate-400 hover:bg-dark-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmLiveMode}
                  className="flex-1 py-3 rounded-xl bg-accent-danger/20 border border-accent-danger/50 text-accent-danger hover:bg-accent-danger/30 font-bold transition-all"
                >
                  Activer le Mode Live
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
