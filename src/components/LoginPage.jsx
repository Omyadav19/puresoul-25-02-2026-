import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle,
    Sun, Moon, Sparkles, Crown, Brain, History, Mic, Shield,
    ChevronRight, ArrowLeft, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { validateEmail, validateUsername, validatePassword } from '../utils/auth.js';

import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';

const DISPLAY_TIERS = [
    {
        id: 'pro',
        name: 'Pro Member',
        price: '₹149/mo',
        credits: 30,
        color: 'purple',
        icon: Mic,
        features: ['30 Monthly Credits', 'Voice Therapy (TTS)', 'Priority AI Engine', 'Pro Badge']
    },
    {
        id: 'plus',
        name: 'Plus Member',
        price: '₹299/mo',
        credits: 50,
        color: 'pink',
        icon: Brain,
        features: ['50 Monthly Credits', 'AI Memory/Continuity', 'Voice Therapy Included', 'Everything in Pro']
    }
];

// ── Compact input ─────────────────────────────────────────────────────────────
const Input = ({ icon: Icon, type = 'text', placeholder, value, onChange, required, isDark, right }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />}
        <input
            type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
            className={`w-full ${Icon ? 'pl-9' : 'pl-3'} ${right ? 'pr-9' : 'pr-3'} py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/20
        ${isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`}
        />
        {right}
    </div>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser, theme, toggleTheme } = useApp();
    const isDark = theme === 'dark';

    const [mode, setMode] = useState('login');   // 'login' | 'register'
    const [wantsPro, setWantsPro] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [activeTier, setActiveTier] = useState('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    const isLogin = mode === 'login';
    const isRegister = mode === 'register';

    // Stable particles
    const particles = useMemo(() =>
        Array.from({ length: 14 }, (_, i) => ({
            w: Math.random() * 4 + 2,
            h: Math.random() * 4 + 2,
            left: Math.random() * 100,
            top: Math.random() * 100,
            dur: Math.random() * 5 + 4,
            del: Math.random() * 3,
            blue: i % 2 === 0,
        })), []);

    const vField = (field, value) => {
        const e = { ...errors };
        if (field === 'email') { if (value && !validateEmail(value)) e.email = 'Invalid email'; else delete e.email; }
        if (field === 'username') { const r = validateUsername(value); if (r.length) e.username = r[0]; else delete e.username; }
        if (field === 'password') { const r = validatePassword(value); if (r.length) e.password = r[0]; else delete e.password; }
        if (field === 'name') { if (value && value.length < 2) e.name = 'Too short'; else delete e.name; }
        setErrors(e);
    };

    const resetForm = () => {
        setErrors({}); setSuccessMsg('');
        setIdentifier(''); setPassword(''); setName(''); setEmail(''); setUsername(''); setWantsPro(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); setErrors({}); setSuccessMsg('');
        try {
            if (isLogin) {
                const res = await fetch(`${BASE_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Login failed.');
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user || {}));
                setUser({ ...data.user });
                setSuccessMsg('Login successful!');
                setTimeout(() => navigate('/welcome'), 900);
            } else {
                const res = await fetch(`${BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, username, password, tier: activeTier })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Registration failed.');

                if (wantsPro) {
                    const lr = await fetch(`${BASE_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: username, password }) });
                    const ld = await lr.json();
                    if (lr.ok) {
                        await fetch(`${BASE_URL}/api/pro/upgrade`, { method: 'POST', headers: { Authorization: `Bearer ${ld.token}`, 'Content-Type': 'application/json' } });
                        const u = { ...ld.user, is_pro: true };
                        localStorage.setItem('authToken', ld.token);
                        localStorage.setItem('userData', JSON.stringify(u));
                        setUser(u);
                        setSuccessMsg('Welcome to Puresoul Pro! 🎉');
                        setTimeout(() => navigate('/welcome'), 1000);
                        return;
                    }
                }
                setSuccessMsg('Account created! Signing you in…');
                setTimeout(() => { setMode('login'); setIdentifier(username); setPassword(''); setSuccessMsg(''); }, 1800);
            }
        } catch (err) {
            setErrors({ general: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const bg = isDark
        ? 'linear-gradient(135deg,#060b14 0%,#0a0f1a 60%,#060b14 100%)'
        : 'linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 60%,#f0f4ff 100%)';

    return (
        <div className="h-screen overflow-hidden flex relative" style={{ background: bg }}>
            {/* ── Particles ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((p, i) => (
                    <motion.div key={i}
                        className="absolute rounded-full"
                        style={{
                            width: p.w, height: p.h,
                            left: `${p.left}%`, top: `${p.top}%`,
                            background: `rgba(${p.blue ? '59,130,246' : '20,184,166'},0.45)`,
                            boxShadow: `0 0 6px rgba(59,130,246,0.4)`,
                        }}
                        animate={{ y: [0, -50, 0], opacity: [0.2, 0.7, 0.2] }}
                        transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.del }}
                    />
                ))}
            </div>

            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-600/10 blur-[130px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="absolute top-5 right-5 z-50">
                <motion.button onClick={toggleTheme} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className={`p-2.5 rounded-full backdrop-blur-md border shadow-lg ${isDark ? 'bg-white/10 border-white/20 text-yellow-400' : 'bg-white/80 border-white/40 text-slate-700'}`}
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>
            </div>

            <AnimatePresence>
                {isRegister && (
                    <motion.div
                        key="pro-panel"
                        initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="hidden lg:flex flex-col justify-center w-[35%] flex-shrink-0 px-16 py-10 relative z-10 bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.1)]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Heart className="w-6 h-6 text-white fill-white" />
                            </div>
                            <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Puresoul AI</span>
                        </div>

                        <h2 className={`text-3xl font-black leading-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Choose your path to<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">total wellness</span>
                        </h2>

                        <div className="space-y-4">
                            {DISPLAY_TIERS.map((tier) => (
                                <motion.div
                                    key={tier.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-3xl border transition-all ${isDark
                                        ? 'bg-white/[0.04] border-white/10 hover:border-white/20'
                                        : 'bg-white border-slate-200 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${tier.color}-500/10 border border-${tier.color}-500/20`}>
                                                <tier.icon className={`w-5 h-5 text-${tier.color}-400`} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{tier.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tier.price}</p>
                                            </div>
                                        </div>
                                        {tier.id === 'plus' && (
                                            <div className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 text-[9px] font-black uppercase">Best Value</div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                                        {tier.features.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center bg-${tier.color}-500/20 text-${tier.color}-400`}>
                                                    <Check className="w-2 h-2" />
                                                </div>
                                                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <p className={`mt-8 text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            All plans include advanced emotion detection and confidential sessions.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`flex-1 flex items-center justify-center px-10 py-10 relative z-10 ${isDark ? 'bg-[#060b14]/30' : 'bg-white/60'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className={`w-full max-w-2xl p-10 lg:p-14 rounded-[3.5rem] border transition-all duration-500 ${isDark
                            ? 'bg-[#0f172a]/60 border-white/10 shadow-2xl shadow-indigo-500/10 backdrop-blur-3xl'
                            : 'bg-white border-white/60 shadow-2xl shadow-blue-500/10'
                            }`}
                    >
                        <div className={`${isLogin ? 'text-center mb-6' : 'mb-4'}`}>
                            {isLogin && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 mb-4 shadow-xl shadow-blue-500/20"
                                >
                                    <Heart className="w-7 h-7 text-white fill-current" />
                                </motion.div>
                            )}

                            {isRegister && (
                                <div className="flex items-center justify-between mb-3">
                                    <button onClick={() => { setMode('login'); resetForm(); }}
                                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                                    </button>
                                    <div className="flex items-center gap-2 lg:hidden">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                                            <Heart className="w-4 h-4 text-white fill-white" />
                                        </div>
                                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Puresoul AI</span>
                                    </div>
                                </div>
                            )}

                            <h1 className={`font-black ${isDark ? 'text-white' : 'text-slate-900'} ${isLogin ? 'text-3xl' : 'text-2xl'}`}>
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </h1>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isLogin ? 'Continue your wellness journey' : 'Start healing with AI-powered therapy'}
                            </p>
                        </div>

                        <div className={`rounded-2xl border backdrop-blur-xl shadow-2xl ${isLogin ? 'p-7' : 'p-5'} ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white/85 border-white/60 shadow-slate-200/60'}`}>
                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="mb-3 rounded-xl px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 overflow-hidden"
                                    >
                                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <p className={`text-xs font-medium ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{successMsg}</p>
                                    </motion.div>
                                )}
                                {errors.general && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="mb-3 rounded-xl px-3 py-2.5 bg-red-500/10 border border-red-500/20 flex items-center gap-2 overflow-hidden"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>{errors.general}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit}>
                                {isLogin && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Username or Email</label>
                                            <Input icon={User} placeholder="Enter username or email" value={identifier} onChange={e => setIdentifier(e.target.value)} required isDark={isDark} />
                                        </div>
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                                            <Input
                                                icon={Lock} type={showPw ? 'text' : 'password'}
                                                placeholder="Enter your password" value={password}
                                                onChange={e => setPassword(e.target.value)} required isDark={isDark}
                                                right={
                                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {isRegister && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                                                <Input placeholder="John Doe" value={name}
                                                    onChange={e => { setName(e.target.value); vField('name', e.target.value); }}
                                                    required isDark={isDark}
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Username</label>
                                                <Input icon={User} placeholder="user123" value={username}
                                                    onChange={e => { setUsername(e.target.value); vField('username', e.target.value); }}
                                                    required isDark={isDark}
                                                />
                                                {errors.username && <p className="text-red-400 text-[10px] mt-0.5">{errors.username}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                                                <Input icon={Mail} type="email" placeholder="you@email.com" value={email}
                                                    onChange={e => { setEmail(e.target.value); vField('email', e.target.value); }}
                                                    required isDark={isDark}
                                                />
                                                {errors.email && <p className="text-red-400 text-[10px] mt-0.5">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                                                <Input
                                                    icon={Lock} type={showPw ? 'text' : 'password'}
                                                    placeholder="8+ chars" value={password}
                                                    onChange={e => { setPassword(e.target.value); vField('password', e.target.value); }}
                                                    required isDark={isDark}
                                                    right={
                                                        <button type="button" onClick={() => setShowPw(p => !p)}
                                                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    }
                                                />
                                                {errors.password && <p className="text-red-400 text-[10px] mt-0.5">{errors.password}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={`text-[10px] font-bold uppercase tracking-widest block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Membership Tier</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'basic', label: 'Basic', price: 'Free', icon: User, color: 'blue' },
                                                    { id: 'pro', label: 'Pro', price: '₹149', icon: Mic, color: 'purple' },
                                                    { id: 'plus', label: 'Plus', price: '₹299', icon: Brain, color: 'pink' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id} type="button"
                                                        onClick={() => { setActiveTier(t.id); setWantsPro(t.id !== 'basic'); }}
                                                        className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 ${activeTier === t.id
                                                            ? `bg-${t.color}-500/15 border-${t.color}-500/40 shadow-sm`
                                                            : isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${activeTier === t.id ? `bg-${t.color}-500 text-white shadow-md` : isDark ? 'bg-white/5 text-slate-500' : 'bg-white border text-slate-400'}`}>
                                                            <t.icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <p className={`text-[10px] font-black leading-none mb-0.5 ${activeTier === t.id ? `text-${t.color}-400` : isDark ? 'text-white' : 'text-slate-800'}`}>{t.label}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold">{t.price}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02, boxShadow: wantsPro && isRegister ? '0 0 20px rgba(168,85,247,0.35)' : '0 0 20px rgba(59,130,246,0.35)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 ${wantsPro && isRegister
                                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20'
                                        : 'bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 shadow-lg shadow-blue-500/20'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            {isLogin ? 'Signing in…' : wantsPro ? 'Creating Pro account…' : 'Creating account…'}
                                        </div>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            {wantsPro && isRegister && <Crown className="w-3.5 h-3.5" />}
                                            {isLogin ? 'Sign In' : wantsPro ? 'Join as Pro Member' : 'Create Free Account'}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    )}
                                </motion.button>
                            </form>

                            <div className="mt-4 text-center">
                                {isLogin ? (
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Don't have an account?{' '}
                                        <button onClick={() => { setMode('register'); resetForm(); }} className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                            Sign up free
                                        </button>
                                    </p>
                                ) : (
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Already have an account?{' '}
                                        <button onClick={() => { setMode('login'); resetForm(); }} className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                            Sign in
                                        </button>
                                    </p>
                                )}
                            </div>
                        </div>

                        {isLogin && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className={`text-center text-[11px] mt-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}
                            >
                                New here?{' '}
                                <button onClick={() => { setMode('register'); resetForm(); }} className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                                    Explore Pro membership →
                                </button>
                            </motion.p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div >
    );
};

export default LoginPage;
