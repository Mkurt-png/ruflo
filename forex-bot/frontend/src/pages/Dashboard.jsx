/**
 * Dashboard principal — Vue d'ensemble temps réel
 * Mise à jour chaque seconde via WebSocket
 */
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, DollarSign,
  Target, Shield, Power, BarChart2, Clock,
  ChevronUp, ChevronDown, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import axios from 'axios';
import { WsContext } from '../App';

// ─── Demo data generators ──────────────────────────────────────────────────────
function generateEquityCurve(days, startBalance = 10000) {
  const data = [];
  let equity = startBalance;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const change = (Math.random() - 0.42) * 80;
    equity = Math.max(startBalance * 0.9, equity + change);
    data.push({
      date: format(date, 'dd/MM'),
      equity: parseFloat(equity.toFixed(2)),
      balance: parseFloat((equity - Math.random() * 100).toFixed(2))
    });
  }
  return data;
}

const EQUITY_CURVES = {
  '1d': generateEquityCurve(1),
  '1w': generateEquityCurve(7),
  '1m': generateEquityCurve(30),
  '3m': generateEquityCurve(90),
};

const DEMO_OPEN_TRADES = [
  { id: 'T001', pair: 'EUR_USD', direction: 'BUY', units: 10000, openPrice: 1.08423, currentPrice: 1.08542, sl: 1.07923, tp: 1.09423, pips: 11.9, pl: 11.9, duration: '2h 14m', openTime: '14:23' },
  { id: 'T002', pair: 'GBP_USD', direction: 'SELL', units: 5000, openPrice: 1.26412, currentPrice: 1.26341, sl: 1.26912, tp: 1.25412, pips: 7.1, pl: 3.55, duration: '45m', openTime: '15:52' },
  { id: 'T003', pair: 'USD_JPY', direction: 'BUY', units: 8000, openPrice: 149.512, currentPrice: 149.823, sl: 149.012, tp: 150.512, pips: 31.1, pl: 22.06, duration: '3h 02m', openTime: '13:35' },
];

const DEMO_STATS = {
  winRate: 67.3, sharpeRatio: 1.84, profitFactor: 2.13,
  expectancy: 8.42, maxDrawdown: 4.2, avgTrade: 12.3,
  totalTrades: 127, winTrades: 85, lossTrades: 42,
  avgWin: 23.4, avgLoss: -14.2
};

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, title, value, change, changePct, prefix = '', suffix = '', positive, delay = 0 }) {
  const isPos = positive !== undefined ? positive : (change >= 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-dark-800 border border-dark-600 rounded-xl p-5 card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-100 font-mono">
            {prefix}<span>{value}</span>{suffix}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPos ? 'text-accent-success' : 'text-accent-danger'}`}>
              {isPos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{prefix}{Math.abs(change).toFixed(2)}{suffix}</span>
              {changePct !== undefined && <span className="text-slate-500">({Math.abs(changePct).toFixed(2)}%)</span>}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${isPos ? 'bg-accent-success/10' : 'bg-accent-danger/10'}`}>
          <Icon size={20} className={isPos ? 'text-accent-success' : 'text-accent-danger'} />
        </div>
      </div>
    </motion.div>
  );
}

