/**
 * Page d'analyse — Signaux et graphiques
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery } from 'react-query';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, AlertCircle,
  ChevronUp, ChevronDown, Activity, Target, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { WsContext } from '../App';

// ─── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_SIGNALS = [
  {
    id: 'SIG001', pair: 'EUR_USD', direction: 'BUY', score: 78,
    timeframe: 'H1', entry: 1.08542, sl: 1.07842, tp: 1.09942,
    rr: 2.0, pipsSl: 70, pipsTp: 140,
    indicators: {
      ema: { trend: 'bullish', value: 'EMA20 > EMA50 > EMA200' },
      rsi: { value: 52.3, signal: 'neutral' },
      macd: { signal: 'bullish_cross', histogram: 0.0012 },
      bb: { position: 'mid_band', signal: 'neutral' },
      atr: { value: 0.0087, normalized: 'normal' }
    },
    volume: 'above_average',
    session: 'London',
    timestamp: new Date().toISOString()
  },
  {
    id: 'SIG002', pair: 'USD_JPY', direction: 'BUY', score: 83,
    timeframe: 'H4', entry: 149.823, sl: 149.123, tp: 151.223,
    rr: 2.0, pipsSl: 70, pipsTp: 140,
    indicators: {
      ema: { trend: 'bullish', value: 'Alignement haussier' },
      rsi: { value: 61.4, signal: 'bullish' },
      macd: { signal: 'bullish', histogram: 0.18 },
      bb: { position: 'upper_half', signal: 'bullish' },
      atr: { value: 1.23, normalized: 'high' }
    },
    volume: 'high',
    session: 'Tokyo',
    timestamp: new Date().toISOString()
  },
  {
    id: 'SIG003', pair: 'GBP_USD', direction: 'SELL', score: 65,
    timeframe: 'H1', entry: 1.26341, sl: 1.26841, tp: 1.25341,
    rr: 2.0, pipsSl: 50, pipsTp: 100,
    indicators: {
      ema: { trend: 'bearish', value: 'EMA20 < EMA50' },
      rsi: { value: 44.2, signal: 'bearish' },
      macd: { signal: 'bearish_cross', histogram: -0.0008 },
      bb: { position: 'lower_half', signal: 'bearish' },
      atr: { value: 0.0092, normalized: 'normal' }
    },
    volume: 'average',
    session: 'London',
    timestamp: new Date().toISOString()
  },
  {
    id: 'SIG004', pair: 'AUD_USD', direction: 'BUY', score: 58,
    timeframe: 'M15', entry: 0.65123, sl: 0.64773, tp: 0.65823,
    rr: 2.0, pipsSl: 35, pipsTp: 70,
    indicators: {
      ema: { trend: 'neutral', value: 'Prix entre EMAs' },
      rsi: { value: 49.8, signal: 'neutral' },
      macd: { signal: 'neutral', histogram: 0.0001 },
      bb: { position: 'mid_band', signal: 'neutral' },
      atr: { value: 0.0045, normalized: 'low' }
    },
    volume: 'below_average',
    session: 'New York',
    timestamp: new Date().toISOString()
  }
];

const PAIRS = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD', 'EUR_GBP'];
const TIMEFRAMES = ['M15', 'H1', 'H4', 'D1'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD'];

// Generate heatmap data
function generateHeatmap() {
  const data = {};
  CURRENCIES.forEach(c => {
    data[c] = (Math.random() * 2 - 1).toFixed(3);
  });
  return data;
}

const DEMO_HEATMAP = generateHeatmap();

// ─── Components ───────────────────────────────────────────────────────────────

function ScoreBar({ score }) {
  const color = score >= 75 ? '#00ff88' : score >= 55 ? '#ffaa00' : '#ff4444';
  const label = score >= 75 ? 'FORT' : score >= 55 ? 'MODÉRÉ' : 'FAIBLE';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
      <span className="text-xs font-semibold w-12" style={{ color }}>{label}</span>
    </div>
  );
}

function IndicatorBadge({ signal }) {
  const map = {
    bullish: { bg: 'bg-accent-success/10', text: 'text-accent-success', label: 'HAUSSIER' },
    bullish_cross: { bg: 'bg-accent-success/10', text: 'text-accent-success', label: 'CROISEMENT ↑' },
    bearish: { bg: 'bg-accent-danger/10', text: 'text-accent-danger', label: 'BAISSIER' },
    bearish_cross: { bg: 'bg-accent-danger/10', text: 'text-accent-danger', label: 'CROISEMENT ↓' },
    neutral: { bg: 'bg-dark-700', text: 'text-slate-400', label: 'NEUTRE' },
    upper_half: { bg: 'bg-accent-success/10', text: 'text-accent-success', label: 'ZONE HAUTE' },
    lower_half: { bg: 'bg-accent-danger/10', text: 'text-accent-danger', label: 'ZONE BASSE' },
    mid_band: { bg: 'bg-dark-700', text: 'text-slate-400', label: 'MILIEU' },
  };
  const s = map[signal] || map.neutral;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${s.bg} ${s.text} font-semibold`}>
      {s.label}
    </span>
  );
}

function SignalCard({ signal, onViewChart, delay = 0 }) {
  const isLong = signal.direction === 'BUY';
  const isJPY = signal.pair.includes('JPY');
  const decimals = isJPY ? 3 : 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`bg-dark-800 border rounded-xl overflow-hidden card-hover ${
        isLong ? 'border-accent-success/20' : 'border-accent-danger/20'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 ${isLong ? 'bg-accent-success/5' : 'bg-accent-danger/5'}`}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-200">{signal.pair.replace('_', '/')}</span>
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            isLong ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-danger/20 text-accent-danger'
          }`}>
            {isLong ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {signal.direction}
          </span>
          <span className="text-xs text-slate-500 bg-dark-700 px-2 py-0.5 rounded">{signal.timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{signal.session}</span>
          <Clock size={12} className="text-slate-600" />
        </div>
      </div>

      {/* Score */}
      <div className="px-5 py-3 border-b border-dark-700">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-slate-500">Score Signal</span>
        </div>
        <ScoreBar score={signal.score} />
      </div>

      {/* Levels */}
      <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-dark-700">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-0.5">Entrée</p>
          <p className="text-sm font-mono font-semibold text-slate-200">{signal.entry.toFixed(decimals)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-accent-danger mb-0.5">Stop Loss</p>
          <p className="text-sm font-mono font-semibold text-accent-danger">{signal.sl.toFixed(decimals)}</p>
          <p className="text-xs text-slate-600">{signal.pipsSl} pips</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-accent-success mb-0.5">Take Profit</p>
          <p className="text-sm font-mono font-semibold text-accent-success">{signal.tp.toFixed(decimals)}</p>
          <p className="text-xs text-slate-600">{signal.pipsTp} pips</p>
        </div>
      </div>

      {/* R:R */}
      <div className="px-5 py-2.5 border-b border-dark-700 flex items-center justify-between">
        <span className="text-xs text-slate-500">Ratio Risque/Rendement</span>
        <span className={`text-sm font-bold font-mono ${signal.rr >= 2 ? 'text-accent-success' : signal.rr >= 1.5 ? 'text-accent-warning' : 'text-accent-danger'}`}>
          1 : {signal.rr.toFixed(1)}
        </span>
      </div>

      {/* Indicators */}
      <div className="px-5 py-3 space-y-2">
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Indicateurs</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">EMA</span>
            <IndicatorBadge signal={signal.indicators.ema.trend} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">RSI</span>
            <span className={`font-mono font-semibold ${
              signal.indicators.rsi.value > 70 ? 'text-accent-danger' :
              signal.indicators.rsi.value < 30 ? 'text-accent-success' : 'text-slate-300'
            }`}>
              {signal.indicators.rsi.value.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">MACD</span>
            <IndicatorBadge signal={signal.indicators.macd.signal} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Bollinger</span>
            <IndicatorBadge signal={signal.indicators.bb.position} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <button
          onClick={() => onViewChart(signal.pair, signal.timeframe)}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 transition-all"
        >
          Voir Graphique TradingView
        </button>
      </div>
    </motion.div>
  );
}

