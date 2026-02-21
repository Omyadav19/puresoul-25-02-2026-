// src/components/ProSessionsSidebar.jsx
// Sidebar shown only to Pro users listing their past therapy sessions.

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, ChevronLeft, ChevronRight, MessageSquare,
    Clock, Crown, Loader2, AlertCircle, RefreshCw, Trash2
} from 'lucide-react';
import { fetchProSessions, deleteSession } from '../utils/proApi';

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen           Sidebar open/closed state
 * @param {Function} props.onToggle         Toggle sidebar
 * @param {Function} props.onSelectSession  Called with session object when user clicks one
 * @param {number}   props.activeSessionId  Currently active session id (to highlight)
 * @param {string}   props.theme            'dark' | 'light'
 */
const ProSessionsSidebar = ({
    isOpen,
    onToggle,
    onSelectSession,
    activeSessionId,
    theme = 'dark',
}) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchProSessions();
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err.message === 'PRO_REQUIRED' ? 'Pro subscription required.' : 'Failed to load sessions.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this session history?')) return;

        try {
            await deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            alert('Failed to delete session: ' + err.message);
        }
    };

    useEffect(() => {
        if (isOpen) loadSessions();
    }, [isOpen, loadSessions]);

    const isDark = theme === 'dark';

    return (
        <>
            {/* Toggle tab */}
            <motion.button
                onClick={onToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 px-2 py-4 rounded-r-xl shadow-xl transition-all duration-300 ${isDark
                    ? 'bg-purple-600/80 text-white hover:bg-purple-500/90 border border-purple-400/20'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
                    }`}
                title="Pro Session History"
            >
                <Crown className="w-4 h-4 mb-1" />
                {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </motion.button>

            {/* Sidebar panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        key="pro-sidebar"
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`fixed left-0 top-0 h-full w-72 z-40 flex flex-col shadow-2xl border-r ${isDark
                            ? 'bg-[#0f0f1a]/95 backdrop-blur-xl border-white/10'
                            : 'bg-white/95 backdrop-blur-xl border-slate-200'
                            }`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-5 border-b ${isDark ? 'border-white/10' : 'border-slate-100'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        Session History
                                    </h2>
                                    <p className={`text-[10px] ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                                        Pro • Persistent Memory
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                onClick={loadSessions}
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.4 }}
                                className={`p-1.5 rounded-lg ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                                title="Refresh"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>

                        {/* Session list */}
                        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Loading sessions…</p>
                                </div>
                            )}

                            {!loading && error && (
                                <div className={`flex flex-col items-center justify-center h-40 gap-2 text-center px-4`}>
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                    <p className="text-xs text-red-400">{error}</p>
                                </div>
                            )}

                            {!loading && !error && sessions.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
                                    <History className={`w-8 h-8 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                        No past sessions yet.<br />Start chatting to build your history!
                                    </p>
                                </div>
                            )}

                            {!loading && !error && sessions.map((session) => {
                                const isActive = session.id === activeSessionId;
                                return (
                                    <motion.button
                                        key={session.id}
                                        onClick={() => onSelectSession(session)}
                                        whileHover={{ scale: 1.02, x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-200 border ${isActive
                                            ? isDark
                                                ? 'bg-purple-600/30 border-purple-500/50 shadow-lg shadow-purple-900/20'
                                                : 'bg-purple-50 border-purple-300 shadow-sm'
                                            : isDark
                                                ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                : 'bg-slate-50 border-slate-100 hover:bg-purple-50 hover:border-purple-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isActive
                                                ? 'bg-purple-500 text-white'
                                                : isDark ? 'bg-white/10 text-purple-300' : 'bg-purple-100 text-purple-600'
                                                }`}>
                                                <MessageSquare className="w-3 h-3" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1">
                                                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                        {session.session_title || 'Therapy Session'}
                                                    </p>
                                                    <motion.button
                                                        whileHover={{ scale: 1.2, color: '#ef4444' }}
                                                        whileTap={{ scale: 0.8 }}
                                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                                        className={`p-1 -mr-1 rounded-md transition-colors ${isDark ? 'text-white/20 hover:bg-red-500/10' : 'text-slate-300 hover:bg-red-50'}`}
                                                        title="Delete Session"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </motion.button>
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                                    <Clock className="w-2.5 h-2.5" />
                                                    <span className="text-[10px]">{formatDate(session.started_at)}</span>
                                                    <span className="text-[10px]">·</span>
                                                    <span className="text-[10px]">{formatTime(session.started_at)}</span>
                                                </div>
                                                {session.message_count > 0 && (
                                                    <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {session.message_count} messages
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className={`px-4 py-3 border-t text-center ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                            <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                                All sessions are end-to-end encrypted
                            </p>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};

export default ProSessionsSidebar;
