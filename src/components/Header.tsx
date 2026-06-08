import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Clock, CheckCircle2, Target, Zap, LogOut, ChevronDown } from 'lucide-react';
import { googleLogout } from '@react-oauth/google';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, Timeframe } from '../types';
import { TIMEFRAME_CONFIG } from '../constants/timeframes';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';

interface HeaderProps {
  tasks: Task[];
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
  onAddTask: () => void;
  notificationGranted: boolean;
  onRequestNotification: () => void;
}

export default function Header({
  tasks, timeframe, onTimeframeChange, onAddTask, notificationGranted, onRequestNotification,
}: HeaderProps) {
  const { user, signOut } = useGoogleAuth();
  const [now, setNow] = useState(new Date());
  const [minutesToNext, setMinutesToNext] = useState(15);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifHint, setShowNotifHint] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const startMs = Date.now();
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 60000);
      setMinutesToNext(15 - (elapsed % 15));
    }, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    window.addEventListener('click', handler, { once: true });
    return () => window.removeEventListener('click', handler);
  }, [showUserMenu]);

  const handleLogout = () => {
    googleLogout();
    signOut();
  };

  const urgentCount    = tasks.filter((t) => t.priority === 'Q1' && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount     = tasks.length;
  const activeTF       = TIMEFRAME_CONFIG.find((t) => t.id === timeframe)!;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      {/* ── Row 1 ── */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-slate-800 font-black text-sm leading-tight">Agenda Pro</h1>
              <p className="text-slate-400 text-xs">Matriz de Eisenhower</p>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-slate-800 font-mono font-bold text-xl leading-none">{format(now, 'HH:mm')}</span>
            <span className="text-slate-400 text-xs mt-0.5 capitalize">{format(now, 'EEE, d MMM', { locale: ptBR })}</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Countdown */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-amber-500 text-xs font-bold">{minutesToNext}min</span>
            </div>

            {/* Urgent badge */}
            <AnimatePresence>
              {urgentCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="hidden sm:flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1.5">
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-red-600 text-xs font-bold">{urgentCount} urgente{urgentCount > 1 ? 's' : ''}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            {totalCount > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">{completedCount}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400">{totalCount}</span>
              </div>
            )}

            {/* Bell */}
            <div className="relative">
              <button
                onClick={notificationGranted ? undefined : onRequestNotification}
                onMouseEnter={() => !notificationGranted && setShowNotifHint(true)}
                onMouseLeave={() => setShowNotifHint(false)}
                className={`p-2 rounded-xl transition-all ${notificationGranted ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
              >
                <Bell className="w-4 h-4" />
                {notificationGranted && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />}
              </button>
              <AnimatePresence>
                {showNotifHint && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 shadow-lg z-50">
                    Activar lembretes a cada 15 minutos
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add task */}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onAddTask}
              className="flex items-center gap-1.5 btn-primary text-sm">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Nova Tarefa</span>
              <Plus className="w-4 h-4 sm:hidden" />
            </motion.button>

            {/* User avatar */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full border-2 border-indigo-200 object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-10 bg-white border border-slate-200 rounded-2xl shadow-xl w-52 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-slate-800 text-sm font-bold truncate">{user?.name}</p>
                      <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 text-sm font-semibold hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair da conta
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: planning tabs ── */}
      <div className="border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
        {TIMEFRAME_CONFIG.map((tf) => {
          const active = tf.id === timeframe;
          return (
            <motion.button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                active
                  ? `${tf.activeBg} ${tf.activeBorder} ${tf.activeText} border ring-1 ${tf.ringColor}`
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span className="text-base leading-none">{tf.emoji}</span>
              <span>{tf.label}</span>
              {active && <span className={`w-1.5 h-1.5 ${tf.dotColor} rounded-full`} />}
            </motion.button>
          );
        })}
        <div className="ml-auto flex items-center pl-4">
          <span className="text-slate-400 text-xs hidden md:block">
            Tarefas de <span className={`font-semibold ${activeTF.activeText}`}>{activeTF.period}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