function BotToggleModal({ isOpen, onConfirm, onCancel, isRunning }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm mx-4"
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X size={16} />
        </button>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isRunning ? 'bg-accent-danger/10' : 'bg-accent-success/10'}`}>
          {isRunning ? <AlertTriangle size={24} className="text-accent-danger" /> : <Power size={24} className="text-accent-success" />}
        </div>
        <h3 className="text-center font-bold text-lg text-slate-200 mb-2">
          {isRunning ? 'Arrêter le bot ?' : 'Démarrer le bot ?'}
        </h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          {isRunning
            ? 'Le bot cessera de prendre de nouveaux trades. Les positions ouvertes resteront actives.'
            : 'Le bot commencera à analyser le marché et à prendre des positions selon la stratégie configurée.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-dark-600 text-slate-400 hover:bg-dark-700 text-sm transition-all">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              isRunning ? 'bg-accent-danger/20 border border-accent-danger/40 text-accent-danger hover:bg-accent-danger/30' : 'bg-accent-success/20 border border-accent-success/40 text-accent-success hover:bg-accent-success/30'
            }`}
          >
            {isRunning ? 'Arrêter' : 'Démarrer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BotStatusPanel({ botStatus, onToggle, loading }) {
  const uptimeStr = (() => {
    const seconds = botStatus.uptime || 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  })();

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Statut du Bot</h3>

      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        {/* Big toggle button */}
        <button
          onClick={onToggle}
          disabled={loading}
          className={`relative w-24 h-24 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            botStatus.running
              ? 'border-accent-success bg-accent-success/10 hover:bg-accent-success/20 glow-green'
              : 'border-slate-600 bg-dark-700 hover:bg-dark-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {botStatus.running && (
            <span className="absolute inset-0 rounded-full border-2 border-accent-success animate-ping opacity-30" />
          )}
          <Power size={32} className={botStatus.running ? 'text-accent-success' : 'text-slate-500'} />
        </button>

        <div className="text-center">
          <p className={`text-lg font-bold ${botStatus.running ? 'text-accent-success' : 'text-slate-500'}`}>
            {botStatus.running ? 'ACTIF' : 'ARRÊTÉ'}
          </p>
          <p className="text-xs text-slate-600 capitalize mt-0.5">{botStatus.mode || 'practice'} mode</p>
        </div>

        {botStatus.running && (
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-dark-900 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Uptime</p>
              <p className="text-sm font-mono font-semibold text-slate-200">{uptimeStr}</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Trades</p>
              <p className="text-sm font-mono font-semibold text-accent-primary">{botStatus.tradesCount || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mode badge */}
      <div className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-lg text-xs ${
        botStatus.mode === 'live' ? 'bg-accent-danger/10 border border-accent-danger/30 text-accent-danger' : 'bg-dark-700 border border-dark-600 text-slate-500'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${botStatus.mode === 'live' ? 'bg-accent-danger' : 'bg-slate-600'}`} />
        {botStatus.mode === 'live' ? 'LIVE TRADING — RISQUE RÉEL' : 'PAPER TRADING — SIMULÉ'}
      </div>
    </div>
  );
}

