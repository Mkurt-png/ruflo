import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, BarChart2, History, Settings,
  Wifi, WifiOff, TrendingUp, LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';

// ─── WebSocket Context ─────────────────────────────────────────────────────────
export const WsContext = createContext(null);

// ─── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
      retry: 2,
      staleTime: 2000,
      onError: () => {} // suppress global error boundary
    }
  }
});

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { login, loading, error } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary opacity-5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary opacity-5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dark-800 border border-dark-600 mb-4 glow-blue">
            <TrendingUp size={32} className="text-accent-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FOREX BOT</h1>
          <p className="text-slate-500 text-sm mt-1">Trading Automatisé Professionnel</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-slate-200 text-sm placeholder-slate-600 transition-all"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-slate-200 text-sm placeholder-slate-600 transition-all pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-accent-danger/10 border border-accent-danger/30 rounded-lg px-4 py-3 text-accent-danger text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-primary hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-dark-900 font-bold py-3 rounded-lg transition-all text-sm tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  CONNEXION...
                </span>
              ) : 'SE CONNECTER'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Accès sécurisé via JWT • TLS 1.3
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Forex Bot v1.0.0 — Paper Trading Mode
        </p>
      </motion.div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
          isActive
            ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
            : 'text-slate-500 hover:text-slate-300 hover:bg-dark-700'
        }`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-dark-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-dark-600">
          {label}
        </div>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed }) {
  const { logout } = useContext(AuthContext);
  const wsCtx = useContext(WsContext);
  const connected = wsCtx?.connected || false;
  const botStatus = wsCtx?.data?.botStatus || { running: false, mode: 'practice' };

  return (
    <div
      className={`flex flex-col bg-dark-800 border-r border-dark-600 transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-dark-600">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-center">
          <TrendingUp size={16} className="text-accent-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold gradient-text">FOREX BOT</div>
            <div className="text-xs text-slate-600">v1.0.0</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-600 hover:text-slate-400 flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
        <NavItem to="/analysis" icon={BarChart2} label="Analyse" collapsed={collapsed} />
        <NavItem to="/history" icon={History} label="Historique" collapsed={collapsed} />
        <NavItem to="/settings" icon={Settings} label="Paramètres" collapsed={collapsed} />
      </nav>

      {/* Bot Status */}
      <div className="p-2 border-t border-dark-600 space-y-2">
        {/* WS Connection */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${connected ? 'bg-accent-success/5' : 'bg-accent-danger/5'}`}>
          {connected ? (
            <Wifi size={14} className="text-accent-success flex-shrink-0" />
          ) : (
            <WifiOff size={14} className="text-accent-danger flex-shrink-0" />
          )}
          {!collapsed && (
            <span className={`text-xs ${connected ? 'text-accent-success' : 'text-accent-danger'}`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          )}
        </div>

        {/* Bot status indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${botStatus.running ? 'bg-accent-success/5' : 'bg-dark-700'}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${botStatus.running ? 'bg-accent-success pulse-live' : 'bg-slate-600'}`} />
          {!collapsed && (
            <div className="overflow-hidden">
              <div className={`text-xs font-semibold ${botStatus.running ? 'text-accent-success' : 'text-slate-500'}`}>
                {botStatus.running ? 'BOT ACTIF' : 'BOT ARRÊTÉ'}
              </div>
              <div className="text-xs text-slate-600 capitalize">{botStatus.mode}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-accent-danger hover:bg-accent-danger/5 transition-all"
        >
          <LogOut size={14} className="flex-shrink-0" />
          {!collapsed && <span className="text-xs">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Price Ticker ─────────────────────────────────────────────────────────────
function PriceTicker({ prices }) {
  const pairs = Object.entries(prices).slice(0, 6);
  return (
    <div className="flex items-center gap-0 overflow-hidden border-b border-dark-600 bg-dark-800">
      <div className="px-3 py-1.5 bg-dark-700 text-xs text-accent-primary font-bold border-r border-dark-600 whitespace-nowrap">
        LIVE RATES
      </div>
      <div className="flex overflow-x-auto scrollbar-none">
        {pairs.map(([pair, data]) => (
          <div key={pair} className="flex items-center gap-2 px-4 py-1.5 border-r border-dark-700 whitespace-nowrap">
            <span className="text-xs text-slate-400">{pair.replace('_', '/')}</span>
            <span className={`text-xs font-mono font-semibold ${data.changePct >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
              {data.bid?.toFixed(pair.includes('JPY') ? 3 : 5)}
            </span>
            <span className={`text-xs ${data.changePct >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
              {data.changePct >= 0 ? '+' : ''}{data.changePct?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const wsCtx = useContext(WsContext);
  const prices = wsCtx?.data?.prices || {};
  const location = useLocation();

  const pageTitle = {
    '/dashboard': 'Dashboard',
    '/analysis': 'Analyse & Signaux',
    '/history': 'Historique des Trades',
    '/settings': 'Paramètres'
  }[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top ticker */}
        <PriceTicker prices={prices} />

        {/* Page header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-dark-600 bg-dark-800">
          <h1 className="text-base font-semibold text-slate-200">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-dark-700 border border-dark-600 text-slate-500">UTC+0</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ─── WS Provider ──────────────────────────────────────────────────────────────
function WsProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const wsData = useWebSocket(isAuthenticated ? undefined : null);
  return (
    <WsContext.Provider value={wsData}>
      {children}
    </WsContext.Provider>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <WsProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#e2e8f0',
                  border: '1px solid #16213e',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px'
                },
                success: { iconTheme: { primary: '#00ff88', secondary: '#1a1a2e' } },
                error: { iconTheme: { primary: '#ff4444', secondary: '#1a1a2e' } }
              }}
            />

            <Routes>
              <Route path="/login" element={
                auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/analysis" element={
                <ProtectedRoute>
                  <Layout><Analysis /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <Layout><HistoryPage /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout><SettingsPage /></Layout>
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </WsProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
