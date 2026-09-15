/**
 * Historique des trades et statistiques
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Download, Filter, ChevronUp, ChevronDown, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, Award, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, subDays, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Demo data ─────────────────────────────────────────────────────────────────
function generateTradeHistory(count = 60) {
  const pairs = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD'];
  const directions = ['BUY', 'SELL'];
  const trades = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const direction = directions[Math.floor(Math.random() * 2)];
    const isJPY = pair.includes('JPY');
    const isWin = Math.random() > 0.35;
    const pips = isWin
      ? Math.floor(Math.random() * 80 + 20)
      : -Math.floor(Math.random() * 40 + 10);
    const units = Math.floor(Math.random() * 8 + 2) * 1000;
    const pipValue = isJPY ? 0.01 : 0.0001;
    const pl = parseFloat((pips * pipValue * units).toFixed(2));
    const entryPrice = isJPY
      ? parseFloat((148 + Math.random() * 4).toFixed(3))
      : parseFloat((1.0 + Math.random() * 0.3).toFixed(5));
    const exitPrice = direction === 'BUY'
      ? entryPrice + pips * pipValue
      : entryPrice - pips * pipValue;
    const durationMin = Math.floor(Math.random() * 480 + 15);
    const openTime = new Date(now - i * 14400000 - Math.random() * 7200000);
    const closeTime = new Date(openTime.getTime() + durationMin * 60000);
    const score = Math.floor(Math.random() * 40 + 55);

    trades.push({
      id: `T${String(i + 1).padStart(4, '0')}`,
      pair,
      direction,
      units,
      entryPrice,
      exitPrice: parseFloat(exitPrice.toFixed(isJPY ? 3 : 5)),
      pips,
      pl,
      duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
      durationMin,
      openTime: openTime.toISOString(),
      closeTime: closeTime.toISOString(),
      score,
      isWin
    });
  }

  return trades.sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime));
}

function generateMonthlyData() {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months.map(month => ({
    month,
    pl: parseFloat(((Math.random() - 0.35) * 600).toFixed(2)),
    trades: Math.floor(Math.random() * 20 + 5)
  }));
}

const DEMO_TRADES = generateTradeHistory(60);
const DEMO_MONTHLY = generateMonthlyData();

const PAIRS = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD'];

const PIE_COLORS = ['#00ff88', '#ff4444', '#00d4ff', '#ffaa00', '#7b2fff', '#ff6b6b'];

// ─── Components ───────────────────────────────────────────────────────────────

function StatsGrid({ trades }) {
  const wins = trades.filter(t => t.isWin);
  const losses = trades.filter(t => !t.isWin);
  const totalPl = trades.reduce((acc, t) => acc + t.pl, 0);
  const totalWins = wins.reduce((acc, t) => acc + t.pl, 0);
  const totalLosses = Math.abs(losses.reduce((acc, t) => acc + t.pl, 0));
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  const expectancy = trades.length ? totalPl / trades.length : 0;
  const avgWin = wins.length ? totalWins / wins.length : 0;
  const avgLoss = losses.length ? totalLosses / losses.length : 0;
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Max streak
  let maxWinStreak = 0, currentStreak = 0;
  trades.slice().reverse().forEach(t => {
    if (t.isWin) { currentStreak++; maxWinStreak = Math.max(maxWinStreak, currentStreak); }
    else currentStreak = 0;
  });

  const stats = [
    { label: 'Total Trades', value: trades.length, color: 'text-slate-200' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRate >= 55 ? 'text-accent-success' : 'text-accent-warning' },
    { label: 'P&L Total', value: `${totalPl >= 0 ? '+' : ''}$${totalPl.toFixed(2)}`, color: totalPl >= 0 ? 'text-accent-success' : 'text-accent-danger' },
    { label: 'Profit Factor', value: profitFactor.toFixed(2), color: profitFactor >= 2 ? 'text-accent-success' : profitFactor >= 1 ? 'text-accent-warning' : 'text-accent-danger' },
    { label: 'Expectancy', value: `$${expectancy.toFixed(2)}`, color: expectancy >= 0 ? 'text-accent-success' : 'text-accent-danger' },
    { label: 'Gain Moyen', value: `+$${avgWin.toFixed(2)}`, color: 'text-accent-success' },
    { label: 'Perte Moyenne', value: `-$${avgLoss.toFixed(2)}`, color: 'text-accent-danger' },
    { label: 'R:R Moyen', value: avgRR.toFixed(2), color: avgRR >= 2 ? 'text-accent-success' : 'text-accent-warning' },
    { label: 'Streak Max', value: maxWinStreak, color: 'text-accent-primary' },
    { label: 'Gagnants', value: wins.length, color: 'text-accent-success' },
    { label: 'Perdants', value: losses.length, color: 'text-accent-danger' },
    { label: 'Score Moyen', value: trades.length ? (trades.reduce((a, t) => a + t.score, 0) / trades.length).toFixed(0) : 0, color: 'text-accent-primary' },
  ];

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Statistiques Globales</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-dark-900 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1 leading-tight">{stat.label}</p>
            <p className={`text-base font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortIcon({ column, sort }) {
  if (sort.column !== column) return <span className="opacity-20">↕</span>;
  return sort.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

function TradeHistoryTable({ trades, page, setPage, totalPages }) {
  const [sort, setSort] = useState({ column: 'closeTime', direction: 'desc' });

  const handleSort = (col) => {
    setSort(prev => ({
      column: col,
      direction: prev.column === col && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let valA = a[sort.column];
      let valB = b[sort.column];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, sort]);

  const cols = [
    { key: 'pair', label: 'Paire' },
    { key: 'direction', label: 'Dir.' },
    { key: 'entryPrice', label: 'Entrée' },
    { key: 'exitPrice', label: 'Sortie' },
    { key: 'pips', label: 'Pips' },
    { key: 'pl', label: 'P&L ($)' },
    { key: 'score', label: 'Score' },
    { key: 'duration', label: 'Durée' },
    { key: 'closeTime', label: 'Date' },
  ];

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-dark-700 bg-dark-900">
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <span className="text-slate-600 ml-0.5"><SortIcon column={col.key} sort={sort} /></span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade, idx) => (
              <motion.tr
                key={trade.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`border-b border-dark-700 tr-hover text-xs ${trade.isWin ? 'bg-accent-success/2' : 'bg-accent-danger/2'}`}
              >
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-slate-200">{trade.pair.replace('_', '/')}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    trade.direction === 'BUY' ? 'bg-accent-success/15 text-accent-success' : 'bg-accent-danger/15 text-accent-danger'
                  }`}>
                    {trade.direction}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-slate-400">
                  {trade.entryPrice.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                </td>
                <td className="px-4 py-2.5 font-mono text-slate-400">
                  {trade.exitPrice.toFixed(trade.pair.includes('JPY') ? 3 : 5)}
                </td>
                <td className={`px-4 py-2.5 font-mono font-semibold ${trade.pips >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                  {trade.pips >= 0 ? '+' : ''}{trade.pips}
                </td>
                <td className={`px-4 py-2.5 font-mono font-bold ${trade.pl >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                  {trade.pl >= 0 ? '+' : ''}${trade.pl.toFixed(2)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-primary"
                        style={{ width: `${trade.score}%` }}
                      />
                    </div>
                    <span className="text-slate-400">{trade.score}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{trade.duration}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {format(new Date(trade.closeTime), 'dd/MM/yy HH:mm')}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
        <span className="text-xs text-slate-500">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg bg-dark-700 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, page - 2) + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  page === pageNum ? 'bg-accent-primary text-dark-900 font-semibold' : 'bg-dark-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg bg-dark-700 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthlyChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400">{label}</p>
        <p className={val >= 0 ? 'text-accent-success' : 'text-accent-danger'}>
          {val >= 0 ? '+' : ''}${val?.toFixed(2)}
        </p>
        <p className="text-slate-500">{payload[1]?.value} trades</p>
      </div>
    );
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Performance Mensuelle</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.pl >= 0 ? '#00ff88' : '#ff4444'} opacity={0.8} />
            ))}
          </Bar>
          <Bar dataKey="trades" fill="#1e2a4a" radius={[2, 2, 0, 0]} yAxisId="right" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PairPieChart({ trades }) {
  const pairStats = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!map[t.pair]) map[t.pair] = { pair: t.pair, wins: 0, total: 0 };
      map[t.pair].total++;
      if (t.isWin) map[t.pair].wins++;
    });
    return Object.values(map)
      .map(p => ({ ...p, name: p.pair.replace('_', '/'), value: p.total, winRate: (p.wins / p.total * 100).toFixed(1) }))
      .sort((a, b) => b.total - a.total);
  }, [trades]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-200 font-semibold">{d.name}</p>
        <p className="text-accent-primary">{d.total} trades</p>
        <p className="text-accent-success">Win rate: {d.winRate}%</p>
      </div>
    );
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Trades par Paire</h3>
      <div className="flex items-center">
        <ResponsiveContainer width="60%" height={200}>
          <PieChart>
            <Pie
              data={pairStats}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {pairStats.map((entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {pairStats.map((p, idx) => (
            <div key={p.pair} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
              <span className="text-slate-300 font-medium w-16">{p.name}</span>
              <span className="text-slate-500">{p.total} trades</span>
              <span className="text-accent-success ml-auto">{p.winRate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ pair: 'all', from: '', to: '', direction: 'all' });
  const [showFilters, setShowFilters] = useState(false);

  const { data: historyData, isLoading } = useQuery(
    ['trade-history', page, filters],
    () => axios.get('/api/trades/history', {
      params: { page, pair: filters.pair, from: filters.from, to: filters.to, direction: filters.direction, limit: PAGE_SIZE }
    }).then(r => r.data),
    { retry: false, keepPreviousData: true, onError: () => {} }
  );

  const allTrades = historyData?.trades || DEMO_TRADES;
  const totalPages = Math.ceil(allTrades.length / PAGE_SIZE);

  // Apply frontend filters for demo
  const filteredTrades = useMemo(() => {
    return allTrades.filter(t => {
      if (filters.pair !== 'all' && t.pair !== filters.pair) return false;
      if (filters.direction !== 'all' && t.direction !== filters.direction) return false;
      if (filters.from && new Date(t.closeTime) < new Date(filters.from)) return false;
      if (filters.to && new Date(t.closeTime) > new Date(filters.to + 'T23:59:59')) return false;
      return true;
    });
  }, [allTrades, filters]);

  const pagedTrades = filteredTrades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const computedTotalPages = Math.ceil(filteredTrades.length / PAGE_SIZE);

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/trades/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trades_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export CSV téléchargé');
    } catch {
      // Demo: generate CSV from data
      const headers = 'ID,Paire,Direction,Entrée,Sortie,Pips,P&L,Score,Durée,Date\n';
      const rows = filteredTrades.map(t =>
        `${t.id},${t.pair},${t.direction},${t.entryPrice},${t.exitPrice},${t.pips},${t.pl},${t.score},${t.duration},${format(new Date(t.closeTime), 'dd/MM/yyyy HH:mm')}`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trades_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export CSV téléchargé (démo)');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
              showFilters ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'bg-dark-800 border border-dark-600 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter size={14} />
            Filtres
            {(filters.pair !== 'all' || filters.direction !== 'all' || filters.from || filters.to) && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            )}
          </button>
          <span className="text-xs text-slate-500">{filteredTrades.length} trades</span>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-dark-800 border border-dark-600 text-slate-400 hover:text-slate-200 transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 border border-dark-600 rounded-xl p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Paire</label>
              <select
                value={filters.pair}
                onChange={e => setFilters(f => ({ ...f, pair: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">Toutes</option>
                {PAIRS.map(p => <option key={p} value={p}>{p.replace('_', '/')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Direction</label>
              <select
                value={filters.direction}
                onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">Les deux</option>
                <option value="BUY">BUY uniquement</option>
                <option value="SELL">SELL uniquement</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Date de début</label>
              <input
                type="date"
                value={filters.from}
                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Date de fin</label>
              <input
                type="date"
                value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
          <button
            onClick={() => setFilters({ pair: 'all', from: '', to: '', direction: 'all' })}
            className="mt-3 text-xs text-slate-500 hover:text-accent-danger transition-all"
          >
            Réinitialiser les filtres
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <StatsGrid trades={filteredTrades} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyChart data={DEMO_MONTHLY} />
        <PairPieChart trades={filteredTrades} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl h-64 skeleton" />
      ) : pagedTrades.length === 0 ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center">
          <AlertCircle size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Aucun trade pour ce filtre</p>
        </div>
      ) : (
        <TradeHistoryTable
          trades={pagedTrades}
          page={page}
          setPage={setPage}
          totalPages={computedTotalPages}
        />
      )}
    </div>
  );
}
