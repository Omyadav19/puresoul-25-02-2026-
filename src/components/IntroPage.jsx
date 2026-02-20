import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Brain, ArrowRight, Sun, Moon, Sparkles, MessageCircle, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import AboutPage from './AboutPage.jsx';
import ContactPage from './ContactPage.jsx';

// Hero image
const INTRO_IMAGE = new URL('./girlimage/hero.jpg', import.meta.url).href;

const IntroPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);



  const features = [
    {
      icon: Heart,
      title: 'Deep Empathy',
      description: 'AI that feels your emotions through voice and expression.',
      details: 'Advanced neural networks trained on therapeutic datasets.'
    },
    {
      icon: Brain,
      title: 'Cognitive Insight',
      description: 'Understanding patterns in your thoughts and behaviors.',
      details: 'Personalized mental health tracking and analysis.'
    },
    {
      icon: Shield,
      title: 'Private Sanctuary',
      description: 'Your data stays yours. Completely encrypted and secure.',
      details: 'HIPAA-grade security protocols for your peace of mind.'
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen transition-colors duration-700 select-none overflow-x-hidden">
      {/* Dynamic Background System */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[#020617]" style={{ background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)' }} />
          <Blob color="rgba(59, 130, 246, 0.15)" size="600px" top="10%" left="-10%" duration={20} />
          <Blob color="rgba(139, 92, 246, 0.15)" size="500px" top="60%" left="80%" duration={25} />
          <Blob color="rgba(20, 184, 166, 0.1)" size="400px" top="20%" left="50%" duration={18} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[#f8fafc]" style={{ background: 'radial-gradient(circle at 50% 50%, #f1f5f9 0%, #f8fafc 100%)' }} />
          <Blob color="rgba(59, 130, 246, 0.1)" size="600px" top="-5%" left="-5%" duration={22} />
          <Blob color="rgba(16, 185, 129, 0.1)" size="500px" top="50%" left="70%" duration={28} />
        </div>

        {/* Animated Grid */}
        <div className={`absolute inset-0 opacity-[0.03] ${theme === 'dark' ? 'invert' : ''}`}
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Floating Toolbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Puresoul<span className="text-blue-500">.ai</span>
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-2xl border backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-white/40 border-slate-200 text-slate-700 hover:bg-white/60 shadow-sm'
                }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <motion.button
              onClick={() => navigate('/login')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95"
            >
              Start Session
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <motion.div style={{ opacity, scale }} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Side: Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Mental Wellness</span>
              </div>
              <h1 className={`text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                A gentler way to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400">
                  find your peace.
                </span>
              </h1>
              <p className={`text-xl md:text-2xl mb-12 max-w-xl leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Puresoul is your interactive AI companion designed to understand your emotions and guide you toward healing.
              </p>



              <div className="flex flex-col sm:flex-row gap-5">
                <motion.button
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 rounded-2xl bg-blue-600 text-white text-lg font-bold shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 group"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={() => document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-10 py-5 rounded-2xl border text-lg font-bold transition-colors ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  Explore Features
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Visual Hero */}
          <div className="order-1 lg:order-2 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative w-full max-w-[500px]"
            >
              {/* Complex Frame */}
              <div className={`relative aspect-[4/5] rounded-[3rem] overflow-hidden ${theme === 'dark' ? 'ring-1 ring-white/20' : 'ring-1 ring-black/5 shadow-2xl'
                }`}>
                {/* Dynamic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-transparent to-transparent z-10" />

                {/* Skeleton Loader */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-slate-200/20 animate-pulse flex items-center justify-center">
                    <Heart className="w-12 h-12 text-blue-500 opacity-20" />
                  </div>
                )}

                <motion.img
                  src={INTRO_IMAGE}
                  alt="Therapeutic AI Presence"
                  onLoad={() => setImageLoaded(true)}
                  className="w-full h-full object-cover"
                  animate={{ scale: imageLoaded ? 1 : 1.1 }}
                  transition={{ duration: 1.5 }}
                />

                {/* Floating UI Elements over Image */}
                <motion.div
                  className="absolute top-8 left-8 p-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 z-20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Active Listening</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-8 right-8 left-8 p-6 rounded-3xl backdrop-blur-xl bg-black/40 border border-white/10 z-20"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">Safe Space</p>
                      <p className="text-white/60 text-xs">Always here for you</p>
                    </div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-gradient-to-br from-blue-400 to-teal-400" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Decorative background elements behind image */}
              <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Designed for your well-being
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group p-8 rounded-[2.5rem] border transition-all hover:-translate-y-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white/70 border-slate-200 shadow-xl shadow-slate-200/50'
                  }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-400/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <f.icon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {f.title}
                </h3>
                <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {f.description}
                </p>
                <p className={`text-sm opacity-60 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {f.details}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Sections with Parallax effects can be added here */}
      <div id="about-section" className="relative z-10 scroll-mt-24">
        <AboutPage isSection={true} />
      </div>

      <div id="contact-section" className="relative z-10 scroll-mt-24">
        <ContactPage isSection={true} />
      </div>

      {/* Footer / Trust Bar */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> HIPAA Compliant</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Real-time Response</span>
            <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Encrypted Chats</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Puresoul AI. Crafted with care for human hearts.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Background Blob Component
const Blob = ({ color, size, top, left, duration }) => (
  <motion.div
    className="absolute rounded-full blur-[100px] mix-blend-screen opacity-50"
    style={{
      backgroundColor: color,
      width: size,
      height: size,
      top,
      left,
    }}
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -30, 40, 0],
      scale: [1, 1.1, 0.9, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export default IntroPage;