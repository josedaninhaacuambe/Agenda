import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Task, Priority } from '../types';
import { QUADRANT_CONFIG } from '../constants/quadrants';
import TaskCard from './TaskCard';

interface QuadrantBoardProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: (priority: Priority) => void;
}

export default function QuadrantBoard({ tasks, onToggleComplete, onEdit, onDelete, onAddTask }: QuadrantBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANT_CONFIG.map((q, idx) => {
        const qTasks = tasks.filter((t) => t.priority === q.id);
        const pending = qTasks.filter((t) => !t.completed);
        const completed = qTasks.filter((t) => t.completed);
        const pct = qTasks.length > 0 ? Math.round((completed.length / qTasks.length) * 100) : 0;

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.4 }}
            className={`rounded-2xl border overflow-hidden flex flex-col shadow-sm ${q.colors.bg} ${q.colors.border}`}
          >
            {/* Quadrant header — stays vibrant */}
            <div className={`bg-gradient-to-r ${q.colors.header} px-4 py-3`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">{q.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-sm tracking-wider uppercase">
                        {q.action}
                      </span>
                      {pending.length > 0 && (
                        <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {pending.length}
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 text-xs mt-0.5">{q.subtitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => onAddTask(q.id)}
                  className="bg-white/20 hover:bg-white/35 active:bg-white/40 text-white p-1.5 rounded-xl transition-all"
                  aria-label={`Adicionar tarefa ao ${q.action}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {qTasks.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-white/60 text-xs mb-1">
                    <span>{q.description}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-white/70 rounded-full"
                    />
                  </div>
                  <p className="text-white/50 text-xs mt-1">
                    {completed.length}/{qTasks.length} concluídas
                  </p>
                </div>
              )}
            </div>

            {/* Task list */}
            <div className="flex-1 p-3 space-y-2 min-h-[100px]">
              <AnimatePresence initial={false}>
                {qTasks.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-20 text-slate-400"
                  >
                    <Sparkles className="w-6 h-6 mb-1.5 opacity-40" />
                    <p className="text-sm">Nenhuma tarefa aqui</p>
                    <button
                      onClick={() => onAddTask(q.id)}
                      className={`mt-1.5 text-xs ${q.colors.text} hover:underline transition-all`}
                    >
                      + Adicionar tarefa
                    </button>
                  </motion.div>
                ) : (
                  qTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      colors={q.colors}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