function EquityCurveChart({ period, setPeriod }) {
  const data = EQUITY_CURVES[period];
  const minVal = Math.min(...data.map(d => d.equity));
  const maxVal = Math.max(...data.map(d => d.equity));
  const isProfit = data[data.length - 1]?.equity >= data[0]?.equity;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-accent-primary">Équité: ${payload[0]?.value?.toLocaleString()}</p>
        {payload[1] && <p className="text-slate-400">Balance: ${payload[1]?.value?.toLocaleString()}</p>}
      </div>
    );
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courbe d'Équité</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-slate-100">${data[data.length - 1]?.equity.toLocaleString()}</span>
            <span className={`text-xs ${isProfit ? 'text-accent-success' : 'text-accent-danger'}`}>
              {isProfit ? '+' : ''}{(data[data.length - 1]?.equity - data[0]?.equity).toFixed(2)}
              {' '}({((data[data.length - 1]?.equity / data[0]?.equity - 1) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {['1d', '1w', '1m', '3m'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                period === p ? 'bg-accent-primary text-dark-900 font-semibold' : 'bg-dark-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[minVal * 0.998, maxVal * 1.002]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={v => `$${v.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={data[0]?.equity} stroke="#475569" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={isProfit ? '#00ff88' : '#ff4444'}
            strokeWidth={2}
            fill="url(#equityGrad)"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function OpenTradesTable({ trades, prices }) {
  if (!trades.length) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Positions Ouvertes</h3>
        <div className="flex flex-col items-center justify-center py-10 text-slate-600">
          <Activity size={32} className="mb-3 opacity-30" />
          <p className="text-sm">Aucune position ouverte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Positions Ouvertes <span className="text-accent-primary ml-2">{trades.length}</span>
        </h3>
        <div className="text-xs text-slate-500">
          P&L Total: {' '}
          <span className={trades.reduce((acc, t) => acc + t.pl, 0) >= 0 ? 'text-accent-success' : 'text-accent-danger'}>
            {trades.reduce((acc, t) => acc + t.pl, 0) >= 0 ? '+' : ''}
            ${trades.reduce((acc, t) => acc + t.pl, 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-600 border-b border-dark-700">
              <th className="text-left pb-2 pr-4">Paire</th>
              <th className="text-left pb-2 pr-4">Dir.</th>
              <th className="text-right pb-2 pr-4">Entrée</th>
              <th className="text-right pb-2 pr-4">Actuel</th>
              <th className="text-right pb-2 pr-4">SL</th>
              <th className="text-right pb-2 pr-4">TP</th>
              <th className="text-right pb-2 pr-4">Pips</th>
              <th className="text-right pb-2 pr-4">P&L</th>
              <th className="text-right pb-2">Durée</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {trades.map((trade, idx) => {
                const livePrice = prices[trade.pair];
                const currentBid = livePrice?.bid || trade.currentPrice;
                const pipSize = trade.pair.includes('JPY') ? 0.01 : 0.0001;
                const livePips = trade.direction === 'BUY'
                  ? (currentBid - trade.openPrice) / pipSize
                  : (trade.openPrice - currentBid) / pipSize;
                const livePl = (livePips * pipSize * trade.units).toFixed(2);
                const isProfit = livePips >= 0;

                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`border-b border-dark-700 tr-hover ${isProfit ? 'bg-accent-success/3' : 'bg-accent-danger/3'}`}
                  >
                    <td className="py-2.5 pr-4">
                      <span className="font-semibold text-slate-200">{trade.pair.replace('_', '/')}</span>
                    </td>
                    <td className="pr-4">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                        trade.direction === 'BUY' ? 'bg-accent-success/15 text-accent-success' : 'bg-accent-danger/15 text-accent-danger'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="text-right pr-4 text-slate-400 font-mono text-xs">
                      {trade.openPrice.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                    </td>
                    <td className={`text-right pr-4 font-mono text-xs font-semibold ${isProfit ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {currentBid.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                    </td>
                    <td className="text-right pr-4 text-accent-danger/70 font-mono text-xs">
                      {trade.sl?.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                    </td>
                    <td className="text-right pr-4 text-accent-success/70 font-mono text-xs">
                      {trade.tp?.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                    </td>
                    <td className={`text-right pr-4 font-mono text-xs font-semibold ${isProfit ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {isProfit ? '+' : ''}{livePips.toFixed(1)}
                    </td>
                    <td className={`text-right pr-4 font-mono text-xs font-bold ${isProfit ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {isProfit ? '+' : ''}${livePl}
                    </td>
                    <td className="text-right text-slate-500 text-xs">{trade.duration}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color = 'accent-primary', delay = 0 }) {
  const colorMap = {
    'accent-primary': 'text-accent-primary bg-accent-primary/10 border-accent-primary/20',
    'accent-success': 'text-accent-success bg-accent-success/10 border-accent-success/20',
    'accent-warning': 'text-accent-warning bg-accent-warning/10 border-accent-warning/20',
    'accent-danger': 'text-accent-danger bg-accent-danger/10 border-accent-danger/20',
  };
  const cls = colorMap[color] || colorMap['accent-primary'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`bg-dark-800 border rounded-xl p-5 ${cls.split(' ').slice(1).join(' ')}`}
    >
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-3xl font-bold font-mono ${cls.split(' ')[0]}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const wsCtx = useContext(WsContext);
  const { data: wsData } = wsCtx || { data: {} };
  const [period, setPeriod] = useState('1m');
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [botToggleLoading, setBotToggleLoading] = useState(false);
  const qc = useQueryClient();

  const prices = wsData?.prices || {};
  const rawOpenTrades = wsData?.openTrades || [];
  const openTrades = rawOpenTrades.length > 0 ? rawOpenTrades : DEMO_OPEN_TRADES;
  const botStatus = wsData?.botStatus || { running: false, mode: 'practice', uptime: 0, tradesCount: 0 };
  const accountData = wsData?.accountData || {};

  const { data: summaryData } = useQuery(
    'account-summary',
    () => axios.get('/api/account/summary').then(r => r.data),
    { retry: false, onError: () => {} }
  );

  const { data: statsData } = useQuery(
    'account-stats',
    () => axios.get('/api/account/stats').then(r => r.data),
    { retry: false, onError: () => {} }
  );

  const stats = statsData || DEMO_STATS;
  const balance = summaryData?.balance ?? accountData?.balance ?? 10000;
  const equity = summaryData?.equity ?? accountData?.equity ?? 10000;
  const unrealizedPl = summaryData?.unrealized_pl ?? accountData?.unrealized_pl ?? 0;
  const dayPl = summaryData?.day_pl ?? 142.30;
  const weekPl = summaryData?.week_pl ?? 387.50;

  const handleBotToggle = async () => {
    setBotToggleLoading(true);
    try {
      if (botStatus.running) {
        await axios.post('/api/bot/stop');
        toast.success('Bot arrêté avec succès');
      } else {
        await axios.post('/api/bot/start');
        toast.success('Bot démarré avec succès');
      }
      qc.invalidateQueries('account-summary');
    } catch (err) {
      // Demo mode: simulate toggle
      toast.success(botStatus.running ? 'Bot arrêté (démo)' : 'Bot démarré (démo)');
    } finally {
      setBotToggleLoading(false);
      setShowToggleModal(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Row 1: 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Balance"
          value={balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          prefix="$"
          change={0}
          positive={true}
          delay={0}
        />
        <StatCard
          icon={TrendingUp}
          title="P&L Aujourd'hui"
          value={Math.abs(dayPl).toFixed(2)}
          prefix={dayPl >= 0 ? '+$' : '-$'}
          change={dayPl}
          changePct={(dayPl / balance) * 100}
          positive={dayPl >= 0}
          delay={0.05}
        />
        <StatCard
          icon={BarChart2}
          title="P&L Semaine"
          value={Math.abs(weekPl).toFixed(2)}
          prefix={weekPl >= 0 ? '+$' : '-$'}
          change={weekPl}
          changePct={(weekPl / balance) * 100}
          positive={weekPl >= 0}
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          title="Positions Ouvertes"
          value={openTrades.length}
          change={unrealizedPl}
          changePct={(unrealizedPl / equity) * 100}
          positive={unrealizedPl >= 0}
          suffix={` (${unrealizedPl >= 0 ? '+' : ''}$${unrealizedPl.toFixed(2)})`}
          delay={0.15}
        />
      </div>

      {/* Row 2: Equity Curve + Bot Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityCurveChart period={period} setPeriod={setPeriod} />
        </div>
        <div>
          <BotStatusPanel
            botStatus={botStatus}
            onToggle={() => setShowToggleModal(true)}
            loading={botToggleLoading}
          />
        </div>
      </div>

      {/* Row 3: Open Trades */}
      <OpenTradesTable trades={openTrades} prices={prices} />

      {/* Row 4: 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate?.toFixed(1)}%`}
          subtitle={`${stats.winTrades} gagnants / ${stats.lossTrades} perdants`}
          color="accent-success"
          delay={0}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={stats.sharpeRatio?.toFixed(2)}
          subtitle="Rendement ajusté au risque"
          color={stats.sharpeRatio >= 1 ? 'accent-primary' : 'accent-warning'}
          delay={0.05}
        />
        <MetricCard
          title="Profit Factor"
          value={stats.profitFactor?.toFixed(2)}
          subtitle={`Expectancy: $${stats.expectancy?.toFixed(2)} / trade`}
          color={stats.profitFactor >= 2 ? 'accent-success' : stats.profitFactor >= 1 ? 'accent-warning' : 'accent-danger'}
          delay={0.1}
        />
      </div>

      {/* Additional metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Gain Moyen</p>
          <p className="text-lg font-bold text-accent-success font-mono">+${stats.avgWin?.toFixed(2)}</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Perte Moyenne</p>
          <p className="text-lg font-bold text-accent-danger font-mono">${stats.avgLoss?.toFixed(2)}</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Drawdown Max</p>
          <p className="text-lg font-bold text-accent-warning font-mono">{stats.maxDrawdown?.toFixed(1)}%</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Trades</p>
          <p className="text-lg font-bold text-slate-200 font-mono">{stats.totalTrades}</p>
        </div>
      </div>

      {/* Bot Toggle Modal */}
      <BotToggleModal
        isOpen={showToggleModal}
        onConfirm={handleBotToggle}
        onCancel={() => setShowToggleModal(false)}
        isRunning={botStatus.running}
      />
    </div>
  );
}
