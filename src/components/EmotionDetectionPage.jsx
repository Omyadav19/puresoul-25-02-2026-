// EmotionDetectionPage.jsx (FINAL VERSION: Automatic Start & Universal Redirect)

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Smile, Frown, Meh, AlertCircle, Navigation, CameraOff,
  Brain, Zap, X, GraduationCap, Briefcase, Heart, Activity,
  Sprout, Wallet, History, Settings, ChevronRight, Phone, Volume2, Mic, MicOff,
  Sparkles, Smartphone, Coffee, Music, Sun, Moon, LogOut, Ticket,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCredits } from '../context/CreditContext.jsx';
import MediaPipeEmotionDetector from '../utils/mediapipeDetection.js';

const EmotionDetectionPage = () => {
  const navigate = useNavigate();
  const { user, setCurrentEmotion, addEmotionData, theme, toggleTheme, logout } = useApp();
  const { credits } = useCredits();

  // State for the batching and popup logic

  const [emotionReadings, setEmotionReadings] = useState([]);
  const [dominantEmotion, setDominantEmotion] = useState(null);
  const [showEmotionPopup, setShowEmotionPopup] = useState(false);
  const [showCalmingTips, setShowCalmingTips] = useState(false); // Kept in case you want to use it later
  const READINGS_BATCH_SIZE = 10;

  // State for the component's operation
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotionState, setCurrentEmotionState] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [stream, setStream] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [detectionError, setDetectionError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);

  const addLog = (msg) => {
    console.log(`[SYS] ${msg}`);
    setDebugLogs(prev => [msg, ...prev.slice(0, 4)]);
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const emotionDetectorRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // --- UPDATED POPUP MESSAGES ---
  // Each question is now an invitation to a therapy session.
  const emotionDataMap = {
    neutral: { icon: '😐', color: 'from-gray-400 to-gray-600', component: Meh, question: "You seem to be feeling neutral. Would you like to start a session to check in?" },
    happy: { icon: '😊', color: 'from-green-400 to-green-600', component: Smile, question: "You look happy! Would you like to talk about what's bringing you joy?" },
    sad: { icon: '😢', color: 'from-blue-400 to-blue-600', component: Frown, question: "You seem sad. Would you like to talk about what you're feeling?" },
    angry: { icon: '😠', color: 'from-red-400 to-red-600', component: AlertCircle, question: "You seem upset. Would you like a safe space to talk it through?" },
    surprised: { icon: '😲', color: 'from-yellow-400 to-yellow-600', component: AlertCircle, question: "You seem surprised. Would you like to explore this feeling?" },
    fear: { icon: '😨', color: 'from-purple-400 to-purple-600', component: AlertCircle, question: "You seem to be feeling fearful. Would you like a safe space to talk?" },
    disgust: { icon: '🤢', color: 'from-green-400 to-green-600', component: AlertCircle, question: "You seem to be feeling disgust. Would you like to discuss it?" },
  };

  const initializeEmotionDetector = async () => {
    if (emotionDetectorRef.current) return;
    setIsModelLoading(true);
    setDetectionError(null);
    try {
      emotionDetectorRef.current = new MediaPipeEmotionDetector();
      const success = await emotionDetectorRef.current.initialize();
      if (success) {
        setModelReady(true);
        console.log('MediaPipe emotion detection initialized successfully');
      } else {
        throw new Error('Could not initialize MediaPipe. This might be a browser compatibility issue.');
      }
    } catch (error) {
      addLog(`AI Init Error: ${error.message}`);
      setDetectionError(`Neural engine failed: ${error.message || 'Check your internet connection'}`);
    } finally {
      setIsModelLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      addLog('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      addLog('Camera access GRANTED');
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        addLog('Attaching stream to video tag');
        videoRef.current.srcObject = mediaStream;

        const handleVideoReady = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            addLog(`Video feed active: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
            initializeEmotionDetector();
          }
        };

        videoRef.current.onloadedmetadata = handleVideoReady;
        videoRef.current.onloadeddata = handleVideoReady;

        // Fallback for browsers with slow metadata
        setTimeout(() => {
          if (!modelReady && !isModelLoading) {
            addLog('Metadata timeout, checking manually');
            handleVideoReady();
          }
        }, 3000);

        try {
          await videoRef.current.play();
          addLog('Video playback started');
        } catch (playError) {
          addLog(`Playback error: ${playError.message}`);
        }
      }
    } catch (error) {
      addLog(`Camera Error: ${error.name}`);
      setHasPermission(false);
      setDetectionError(`Camera Blocked: ${error.message}. Please click the lock icon next to the URL bar and allow 'Camera'.`);
    }
  };

  const analyzeReadings = (readings) => {
    setIsDetecting(false);
    if (!readings.length) return;
    const emotionCounts = readings.reduce((acc, emotion) => ({ ...acc, [emotion]: (acc[emotion] || 0) + 1 }), {});
    const dominant = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);
    setDominantEmotion(dominant);
    setShowEmotionPopup(true);
  };

  const performEmotionDetection = async () => {
    if (!emotionDetectorRef.current || !modelReady || !videoRef.current || !canvasRef.current) return;

    // Log if video isn't ready yet
    if (videoRef.current.videoWidth === 0) {
      console.log('Waiting for video frames...');
      return;
    }

    try {
      const result = await emotionDetectorRef.current.detectEmotionFromVideo(videoRef.current, canvasRef.current);
      if (result) {
        const emotionData = {
          id: Date.now().toString(), emotion: result.emotion, confidence: result.confidence,
          timestamp: result.timestamp, allScores: result.allScores,
        };
        setCurrentEmotionState(emotionData);
        setCurrentEmotion(emotionData);
        addEmotionData(emotionData);
        setDetectionHistory(prev => [emotionData, ...prev.slice(0, 4)]);
        setEmotionReadings(prev => {
          const newReadings = [...prev, result.emotion];
          if (newReadings.length >= READINGS_BATCH_SIZE) {
            analyzeReadings(newReadings);
            return [];
          }
          return newReadings;
        });
      }
    } catch (error) {
      console.error('MediaPipe emotion detection error:', error);
      // Don't show error immediately as it might be transient
    }
  };

  const handlePopupDismiss = () => {
    setShowEmotionPopup(false);
    navigate('/therapy-session', { state: { category: 'Just Talk', initialEmotion: dominantEmotion } });
  };

  const retryCamera = () => {
    setDetectionError(null);
    setHasPermission(null);
    requestCameraPermission();
  };

  const handleCloseTips = () => {
    setShowCalmingTips(false);
    setIsDetecting(true);
    setDominantEmotion(null);
  };

  const categories = [
    {
      id: 'academic',
      title: 'Academic / Exam',
      desc: 'Beat exam stress & boost focus',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/20'
    },
    {
      id: 'career',
      title: 'Career & Jobs',
      desc: 'Navigate your professional path',
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20'
    },
    {
      id: 'relationship',
      title: 'Relationship',
      desc: 'Healing heart & family bonds',
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/20'
    },
    {
      id: 'health',
      title: 'Health & Wellness',
      desc: 'Revitalize your body & mind',
      icon: Activity,
      color: 'from-orange-500 to-red-600',
      glow: 'shadow-orange-500/20'
    },
    {
      id: 'growth',
      title: 'Personal Growth',
      desc: 'Level up your best version',
      icon: Sprout,
      color: 'from-lime-500 to-green-600',
      glow: 'shadow-lime-500/20'
    },
    {
      id: 'mental',
      title: 'Mental Health',
      desc: 'Safe space for inner peace',
      icon: Brain,
      color: 'from-purple-500 to-violet-600',
      glow: 'shadow-purple-500/20'
    },
    {
      id: 'financial',
      title: 'Financial Stress',
      desc: 'Practical calm for money worries',
      icon: Wallet,
      color: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/20'
    },
  ];

  const handleCategorySelect = (category) => {
    setShowEmotionPopup(false);
    navigate('/therapy-session', { state: { category: category.title, initialEmotion: dominantEmotion } });
  };

  // --- REACT LIFECYCLE HOOKS ---
  useEffect(() => {
    if (!user) navigate('/login');
    else if (hasPermission === null) requestCameraPermission();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (emotionDetectorRef.current) emotionDetectorRef.current.dispose();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [user, hasPermission, stream, navigate]);

  // --- UPDATED useEffect FOR AUTOMATIC DETECTION ---
  useEffect(() => {
    // Automatically start detecting when ready
    if (hasPermission && modelReady && !isDetecting && !showEmotionPopup && !showCalmingTips) {
      setIsDetecting(true);
    }

    // Manage the interval timer
    if (isDetecting) {
      detectionIntervalRef.current = setInterval(performEmotionDetection, 1000);
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    }

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [isDetecting, hasPermission, modelReady, showEmotionPopup, showCalmingTips]);

  const EmotionIconComponent = currentEmotionState ? emotionDataMap[currentEmotionState.emotion].component : Camera;

  return (
    <div
      className="min-h-screen p-6 relative overflow-hidden"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #0a0f1a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
      }}
    >
      <div className="absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-xl"
            style={{ width: `${Math.random() * 200 + 100}px`, height: `${Math.random() * 200 + 100}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ x: [0, 30, -30, 0], y: [0, -30, 30, 0], scale: [1, 1.2, 0.8, 1] }}
            transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showEmotionPopup && dominantEmotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`border rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-5xl w-full backdrop-blur-2xl overflow-hidden relative flex flex-col max-h-[90vh] ${theme === 'dark'
                ? 'bg-[#0f172a]/90 border-white/10'
                : 'bg-white/95 border-slate-200 shadow-xl'
                }`}
            >
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <button
                  onClick={handlePopupDismiss}
                  className={`absolute right-0 top-0 p-3 rounded-full transition-all group border ${theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                    }`}
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>

                <h2 className={`text-4xl md:text-5xl font-black mb-6 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  How can I help you today?
                </h2>

                <div className={`flex items-center gap-4 py-3 px-8 rounded-full border backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'
                  }`}>
                  <span className="text-3xl animate-bounce">{emotionDataMap[dominantEmotion].icon}</span>
                  <div className="flex flex-col items-start">
                    <span className={`text-xs uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Detected Emotion</span>
                    <span className={`text-lg font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {dominantEmotion}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-6 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {categories.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(cat)}
                    className={`relative group overflow-hidden rounded-3xl border p-1 text-left transition-all duration-300 ${theme === 'dark'
                      ? 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-lg'
                      }`}
                  >
                    {/* Inner Content Container */}
                    <div className={`relative z-10 flex items-center p-4 rounded-[1.3rem] h-full transition-colors ${theme === 'dark' ? 'bg-[#0f172a]/40 group-hover:bg-[#0f172a]/20' : 'bg-slate-50/50 group-hover:bg-white'
                      }`}>
                      {/* Icon Box */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                        <cat.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Text */}
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className={`text-lg font-bold mb-0.5 truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {cat.title}
                        </h3>
                        <p className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-blue-600'} transition-colors`}>
                          {cat.desc}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-500'
                        }`}>
                        <Navigation className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Background Gradient/Glow on Hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${cat.color}`} />

                    {/* Decorative Corner */}
                    <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-br ${cat.color}`} />
                  </motion.button>
                ))}
              </div>

              <div className="mt-16 flex justify-center relative z-10">
                <button
                  onClick={handlePopupDismiss}
                  className="group flex items-center gap-4 text-gray-400 hover:text-white transition-all text-lg font-bold tracking-wide"
                >
                  <span className="w-12 h-[2px] bg-gray-700 group-hover:w-20 group-hover:bg-blue-400 transition-all duration-300" />
                  No specific path, just talk
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${theme === 'dark'
        ? 'bg-[#0a0f1a]/80 border-white/10'
        : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          {/* Header Title moved for better responsiveness */}
          <div className="flex flex-col mb-2">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
              Emotion Detection
            </h1>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Instant AI facial analysis
            </p>
          </div>

          <div className="flex space-x-3">
            {/* Buy Credits */}
            <button
              onClick={() => navigate('/buy-credits')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-bold text-sm border ${theme === 'dark'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'
                }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{credits}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-300 ${theme === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20 border-white/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className={`p-2.5 rounded-full border transition-all duration-300 ${theme === 'dark'
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 shadow-sm'
                }`}
            >
              <LogOut className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button onClick={() => navigate('/dashboard')} className={`flex items-center px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm border ${theme === 'dark'
              ? 'bg-white/10 text-white hover:bg-white/20 border-white/10'
              : 'bg-white text-slate-700 hover:text-blue-600 hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button onClick={() => navigate('/mood-history')} className={`flex items-center px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm border ${theme === 'dark'
              ? 'bg-white/10 text-white hover:bg-white/20 border-white/10'
              : 'bg-white text-slate-700 hover:text-blue-600 hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}>
              <History className="w-4 h-4 mr-2" />
              History
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 px-6 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8">

          {/* Left Column: Camera Feed (Occupies larger space) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              {/* Error/Permission Banners */}
              {hasPermission === false && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 mb-4">
                  <CameraOff className="w-5 h-5" />
                  <p>Camera access denied. Please enable permissions.</p>
                </div>
              )}
              {detectionError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <p>{detectionError}</p>
                </div>
              )}

              <div className={`backdrop-blur-xl rounded-[2.5rem] p-2 border shadow-2xl transition-all duration-500 relative overflow-hidden group ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-slate-200/50'
                }`}>
                <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black">
                  {hasPermission ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={(e) => console.log('Video metadata loaded', e)}
                        onError={(e) => console.error('Video tag error', e)}
                      />
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]" />

                      {/* Loading/Status Overlays */}
                      {!modelReady && hasPermission && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                          <p className="text-white font-bold tracking-wide">Initializing Neural Engine...</p>
                          <p className="text-white/50 text-[10px] mt-2">Connecting to AI models</p>
                        </div>
                      )}

                      {/* Tech Overlay Elements */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-white/30 rounded-tl-xl" />
                        <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-white/30 rounded-tr-xl" />
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-white/30 rounded-bl-xl" />
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-white/30 rounded-br-xl" />

                        {isDetecting && (
                          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-white/80 text-xs font-bold tracking-wider uppercase">Live Analysis</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
                      {isModelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                          </div>
                          <p className="font-medium animate-pulse">Initializing Neural Engine...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center max-w-sm">
                          <CameraOff className="w-16 h-16 mx-auto mb-6 opacity-30" />
                          <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Webcam Not Active</h3>
                          <p className="text-sm mb-8 opacity-60">Please allow camera access and ensure no other app is using it.</p>

                          <button
                            onClick={retryCamera}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${theme === 'dark'
                              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl'
                              }`}
                          >
                            <Camera className="w-5 h-5" />
                            Enable Webcam
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Debug Logs Overlay */}
                  {debugLogs.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 z-40 pointer-events-none">
                      <div className="flex flex-col gap-1 items-start">
                        {debugLogs.map((log, i) => (
                          <span key={i} className="px-2 py-0.5 bg-black/80 text-[10px] text-blue-300 font-mono rounded border border-blue-500/20">
                            {log}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Force Trigger UI */}
                  {hasPermission && (
                    <button
                      onClick={initializeEmotionDetector}
                      className="absolute top-4 right-4 z-40 p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-white/50 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      Force AI Init
                    </button>
                  )}
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <h4 className={`text-xs font-black uppercase tracking-[0.15em] ${theme === 'dark' ? 'text-white/70' : 'text-slate-800'}`}>Troubleshooting Black Screen</h4>
                </div>
                <ul className={`text-[11px] space-y-2 font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                  <li>• Ensure the browser has <b>Camera Permissions</b> enabled (check the address bar lock icon).</li>
                  <li>• Close other apps using the camera (Zoom, Teams, WhatsApp Web).</li>
                  <li>• Use <b>Google Chrome</b> or <b>Edge</b> for the best stability.</li>
                  <li>• Try <b>Refreshing (F5)</b> if the "Initializing" spinner stays forever.</li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Stats & Analysis */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Current Emotion Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className={`backdrop-blur-xl rounded-[2.5rem] p-8 border shadow-xl relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10' : 'bg-white border-slate-200'
                }`}>
                <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Brain className="w-4 h-4" /> Real-time Insight
                </h3>

                <div className="flex flex-col items-center justify-center py-4">
                  <AnimatePresence mode="wait">
                    {currentEmotionState ? (
                      <motion.div
                        key={currentEmotionState.timestamp}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center text-7xl mb-6 shadow-2xl bg-gradient-to-br ${emotionDataMap[currentEmotionState.emotion].color}`}>
                          {emotionDataMap[currentEmotionState.emotion].icon}
                        </div>
                        <h2 className={`text-4xl font-black capitalize mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {currentEmotionState.emotion}
                        </h2>

                        <div className="w-full mt-4 bg-gray-200/20 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${currentEmotionState.confidence * 100}%` }}
                            className={`h-full bg-gradient-to-r ${emotionDataMap[currentEmotionState.emotion].color}`}
                          />
                        </div>
                        <div className="flex justify-between w-full mt-2 text-xs font-bold opacity-60">
                          <span>Confidence</span>
                          <span>{Math.round(currentEmotionState.confidence * 100)}%</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 opacity-50">
                        <Activity className="w-12 h-12 mx-auto mb-4" />
                        <p>Waiting for data...</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Recent History List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1"
            >
              <div className={`backdrop-blur-xl rounded-[2.5rem] p-6 border shadow-xl h-full flex flex-col ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'
                }`}>
                <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Activity className="w-4 h-4" /> Recent Detections
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[400px]">
                  {detectionHistory.length > 0 ? detectionHistory.map((emotion, index) => {
                    const IconComponent = emotionDataMap[emotion.emotion].component;
                    return (
                      <motion.div
                        key={emotion.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 rounded-2xl flex items-center gap-4 border transition-all ${theme === 'dark'
                          ? 'bg-white/5 border-white/5 hover:bg-white/10'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${emotionDataMap[emotion.emotion].color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold capitalize truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {emotion.emotion}
                          </p>
                          <p className="text-xs opacity-50 truncate">
                            {emotion.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-sm border border-slate-100'
                          }`}>
                          {Math.round(emotion.confidence * 100)}%
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center opacity-40">
                      <p className="text-sm">Start detecting to see history</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmotionDetectionPage;