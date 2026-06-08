import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Pencil, Trash2, Clock, Briefcase, Home, AlertCircle } from 'lucide-react';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, QuadrantColors } from '../types';

interface TaskCardProps {
  task: Task;
  colors: QuadrantColors;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, colors, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOverdue = task.dueDate && !task.completed && isPast(parseISO(task.dueDate));
  const isDueToday = task.dueDate && isToday(parseISO(task.dueDate));

  const dueDateLabel = task.dueDate
    ? isToday(parseISO(task.dueDate))
      ? `Hoje às ${format(parseISO(task.dueDate), 'HH:mm')}`
      : format(parseISO(task.dueDate), "d MMM, HH:mm", { locale: ptBR })
    : null;

  const cardBg    = task.completed ? 'bg-slate-50'  : isOverdue ? 'bg-red-50'    : colors.cardBg;
  const cardBorder = task.completed ? 'border-slate-100' : isOverdue ? 'border-red-200' : colors.cardBorder;
  const barColor  = task.completed ? 'bg-slate-200' : isOverdue ? 'bg-red-500'  : colors.cardBar;
  const titleColor = task.completed
    ? 'line-through text-slate-400'
    : isOverdue
    ? 'text-red-800'
    : colors.cardTitle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: task.completed ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className={`group relative rounded-xl border overflow-hidden transition-all duration-200
        ${cardBg} ${cardBorder}
        ${!task.completed && !isOverdue ? 'hover:shadow-md hover:brightness-[0.97]' : ''}`}
    >
      {/* Left priority bar — colour + width decrease with importance */}
      <div className={`absolute left-0 inset-y-0 ${barColor} transition-all duration-300`}
        style={{ width: colors.cardBar === 'bg-red-500'   ? '4px'
               : colors.cardBar === 'bg-blue-400'  ? '3px'
               : colors.cardBar === 'bg-amber-300' ? '2px'
               : '2px' }}
      />

      <div className="flex items-start gap-3 py-3 pr-3 pl-4">
        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 flex-shrink-0 transition-colors duration-200 ${
            task.completed ? colors.text : `text-slate-300 hover:${colors.text}`
          }`}
        >
          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${titleColor}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              task.category === 'trabalho'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {task.category === 'trabalho' ? <Briefcase className="w-3 h-3" /> : <Home className="w-3 h-3" />}
              {task.category === 'trabalho' ? 'Trabalho' : 'Pessoal'}
            </span>

            {dueDateLabel && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isOverdue ? `Atrasada — ${dueDateLabel}` : dueDateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1">
                <button onClick={() => onDelete(task.id)} className="text-xs text-red-600 font-bold px-2 py-1 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">Sim</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-slate-500 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Não</button>
              </motion.div>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
