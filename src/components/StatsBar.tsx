import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Briefcase, Home, BarChart3 } from 'lucide-react';
import { Task } from '../types';
import { MOTIVATIONAL_QUOTES } from '../constants/quadrants';

interface StatsBarProps {
  tasks: Task[];
}

export default function StatsBar({ tasks }: StatsBarProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed);
    const urgent = pending.filter((t) => t.priority === 'Q1');
    const work = pending.filter((t) => t.category === 'trabalho');
    const personal = pending.filter((t) => t.category === 'pessoal');
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending: pending.length, urgent: urgent.length, work: work.length, personal: personal.length, pct };
  }, [tasks]);

  const quote = MOTIVATIONAL_QUOTES[new Date().getHours() % MOTIVATIONAL_QUOTES.length];

  return (
    <div className="container mx-auto px-4 mb-5">
      {/* Urgent alert strip */}
      {stats.urgent > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-red-700 text-sm font-bold leading-tight">
              {stats.urgent} tarefa{stats.urgent > 1 ? 's' : ''} urgente{stats.urgent > 1 ? 's' : ''}{' '}
              exige{stats.urgent > 1 ? 'm' : ''} atenção imediata!
            </p>
            <p className="text-red-400 text-xs mt-0.5">Quadrante 1 — Faça Agora</p>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"
          />
        </motion.div>
      )}

      {/* Stats card */}
      {stats.total > 0 && (
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Progress */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-600 text-sm font-semibold flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Progresso da Semana
                </span>
                <span className="text-slate-800 font-bold text-sm">{stats.pct}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.pct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {stats.completed} de {stats.total} tarefas concluídas
              </p>
            </div>

            <div className="hidden sm:block w-px h-10 bg-slate-200" />

            {/* Category breakdown */}
            <div className="flex gap-5">
              <div className="text-center">
                <div className="text-red-500 font-black text-xl leading-none">{stats.urgent}</div>
                <div className="text-slate-400 text-xs mt-0.5">🔴 Urgentes</div>
              </div>
              <div className="text-center">
                <div className="text-indigo-600 font-black text-xl leading-none">{stats.work}</div>
                <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Trabalho
                </div>
              </div>
              <div className="text-center">
                <div className="text-emerald-600 font-black text-xl leading-none">{stats.personal}</div>
                <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                  <Home className="w-3 h-3" /> Pessoal
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-slate-200" />

            {/* Motivational quote */}
            <div className="hidden lg:flex items-start gap-2 max-w-[200px]">
              <TrendingUp className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-slate-500 text-xs leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
