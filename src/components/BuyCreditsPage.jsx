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

    const handleTierUpgrade = async (tier) => {
        setProLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${BASE_URL}/api/pro/upgrade`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier })
            });
            if (!res.ok) throw new Error('Upgrade failed');
            const data = await res.json();
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setProSuccess(true);
            setSuccessMsg(`Upgraded to ${tier.toUpperCase()}!`);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
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
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Choose Your Healing Tier
                        </h2>
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                id: 'basic',
                                name: 'Basic',
                                price: 'Free',
                                credits: 12,
                                color: 'blue',
                                icon: User,
                                features: ['Text Therapy Only', '12 Credits Included', 'Emotion Detection', 'Standard AI Support'],
                                current: user?.tier === 'basic' || !user?.tier
                            },
                            {
                                id: 'pro',
                                name: 'Pro',
                                price: '₹149',
                                credits: 30,
                                color: 'purple',
                                icon: Mic,
                                features: ['Voice Therapy Enabled', '30 Additional Credits', 'Priority AI Processing', 'Standard History'],
                                current: user?.tier === 'pro',
                                popular: true
                            },
                            {
                                id: 'plus',
                                name: 'Plus',
                                price: '₹299',
                                credits: 50,
                                color: 'pink',
                                icon: Brain,
                                features: ['AI Memory & Continuity', '50 Additional Credits', 'Persistent Session Memory', 'Everything in Pro'],
                                current: user?.tier === 'plus'
                            }
                        ].map((tier) => (
                            <motion.div
                                key={tier.id}
                                whileHover={{ y: -5 }}
                                className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col ${tier.current
                                    ? isDark ? 'bg-white/[0.08] border-white/20' : 'bg-white border-slate-300 shadow-xl'
                                    : tier.popular
                                        ? 'bg-gradient-to-br from-purple-600/10 to-pink-500/10 border-purple-500/30 shadow-lg'
                                        : isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                                    }`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20">
                                        Recommended
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${tier.popular
                                    ? 'bg-purple-500 text-white'
                                    : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    <tier.icon className="w-6 h-6" />
                                </div>

                                <h3 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{tier.name} Plan</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{tier.price}</span>
                                    {tier.id !== 'basic' && <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/month</span>}
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f, i) => (
                                        <div key={i} className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : tier.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                {tier.current ? (
                                    <div className="w-full py-3.5 rounded-xl font-bold text-sm text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        Current Plan
                                    </div>
                                ) : tier.id === 'basic' ? (
                                    <div className="w-full py-3.5 rounded-xl font-bold text-sm text-center bg-slate-500/10 border border-slate-500/20 text-slate-400">
                                        Initial Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleTierUpgrade(tier.id)}
                                        disabled={proLoading}
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${tier.popular
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                                            : isDark ? 'bg-white/5 text-white border border-white/10' : 'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {proLoading ? 'Wait...' : `Switch to ${tier.name}`}
                                    </button>
                                )}
                            </motion.div>
                        ))}
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
