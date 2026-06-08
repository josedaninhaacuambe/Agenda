import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Clock, CheckCircle2, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../types';

interface HeaderProps {
  tasks: Task[];
  onAddTask: () => void;
  notificationGranted: boolean;
  onRequestNotification: () => void;
}

export default function Header({ tasks, onAddTask, notificationGranted, onRequestNotification }: HeaderProps) {
  const [now, setNow] = useState(new Date());
  const [minutesToNext, setMinutesToNext] = useState(15);
  const [showNotifHint, setShowNotifHint] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const startMs = Date.now();
    const timerTick = setInterval(() => {
      const elapsedMin = Math.floor((Date.now() - startMs) / 60000);
      setMinutesToNext(15 - (elapsedMin % 15));
    }, 60000);
    return () => clearInterval(timerTick);
  }, []);

  const urgentCount = tasks.filter((t) => t.priority === 'Q1' && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-slate-800 font-black text-base leading-tight tracking-tight">Agenda Pro</h1>
              <p className="text-slate-400 text-xs font-medium">Matriz de Eisenhower</p>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-slate-800 font-mono font-bold text-2xl leading-none tracking-tight">
              {format(now, 'HH:mm')}
            </span>
            <span className="text-slate-400 text-xs mt-0.5 capitalize">
              {format(now, "EEEE, d 'de' MMM", { locale: ptBR })}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Countdown to next notification */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 text-xs">
                Lembrete em{' '}
                <span className="text-amber-500 font-bold">{minutesToNext} min</span>
              </span>
            </div>

            {/* Urgent alert badge */}
            <AnimatePresence>
              {urgentCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1.5 cursor-default"
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  />
                  <span className="text-red-600 text-xs font-bold">
                    {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completed counter */}
            {totalCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">{completedCount}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400">{totalCount}</span>
              </div>
            )}

            {/* Notification bell */}
            <button
              onClick={notificationGranted ? undefined : onRequestNotification}
              onMouseEnter={() => !notificationGranted && setShowNotifHint(true)}
              onMouseLeave={() => setShowNotifHint(false)}
              className={`relative p-2 rounded-xl transition-all ${
                notificationGranted
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <Bell className="w-5 h-5" />
              {notificationGranted && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
              <AnimatePresence>
                {showNotifHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 shadow-lg z-50"
                  >
                    Clique para ativar notificações a cada 15 minutos
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Add Task Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAddTask}
              className="flex items-center gap-2 btn-primary text-sm"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Nova Tarefa</span>
              <Plus className="w-4 h-4 sm:hidden" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