// TradingView Widget
function TradingViewWidget({ symbol, interval }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  const intervalMap = { M15: '15', H1: '60', H4: '240', D1: 'D' };
  const tvInterval = intervalMap[interval] || '60';
  const tvSymbol = `OANDA:${symbol.replace('_', '')}`;

  useEffect(() => {
    if (!containerRef.current) return;
    // Clean previous widget
    containerRef.current.innerHTML = '';

    // Create container div with unique id
    const containerId = `tv-chart-${Date.now()}`;
    const el = document.createElement('div');
    el.id = containerId;
    containerRef.current.appendChild(el);

    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: tvInterval,
          container_id: containerId,
          theme: 'dark',
          style: '1',
          locale: 'fr',
          toolbar_bg: '#12121a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: '#0a0a0f',
          gridColor: '#1a1a2e',
          studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BB@tv-basicstudies'],
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#00ff88',
            'mainSeriesProperties.candleStyle.downColor': '#ff4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00ff88',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ff4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00ff88',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ff4444',
          }
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, interval, tvSymbol, tvInterval]);

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-200">{symbol.replace('_', '/')}</span>
          <span className="text-xs bg-dark-700 px-2 py-0.5 rounded text-slate-400">{interval}</span>
          <span className="text-xs text-accent-primary">TradingView Chart</span>
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-accent-primary transition-all"
        >
          Ouvrir dans TradingView ↗
        </a>
      </div>
      <div ref={containerRef} style={{ height: '480px' }} className="w-full" />
    </div>
  );
}

