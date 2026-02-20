import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket, Star, Zap, Crown, ArrowLeft, CheckCircle2, Sparkles,
    History, Brain, Mic, Shield, Check, Sun, Moon, LogOut, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '../context/CreditContext';
import { useApp } from '../context/AppContext';

import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = API_BASE_URL;

const PRO_FEATURES = [
    { icon: History, title: 'Unlimited Session History', desc: 'Every conversation saved forever' },
    { icon: Brain, title: 'AI Memory & Continuity', desc: 'AI remembers your past sessions' },
    { icon: Mic, title: 'Voice Therapy (TTS)', desc: 'ElevenLabs powered voice responses' },
    { icon: Shield, title: 'Priority AI Processing', desc: 'Faster, deeper AI responses' },
    { icon: Crown, title: 'Exclusive Pro Badge', desc: 'Early access to new features' },
    { icon: Sparkles, title: 'Emotional Continuity', desc: 'AI tracks your emotional journey' },
];

const CreditCard = ({ credits, price, popular, features, onSelect, icon: Icon, theme }) => {
    const isDark = theme === 'dark';
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative p-7 rounded-[2rem] border transition-all duration-500 flex flex-col ${popular
                ? 'bg-gradient-to-br from-blue-600/20 to-teal-500/10 border-blue-500/50 shadow-[0_20px_60px_rgba(59,130,246,0.15)]'
                : isDark
                    ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-blue-200 shadow-lg shadow-slate-200/50'
                }`}
        >
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-lg shadow-blue-500/30">
                    Most Popular
                </div>
            )}

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${popular
                ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/30'
                : isDark ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-500'
                }`}>
                <Icon className="w-7 h-7" />
            </div>

            <h3 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{credits} Credits</h3>
            <div className="flex items-baseline gap-1 mb-5">
                <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{price}</span>
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>one-time</span>
            </div>

            <div className="space-y-3 mb-7 flex-1">
                {features.map((f, i) => (
                    <div key={i} className={`flex items-center gap-2.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${popular ? 'text-teal-400' : isDark ? 'text-blue-400/60' : 'text-blue-500/60'}`} />
                        {f}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onSelect(credits, price)}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 ${popular
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                    : isDark
                        ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
            >
                Get {credits} Credits
            </button>
        </motion.div>
    );
};

const BuyCreditsPage = () => {
    const navigate = useNavigate();
    const { credits, addCredits } = useCredits();
    const { theme, toggleTheme, logout, user, setUser } = useApp();
    const isDark = theme === 'dark';

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [proLoading, setProLoading] = useState(false);
    const [proSuccess, setProSuccess] = useState(false);

    const isPro = user?.is_pro || false;

    const packages = [
        {
            credits: 25, price: 199, icon: Zap, popular: false,
            features: ['25 Therapy Messages', 'Emotion Detection', 'Standard AI Support', 'Session Summary'],
        },
        {
            credits: 100, price: 699, icon: Star, popular: true,
            features: ['100 Therapy Messages', 'Priority Processing', 'Deep Context Awareness', 'Extended Sessions'],
        },
        {
            credits: 300, price: 1499, icon: Crown, popular: false,
            features: ['300 Therapy Messages', 'Unlimited History', 'Voice Support Enabled', 'Premium Wellness Tools'],
        },
    ];

    const handlePurchase = async (amount, price) => {
        setIsPurchasing(true);
        await new Promise(r => setTimeout(r, 1500));
        await addCredits(amount);
        setIsPurchasing(false);
        setSuccessMsg(`${amount} credits added to your account!`);
        setSuccess(true);
        setTimeout(() => navigate('/therapy-session'), 2200);
    };

    const handleProUpgrade = async () => {
        setProLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${BASE_URL}/api/pro/upgrade`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Upgrade failed');
            const updatedUser = { ...user, is_pro: true };
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setProSuccess(true);
        } catch (e) {
            console.error(e);
        } finally {
            setProLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen pt-10 px-6 pb-16 lg:px-12 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}
        >
            <div className={`absolute top-0 right-0 w-[600px] h-[600px] blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'}`} />
            <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] blur-[140px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none ${isDark ? 'bg-purple-600/10' : 'bg-purple-400/10'}`} />

            <nav className="relative z-10 flex items-center justify-between mb-14 max-w-7xl mx-auto">
                <button onClick={() => navigate(-1)}
                    className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Back</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <Ticket className="w-4 h-4 text-amber-400" />
                        <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{credits}</span>
                        <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Credits</span>
                    </div>

                    {isPro && (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                            <Crown className="w-3 h-3" /> Pro
                        </div>
                    )}

                    <motion.button onClick={toggleTheme} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.button>

                    <motion.button onClick={() => { logout(); navigate('/login'); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 shadow-sm'}`}
                    >
                        <LogOut className="w-4 h-4" />
                    </motion.button>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <h1 className={`text-5xl md:text-6xl font-black mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Power Up Your{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Wellness</span>
                    </h1>
                    <p className={`text-lg font-medium max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Choose a credit pack for pay-as-you-go sessions, or go Pro for the full AI therapy experience.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-16"
                >
                    <div className={`relative rounded-[2.5rem] border overflow-hidden ${isDark
                        ? 'bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-pink-900/20 border-purple-500/30'
                        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-purple-200'
                        }`}
                    >
                        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/15 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                        <div className="relative z-10 p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold mb-6">
                                    <Crown className="w-3.5 h-3.5" /> Puresoul Pro
                                </div>
                                <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    The full therapy<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">experience</span>
                                </h2>
                                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    An AI therapist that truly knows you — remembering every session, every emotion, every breakthrough. Unlimited history, voice therapy, and emotional continuity.
                                </p>

                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className={`text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹149</span>
                                    <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>Cancel anytime</span>
                                </div>

                                {isPro ? (
                                    <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 w-fit">
                                        <Check className="w-5 h-5 text-purple-400" />
                                        <span className="text-purple-300 font-bold">You're already Pro! 🎉</span>
                                    </div>
                                ) : proSuccess ? (
                                    <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-green-500/20 border border-green-500/30 w-fit">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        <span className="text-green-300 font-bold">Welcome to Pro! Enjoy your benefits 🎉</span>
                                    </div>
                                ) : (
                                    <motion.button
                                        onClick={handleProUpgrade}
                                        disabled={proLoading}
                                        whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60"
                                    >
                                        {proLoading ? (
                                            <>
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                                Activating Pro…
                                            </>
                                        ) : (
                                            <>
                                                <Crown className="w-5 h-5" />
                                                Upgrade to Pro — ₹149/mo
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {PRO_FEATURES.map(({ icon: Icon, title, desc }, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 + i * 0.07 }}
                                        className={`p-4 rounded-2xl border transition-all ${isDark
                                            ? 'bg-white/[0.04] border-white/10 hover:border-purple-500/30'
                                            : 'bg-white/70 border-purple-100 hover:border-purple-300 shadow-sm'
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mb-3">
                                            <Icon className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <p className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Or buy credits à la carte
                        </h2>
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        {packages.map((pkg, i) => (
                            <CreditCard key={i} {...pkg} onSelect={handlePurchase} theme={theme} />
                        ))}
                    </div>
                </motion.div>

                <p className={`text-center text-xs font-bold uppercase tracking-[0.3em] ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
                    Secure payment processing · Cancel Pro anytime · Credits never expire
                </p>
            </main>

            <AnimatePresence>
                {(isPurchasing || success) && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className={`p-12 rounded-[3rem] max-w-sm w-full text-center border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}
                        >
                            {isPurchasing ? (
                                <>
                                    <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-8" />
                                    <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Processing</h2>
                                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Securing your wellness credits…</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-teal-500/30">
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Success!</h2>
                                    <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{successMsg}</p>
                                    <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }}
                                            className="h-full bg-gradient-to-r from-teal-400 to-green-500"
                                        />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuyCreditsPage;
