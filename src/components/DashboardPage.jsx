import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Calendar, Clock, MessageSquare, Heart, Brain,
  Activity, Target, Award, ArrowLeft, Smile, Frown, Meh,
  AlertCircle, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Sparkles, ShieldAlert, Ticket, LogOut, Sun, Moon, Loader2, Crown,
  RefreshCw, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCredits } from '../context/CreditContext.jsx';

import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = API_BASE_URL;

const EMOTION_COLORS = {
  happy: '#34d399',
  sad: '#60a5fa',
  neutral: '#94a3b8',
  surprised: '#fbbf24',
  angry: '#f43f5e',
  fear: '#c084fc',
};
const DEFAULT_COLOR = '#94a3b8';

const EMOTION_ICONS = {
  happy: Smile,
  sad: Frown,
  neutral: Meh,
  surprised: Sparkles,
  angry: AlertCircle,
  fear: ShieldAlert,
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme } = useApp();
  const { credits } = useCredits();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchDashboard();
  }, [user]);

  const isDark = theme === 'dark';

  // ── Sub-components ──────────────────────────────────────────────────────────

  const StatCard = ({ icon: Icon, title, value, subtitle, color, glow, trend }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`backdrop-blur-xl rounded-[2.5rem] p-8 border relative overflow-hidden group ${isDark
        ? 'bg-white/[0.03] border-white/10'
        : 'bg-white/60 border-slate-200 shadow-slate-200/50'
        }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${glow || 'bg-white/5'} blur-[60px] rounded-full translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className={`p-4 rounded-2xl border transition-transform group-hover:scale-110 ${isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-slate-100 shadow-sm'
          } ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
            {trend && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-slate-200'
                } ${trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, icon: Icon, children, className = '' }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl rounded-[2.5rem] p-10 border relative overflow-hidden ${className} ${isDark
        ? 'bg-white/[0.03] border-white/10'
        : 'bg-white/60 border-slate-200 shadow-slate-200/50'
        }`}
    >
      <div className="flex items-center space-x-4 mb-10">
        <div className={`p-3 rounded-2xl border ${isDark
          ? 'bg-white/5 border-white/10 text-blue-400'
          : 'bg-white border-slate-200 text-blue-500 shadow-sm'
          }`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className={`font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Loading your analytics…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={fetchDashboard} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const emotionDistribution = (data.emotion_distribution || []).map(e => ({
    ...e,
    color: EMOTION_COLORS[e.name] || DEFAULT_COLOR,
  }));

  const sessionDurations = data.session_durations || [];
  const totalEmotions = emotionDistribution.reduce((s, e) => s + e.value, 0);

  // Category breakdown for bar chart
  const categoryData = Object.entries(data.category_counts || {}).map(([name, count]) => ({ name, count }));

  return (
    <div
      className={`min-h-screen pt-24 px-6 pb-12 lg:px-12 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0f1a] text-slate-200' : 'text-slate-800'}`}
      style={{ background: !isDark ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)' : undefined }}
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
                Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Dashboard</span>
              </h1>
              <p className="text-slate-500 font-medium">Track your emotional wellness journey</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <motion.button onClick={fetchDashboard} whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
              className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 shadow-sm'}`}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            {/* Pro badge */}
            {data.is_pro && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Crown className="w-3 h-3" /> Pro
              </div>
            )}

            {/* Credits */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/buy-credits')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${isDark
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'}`}
            >
              <Ticket className="w-4 h-4" />
              <span className="font-bold">{data.credits} Credits</span>
            </motion.button>

            {/* Theme */}
            <motion.button onClick={toggleTheme} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Logout */}
            <motion.button onClick={logout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 shadow-sm'}`}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>

            {/* Wellness score pill */}
            <div className={`px-6 py-3 border rounded-2xl flex items-center gap-3 shadow-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Wellness Score</p>
                <p className="text-xl font-black">{data.wellness_score}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard icon={Ticket} title="Available Credits" value={`${data.credits}`} subtitle="Valid for all sessions" color="text-amber-400" glow="bg-amber-400/20" />
          <StatCard icon={MessageSquare} title="Total Messages" value={data.total_messages} subtitle="Across all sessions" color="text-blue-400" glow="bg-blue-400/20" />
          <StatCard icon={Target} title="Wellness Index" value={`${data.wellness_score}%`} subtitle="Emotional balance score" color="text-emerald-400" glow="bg-emerald-400/20" />
          <StatCard icon={Activity} title="Therapy Sessions" value={data.total_sessions} subtitle={`Avg ${data.avg_session_duration} min each`} color="text-purple-400" glow="bg-purple-400/20" />
          <StatCard icon={Brain} title="Dominant Mood" value={data.most_frequent_emotion === 'N/A' ? '—' : data.most_frequent_emotion} subtitle="Most detected emotion" color="text-rose-400" glow="bg-rose-400/20" />
          <StatCard icon={Award} title="Credits Purchased" value={data.total_credits_purchased} subtitle={`${data.credits} remaining`} color="text-teal-400" glow="bg-teal-400/20" />
        </div>
      </motion.div>

      {/* ── Charts ── */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 relative z-10">

        {/* Emotion Distribution Pie */}
        <ChartCard title="Emotion Distribution" icon={PieChartIcon}>
          {emotionDistribution.length > 0 ? (
            <>
              <div className="h-72 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total</span>
                  <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalEmotions}</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={emotionDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                      {emotionDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }} formatter={(v) => [v, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {emotionDistribution.map((e, i) => {
                  const Icon = EMOTION_ICONS[e.name] || Brain;
                  const pct = Math.round((e.value / (totalEmotions || 1)) * 100);
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-xs capitalize font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{e.name}</span>
                      </div>
                      <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState icon={Database} message="No emotion data yet" sub="Emotion data is captured during therapy sessions" />
          )}
        </ChartCard>

        {/* Session Activity Bar Chart */}
        <ChartCard title="Session Activity" icon={BarChart3}>
          {sessionDurations.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionDurations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#1a1f2e' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: '12px' }}
                    itemStyle={{ color: isDark ? '#fff' : '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(v, name) => [name === 'messages' ? `${v} msgs` : `${v} min`, name === 'messages' ? 'Messages' : 'Duration']}
                  />
                  <Bar dataKey="messages" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={28} name="messages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart3} message="No sessions yet" sub="Start a therapy session to see activity here" />
          )}
        </ChartCard>

        {/* Category Breakdown */}
        <ChartCard title="Session Categories" icon={LineChartIcon}>
          {categoryData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1f2e' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: '12px' }} itemStyle={{ color: isDark ? '#fff' : '#1e293b', fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Brain} message="No category data yet" sub="Different therapy categories will appear here" />
          )}
        </ChartCard>

        {/* Wellness Insights */}
        <ChartCard title="Wellness Insights" icon={Award}>
          <div className="space-y-5">
            {[
              {
                color: 'bg-purple-400',
                title: 'Emotional Balance',
                body: `Your wellness score of ${data.wellness_score}% shows ${data.wellness_score >= 70 ? 'excellent' : data.wellness_score >= 50 ? 'good' : 'developing'} emotional balance. ${data.most_frequent_emotion !== 'N/A' ? `Your most frequent mood is "${data.most_frequent_emotion}".` : 'Keep tracking to build your profile.'}`,
                border: isDark ? 'hover:border-purple-500/30' : 'hover:border-purple-300',
              },
              {
                color: 'bg-blue-400',
                title: 'Therapy Progress',
                body: `You've completed ${data.total_sessions} session${data.total_sessions !== 1 ? 's' : ''} with ${data.total_messages} total messages exchanged. Average session length: ${data.avg_session_duration} min.`,
                border: isDark ? 'hover:border-blue-500/30' : 'hover:border-blue-300',
              },
              {
                color: 'bg-emerald-400',
                title: 'Credit Usage',
                body: `You have ${data.credits} credits remaining. ${data.total_credits_purchased > 0 ? `You've purchased ${data.total_credits_purchased} credits in total.` : 'Purchase more credits to continue your sessions.'}`,
                border: isDark ? 'hover:border-emerald-500/30' : 'hover:border-emerald-300',
              },
            ].map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border transition-all ${isDark ? `bg-white/5 border-white/5 ${insight.border}` : `bg-slate-50 border-slate-200 ${insight.border}`}`}
              >
                <h3 className={`text-sm font-black mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <div className={`w-2 h-2 rounded-full ${insight.color}`} />
                  {insight.title}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{insight.body}</p>
              </motion.div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, message, sub }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
    <Icon className="w-10 h-10 text-slate-600" />
    <p className="text-slate-400 font-bold">{message}</p>
    <p className="text-slate-600 text-xs">{sub}</p>
  </div>
);

export default DashboardPage;