// Currency Heatmap
function CurrencyHeatmap({ heatmapData }) {
  const currencies = CURRENCIES;

  const getColor = (val) => {
    const v = parseFloat(val);
    if (v >= 0.5) return { bg: 'bg-accent-success', opacity: 'opacity-90', text: 'text-dark-900' };
    if (v >= 0.2) return { bg: 'bg-accent-success', opacity: 'opacity-50', text: 'text-accent-success' };
    if (v >= -0.2) return { bg: 'bg-dark-600', opacity: 'opacity-100', text: 'text-slate-400' };
    if (v >= -0.5) return { bg: 'bg-accent-danger', opacity: 'opacity-50', text: 'text-accent-danger' };
    return { bg: 'bg-accent-danger', opacity: 'opacity-90', text: 'text-white' };
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Force des Devises</h3>

      {/* Strength bars */}
      <div className="space-y-2">
        {currencies.map(currency => {
          const val = parseFloat(heatmapData[currency] || 0);
          const normalized = ((val + 1) / 2) * 100;
          const { text } = getColor(val);

          return (
            <div key={currency} className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-300 w-8">{currency}</span>
              <div className="flex-1 h-5 bg-dark-700 rounded overflow-hidden relative">
                <div className="absolute inset-y-0 left-1/2 w-px bg-dark-600 z-10" />
                {val >= 0 ? (
                  <div
                    className="absolute inset-y-0 bg-accent-success/40 rounded"
                    style={{ left: '50%', width: `${normalized - 50}%` }}
                  />
                ) : (
                  <div
                    className="absolute inset-y-0 bg-accent-danger/40 rounded"
                    style={{ right: '50%', width: `${50 - normalized}%` }}
                  />
                )}
              </div>
              <span className={`text-xs font-mono w-14 text-right font-semibold ${val >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {val >= 0 ? '+' : ''}{val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pair correlation grid */}
      <div className="mt-4">
        <p className="text-xs text-slate-600 mb-3">Matrice des Paires</p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="w-8"></th>
                {currencies.map(c => (
                  <th key={c} className="text-slate-500 font-normal pb-1 text-center w-10">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currencies.map(rowCurr => (
                <tr key={rowCurr}>
                  <td className="text-slate-500 pr-2 font-semibold py-0.5">{rowCurr}</td>
                  {currencies.map(colCurr => {
                    if (rowCurr === colCurr) {
                      return (
                        <td key={colCurr} className="text-center py-0.5">
                          <div className="w-8 h-6 bg-dark-700 rounded mx-auto flex items-center justify-center">
                            <span className="text-slate-600">—</span>
                          </div>
                        </td>
                      );
                    }
                    const corr = parseFloat(heatmapData[rowCurr]) - parseFloat(heatmapData[colCurr]);
                    const normalized = Math.min(Math.max(corr, -1), 1);
                    const { bg, opacity, text } = getColor(normalized);
                    return (
                      <td key={colCurr} className="text-center py-0.5">
                        <div className={`w-8 h-6 ${bg} ${opacity} rounded mx-auto flex items-center justify-center`}>
                          <span className={`${text} font-mono`} style={{ fontSize: '9px' }}>
                            {normalized.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Pair performance bar chart
function PairPerformanceChart({ signals }) {
  const pairData = PAIRS.slice(0, 6).map(pair => {
    const pairSignals = signals.filter(s => s.pair === pair);
    return {
      pair: pair.replace('_', '/'),
      score: pairSignals.length > 0 ? pairSignals[0].score : Math.floor(Math.random() * 40 + 40),
      count: pairSignals.length
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-200">{payload[0]?.payload?.pair}</p>
        <p className="text-accent-primary">Score: {payload[0]?.value}</p>
      </div>
    );
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Score par Paire</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={pairData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
          <XAxis dataKey="pair" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" fill="#00d4ff" radius={[4, 4, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Analysis Page ────────────────────────────────────────────────────────────
export default function Analysis() {
  const [selectedPair, setSelectedPair] = useState('EUR_USD');
  const [selectedTf, setSelectedTf] = useState('H1');
  const [filterPair, setFilterPair] = useState('all');
  const [showChart, setShowChart] = useState(true);
  const wsCtx = useContext(WsContext);
  const prices = wsCtx?.data?.prices || {};

  const { data: signalsData, isLoading: signalsLoading, refetch, isFetching } = useQuery(
    ['signals', selectedTf],
    () => axios.get(`/api/signals/current?timeframe=${selectedTf}`).then(r => r.data),
    { retry: false, refetchInterval: 30000, onError: () => {} }
  );

  const { data: heatmapData } = useQuery(
    'heatmap',
    () => axios.get('/api/signals/heatmap').then(r => r.data),
    { retry: false, refetchInterval: 60000, onError: () => {} }
  );

  const signals = signalsData?.signals || DEMO_SIGNALS;
  const heatmap = heatmapData?.currencies || DEMO_HEATMAP;

  const filteredSignals = filterPair === 'all' ? signals : signals.filter(s => s.pair === filterPair);

  const handleViewChart = (pair, tf) => {
    setSelectedPair(pair);
    setSelectedTf(tf);
    setShowChart(true);
    setTimeout(() => {
      document.getElementById('chart-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Filtres */}
      <div className="flex flex-wrap items-center gap-4 bg-dark-800 border border-dark-600 rounded-xl p-4">
        {/* Pair filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Paire:</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterPair('all')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${filterPair === 'all' ? 'bg-accent-primary text-dark-900 font-semibold' : 'bg-dark-700 text-slate-500 hover:text-slate-300'}`}
            >
              TOUTES
            </button>
            {PAIRS.slice(0, 6).map(p => (
              <button
                key={p}
                onClick={() => setFilterPair(p)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${filterPair === p ? 'bg-accent-primary text-dark-900 font-semibold' : 'bg-dark-700 text-slate-500 hover:text-slate-300'}`}
              >
                {p.replace('_', '/')}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Timeframe:</span>
          <div className="flex gap-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${selectedTf === tf ? 'bg-accent-secondary text-white font-semibold' : 'bg-dark-700 text-slate-500 hover:text-slate-300'}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg bg-dark-700 text-slate-500 hover:text-accent-primary transition-all ml-1"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Row 2: Signal Cards */}
      {signalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-dark-800 border border-dark-600 rounded-xl h-80 skeleton" />
          ))}
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center">
          <AlertCircle size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Aucun signal actif pour ce filtre</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredSignals.slice(0, 4).map((signal, idx) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onViewChart={handleViewChart}
              delay={idx * 0.05}
            />
          ))}
        </div>
      )}

      {/* Row 3: TradingView Chart */}
      <div id="chart-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Graphique en Direct</h2>
          <div className="flex gap-2">
            {PAIRS.slice(0, 6).map(pair => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  selectedPair === pair ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'bg-dark-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {pair.replace('_', '/')}
              </button>
            ))}
          </div>
        </div>
        <TradingViewWidget symbol={selectedPair} interval={selectedTf} />
      </div>

      {/* Row 4: Heatmap + Pair Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CurrencyHeatmap heatmapData={heatmap} />
        <PairPerformanceChart signals={signals} />
      </div>
    </div>
  );
}
