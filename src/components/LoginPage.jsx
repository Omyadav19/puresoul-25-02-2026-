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

const PRO_FEATURES = [
    { icon: History, text: 'Unlimited session history' },
    { icon: Brain, text: 'AI remembers your past chats' },
    { icon: Mic, text: 'Voice therapy (ElevenLabs TTS)' },
    { icon: Shield, text: 'Priority AI processing' },
    { icon: Crown, text: 'Pro badge & early features' },
    { icon: Sparkles, text: 'Emotional continuity across sessions' },
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
                const res = await fetch(`${BASE_URL}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, username, password }) });
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
                        className="hidden lg:flex flex-col justify-center w-[440px] flex-shrink-0 px-12 py-8 relative z-10"
                    >
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Heart className="w-6 h-6 text-white fill-white" />
                            </div>
                            <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Puresoul AI</span>
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold mb-6 w-fit">
                            <Crown className="w-4 h-4" /> Pro Membership
                        </div>

                        <h2 className={`text-4xl font-black leading-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Unlock your full<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">healing potential</span>
                        </h2>
                        <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Go Pro for just <span className="text-purple-400 font-bold">₹149/month</span> — an AI therapist that truly knows you, remembering every session and emotion.
                        </p>

                        <div className="space-y-4 mb-8">
                            {PRO_FEATURES.map(({ icon: Icon, text }, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className={`flex items-center justify-between px-6 py-4 rounded-2xl border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200 shadow-sm shadow-purple-500/5'}`}>
                            <div>
                                <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">Pro Plan</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹149</span>
                                    <span className="text-slate-400 text-sm">/month</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cancel anytime</p>
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No hidden fees</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`flex-1 flex items-center justify-center px-10 py-6 relative z-10 ${isRegister ? 'lg:border-l lg:border-white/5' : ''}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-xl"
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
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                                                <Input placeholder="Your name" value={name}
                                                    onChange={e => { setName(e.target.value); vField('name', e.target.value); }}
                                                    required isDark={isDark}
                                                />
                                                {errors.name && <p className="text-red-400 text-[10px] mt-0.5">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Username</label>
                                                <Input icon={User} placeholder="username" value={username}
                                                    onChange={e => { setUsername(e.target.value); vField('username', e.target.value); }}
                                                    required isDark={isDark}
                                                />
                                                {errors.username && <p className="text-red-400 text-[10px] mt-0.5">{errors.username}</p>}
                                            </div>
                                        </div>
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
                                                placeholder="8+ chars, upper, number, symbol" value={password}
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
                                        <button
                                            type="button" onClick={() => setWantsPro(p => !p)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 ${wantsPro
                                                ? 'bg-purple-500/15 border-purple-500/40'
                                                : isDark ? 'bg-white/[0.03] border-white/10 hover:border-purple-500/30' : 'bg-slate-50 border-slate-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${wantsPro ? 'bg-purple-500 shadow-md shadow-purple-500/30' : isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
                                                    <Crown className={`w-3.5 h-3.5 ${wantsPro ? 'text-white' : 'text-purple-400'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-xs font-bold leading-tight ${wantsPro ? 'text-purple-300' : isDark ? 'text-white' : 'text-slate-800'}`}>
                                                        Start as Pro Member
                                                    </p>
                                                    <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        ₹149/month · Unlimited history · AI memory · Voice therapy
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${wantsPro ? 'bg-purple-500 border-purple-500' : isDark ? 'border-white/20' : 'border-slate-300'}`}>
                                                {wantsPro && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </button>
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
        </div>
    );
};

export default LoginPage;
