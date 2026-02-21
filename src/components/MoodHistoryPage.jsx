import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Calendar, Clock, ArrowLeft, Activity,
  Sun, Moon, LogOut, Ticket,
  Smile, Frown, Meh, AlertCircle, Sparkles, ShieldAlert, MessageSquare,
  Brain, ChevronDown, ChevronUp, Loader2, Database, Crown, RefreshCw, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCredits } from '../context/CreditContext';
import { deleteSession } from '../utils/proApi';

import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = API_BASE_URL;

const EMOTION_COLORS_TEXT = {
  happy: 'text-emerald-400',
  sad: 'text-blue-400',
  neutral: 'text-slate-400',
  surprised: 'text-amber-400',
  angry: 'text-rose-400',
  fear: 'text-purple-400',
};
const EMOTION_COLORS_BG = {
  happy: 'bg-emerald-400/10 border-emerald-400/20',
  sad: 'bg-blue-400/10 border-blue-400/20',
  neutral: 'bg-slate-400/10 border-slate-400/20',
  surprised: 'bg-amber-400/10 border-amber-400/20',
  angry: 'bg-rose-400/10 border-rose-400/20',
  fear: 'bg-purple-400/10 border-purple-400/20',
};
const EMOTION_ICONS = {
  happy: Smile,
  sad: Frown,
  neutral: Meh,
  surprised: Sparkles,
  angry: AlertCircle,
  fear: ShieldAlert,
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, glow, trend, theme }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className={`backdrop-blur-xl rounded-[2rem] p-8 border relative overflow-hidden group ${theme === 'dark'
      ? 'bg-white/[0.03] border-white/10'
      : 'bg-white/60 border-slate-200 shadow-slate-200/50'
      }`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 ${glow} blur-[60px] rounded-full translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative z-10 flex flex-col items-start gap-4">
      <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-100 shadow-sm'} ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} ${trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// ── Session Row ──────────────────────────────────────────────────────────────
const SessionRow = ({ session, index, theme, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === 'dark';

  const startDate = session.started_at
    ? new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date';
  const startTime = session.started_at
    ? new Date(session.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border transition-all overflow-hidden ${isDark
        ? 'bg-white/[0.02] border-white/5 hover:border-white/10'
        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
    >
      {/* Row header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            {index + 1}
          </div>
          <div>
            <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {session.session_title || session.category || 'Therapy Session'}
            </p>
            <p className="text-xs text-slate-500 font-medium">{startDate} · {startTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-teal-400/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
            {session.duration > 0 ? `${session.duration}m` : 'Active'}
          </span>
          <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <MessageSquare className="w-3 h-3" /> {session.message_count}
          </span>
          {session.is_active && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Live</span>
          )}
          {expanded
            ? <ChevronUp className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            : <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          }
        </div>
      </button>

      {/* Expanded messages preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`border-t px-5 pb-5 pt-4 space-y-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}
          >
            {session.messages.length > 0 ? session.messages.map((msg, mi) => (
              <div key={mi} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.sender === 'user'
                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                  {msg.sender === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                  ? isDark ? 'bg-blue-500/20 text-blue-100' : 'bg-blue-50 text-blue-800'
                  : isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-700'
                  }`}>
                  {msg.message_text.length > 160 ? msg.message_text.slice(0, 160) + '…' : msg.message_text}
                  {msg.emotion_detected && (
                    <span className={`ml-2 text-[10px] font-bold capitalize ${EMOTION_COLORS_TEXT[msg.emotion_detected] || 'text-slate-400'}`}>
                      [{msg.emotion_detected}]
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-xs text-center py-2">No messages preview available</p>
            )}

            <div className="flex justify-center pt-2">
              <motion.button
                whileHover={{ scale: 1.05, bg: 'rgba(239, 68, 68, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(session.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-red-400 border border-red-400/20 hover:border-red-400/50`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Session History
              </motion.button>
            </div>

            {session.message_count > 5 && (
              <p className="text-center text-[10px] text-slate-500 font-medium pt-1">
                + {session.message_count - 5} more messages in this session
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const MoodHistoryPage = () => {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useApp();
  const { credits } = useCredits();
  const isDark = theme === 'dark';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/api/mood-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch mood history');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Permanent delete? This cannot be undone.')) return;
    try {
      await deleteSession(sessionId);
      setData(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId)
      }));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className={`font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Loading your history…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const sessions = data.sessions || [];

  // Compute stats
  const totalMessages = sessions.reduce((s, sess) => s + sess.message_count, 0);
  const totalDuration = sessions.reduce((s, sess) => s + sess.duration, 0);
  const uniqueDays = new Set(sessions.map(s => s.started_at?.slice(0, 10))).size;

  // Emotion counts across all messages
  const emotionCounts = {};
  sessions.forEach(s => {
    s.messages.forEach(m => {
      if (m.emotion_detected) {
        const e = m.emotion_detected.toLowerCase();
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      }
    });
  });
  const topEmotions = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  const totalEmotions = Object.values(emotionCounts).reduce((s, v) => s + v, 0);

  // Filter sessions
  const filteredSessions = filter === 'all'
    ? sessions
    : filter === 'active'
      ? sessions.filter(s => s.is_active)
      : sessions.filter(s => !s.is_active);

  return (
    <div
      className={`min-h-screen pt-24 px-6 pb-12 lg:px-12 relative overflow-hidden ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
      style={{ background: isDark ? '#0a0f1a' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)' }}
    >
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto mb-12 relative z-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <motion.button
              onClick={() => navigate('/emotion-detection')}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white border-white/10' : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200 shadow-sm'}`}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className={`text-4xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mood <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Insights</span>
              </h1>
              <p className="text-slate-500 font-medium">Your complete therapy session history</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Refresh */}
            <motion.button onClick={fetchHistory} whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
              className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 shadow-sm'}`}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            {data.is_pro && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Crown className="w-3 h-3" /> Pro
              </div>
            )}

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/buy-credits')}
              className={`hidden md:flex px-4 py-2 rounded-xl items-center gap-2 border transition-all ${isDark
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'}`}
            >
              <Ticket className="w-4 h-4" />
              <span className="font-bold">{credits} Credits</span>
            </motion.button>

            <motion.button onClick={toggleTheme} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <motion.button onClick={logout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 shadow-sm'}`}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>

            <div className={`px-4 py-2 rounded-xl text-slate-400 text-sm font-bold flex items-center gap-2 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Sessions" value={sessions.length} icon={MessageSquare} color="text-blue-400" glow="bg-blue-400/20" trend={sessions.length > 0 ? `+${sessions.length}` : undefined} theme={theme} />
          <StatCard title="Total Messages" value={totalMessages} icon={TrendingUp} color="text-emerald-400" glow="bg-emerald-400/20" theme={theme} />
          <StatCard title="Days Active" value={uniqueDays} icon={Calendar} color="text-purple-400" glow="bg-purple-400/20" theme={theme} />
          <StatCard title="Total Time" value={`${totalDuration}m`} icon={Clock} color="text-teal-400" glow="bg-teal-400/20" theme={theme} />
        </div>
      </motion.div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 relative z-10">

        {/* Session Timeline — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className={`lg:col-span-2 backdrop-blur-xl rounded-[2.5rem] p-8 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Session History</h2>
            <div className="flex gap-2">
              {['all', 'active', 'ended'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize transition-all ${filter === f
                    ? 'bg-blue-500 text-white'
                    : isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session, i) => (
                <SessionRow key={session.id} session={session} index={i} theme={theme} onDelete={handleDeleteSession} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <Database className={`w-14 h-14 mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
              <p className={`font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {filter === 'all' ? 'Start a therapy session to build your history' : `Switch to "all" to see all sessions`}
              </p>
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Mood Balance */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className={`backdrop-blur-xl rounded-[2.5rem] p-8 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'}`}
          >
            <h2 className={`text-xl font-black mb-8 ${isDark ? 'text-white' : 'text-slate-800'}`}>Mood Balance</h2>

            {topEmotions.length > 0 ? (
              <div className="space-y-5">
                {topEmotions.map(([emotion, count]) => {
                  const pct = Math.round((count / (totalEmotions || 1)) * 100);
                  const Icon = EMOTION_ICONS[emotion] || Brain;
                  return (
                    <div key={emotion} className="flex items-center gap-3 group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${EMOTION_COLORS_BG[emotion] || 'bg-slate-400/10 border-slate-400/20'} ${EMOTION_COLORS_TEXT[emotion] || 'text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-bold capitalize ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{emotion}</span>
                          <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{pct}%</span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full rounded-full ${EMOTION_COLORS_TEXT[emotion]?.replace('text-', 'bg-') || 'bg-slate-400'}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 opacity-50">
                <Brain className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-500 text-sm">Mood data appears as you chat</p>
              </div>
            )}
          </motion.div>

          {/* Recent Sessions Summary */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className={`backdrop-blur-xl rounded-[2.5rem] p-8 border ${isDark
              ? 'bg-gradient-to-br from-blue-600/10 to-teal-500/5 border-blue-500/10'
              : 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200 shadow-sm'
              }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Sessions</h2>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Activity className="w-4 h-4" />
              </div>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((session, i) => (
                  <div key={session.id}
                    className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-100 hover:border-blue-300 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {session.started_at ? new Date(session.started_at).toLocaleDateString() : 'Unknown'}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{session.category}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-teal-400/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                        {session.duration > 0 ? `${session.duration}m` : 'Active'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <MessageSquare className="w-3 h-3" />
                      {session.message_count} messages
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className={`text-sm font-bold mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No sessions yet</p>
                <p className={`text-xs ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>Start a chat to track progress</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MoodHistoryPage;