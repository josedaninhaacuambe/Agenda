import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, AlertCircle, Calendar } from 'lucide-react';
import { Task, Priority, Category, Timeframe } from '../types';
import { QUADRANT_CONFIG } from '../constants/quadrants';
import { TIMEFRAME_CONFIG } from '../constants/timeframes';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface AddTaskModalProps {
  task?: Task | null;
  defaultPriority: Priority;
  defaultTimeframe: Timeframe;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onClose: () => void;
}

type VoiceTarget = 'title' | 'description';

export default function AddTaskModal({ task, defaultPriority, defaultTimeframe, onSave, onClose }: AddTaskModalProps) {
  const [title,       setTitle]       = useState(task?.title       ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority,    setPriority]    = useState<Priority>(task?.priority  ?? defaultPriority);
  const [category,    setCategory]    = useState<Category>(task?.category  ?? 'trabalho');
  const [timeframe,   setTimeframe]   = useState<Timeframe>(task?.timeframe ?? defaultTimeframe);
  const [dueDate,     setDueDate]     = useState(task?.dueDate ?? '');
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget>('title');
  const [errors,      setErrors]      = useState<{ title?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleVoiceResult = (text: string) => {
    if (voiceTarget === 'title') setTitle(text);
    else setDescription(text);
  };

  const { isListening, isSupported, toggleListening } = useVoiceInput({ onResult: handleVoiceResult });

  const handleVoiceClick = (target: VoiceTarget) => {
    if (isListening && voiceTarget === target) { toggleListening(); return; }
    if (!isListening) { setVoiceTarget(target); toggleListening(); return; }
    toggleListening();
    setTimeout(() => { setVoiceTarget(target); toggleListening(); }, 300);
  };

  const validate = () => {
    const e: { title?: string } = {};
    if (!title.trim()) e.title = 'O título é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined, priority, category, timeframe, dueDate: dueDate || undefined });
  };

  const activeQ  = QUADRANT_CONFIG.find((q) => q.id === priority)!;
  const activeTF = TIMEFRAME_CONFIG.find((t) => t.id === timeframe)!;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-slate-800 font-bold text-lg">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold ${activeQ.colors.text}`}>{activeQ.emoji} {activeQ.action}</span>
              <span className="text-slate-300">•</span>
              <span className={`text-xs font-semibold ${activeTF.activeText}`}>{activeTF.emoji} {activeTF.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[82vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite ou dite o título..."
                className={`input-field pr-11 ${errors.title ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
              {isSupported && (
                <button type="button" onClick={() => handleVoiceClick('title')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                    isListening && voiceTarget === 'title' ? 'bg-red-500 text-white mic-active' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                  title={isListening && voiceTarget === 'title' ? 'Parar' : 'Ditar título'}>
                  {isListening && voiceTarget === 'title' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
            <AnimatePresence>
              {errors.title && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.title}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1.5">Descrição</label>
            <div className="relative">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais (opcional)..." rows={2}
                className="input-field pr-11 resize-none" />
              {isSupported && (
                <button type="button" onClick={() => handleVoiceClick('description')}
                  className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all ${
                    isListening && voiceTarget === 'description' ? 'bg-red-500 text-white mic-active' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                  title={isListening && voiceTarget === 'description' ? 'Parar' : 'Ditar descrição'}>
                  {isListening && voiceTarget === 'description' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Voice indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-end gap-0.5 h-5">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`w-1 bg-red-400 rounded-full sound-bar-${i}`} style={{ height: '4px' }} />
                  ))}
                </div>
                <span className="text-red-600 text-sm font-medium">A ouvir… fale em Português</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeframe selector */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Planificação</label>
            <div className="grid grid-cols-4 gap-2">
              {TIMEFRAME_CONFIG.map((tf) => (
                <button key={tf.id} type="button" onClick={() => setTimeframe(tf.id)}
                  className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    timeframe === tf.id
                      ? `${tf.activeBg} ${tf.activeBorder} ${tf.activeText} ring-1 ${tf.ringColor}`
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'}`}>
                  <span className="text-lg mb-0.5">{tf.emoji}</span>
                  <span>{tf.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quadrant selector */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Quadrante (Prioridade)</label>
            <div className="grid grid-cols-2 gap-2">
              {QUADRANT_CONFIG.map((q) => (
                <button key={q.id} type="button" onClick={() => setPriority(q.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    priority === q.id
                      ? `${q.colors.cardBorder} bg-gradient-to-r ${q.colors.header} text-white ring-2 ${q.colors.ring}`
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
                  <span className="text-lg leading-none flex-shrink-0">{q.emoji}</span>
                  <div className="min-w-0">
                    <div className={`font-bold text-xs ${priority === q.id ? 'text-white' : 'text-slate-700'}`}>{q.action}</div>
                    <div className={`text-xs leading-tight truncate ${priority === q.id ? 'text-white/70' : 'text-slate-400'}`}>{q.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1.5">Categoria</label>
              <div className="flex gap-2">
                {(['trabalho', 'pessoal'] as Category[]).map((cat) => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      category === cat
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'}`}>
                    {cat === 'trabalho' ? '💼 Trabalho' : '🏠 Pessoal'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Prazo
              </label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="input-field py-2 text-xs [color-scheme:light]" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold">
              Cancelar
            </button>
            <button type="submit" className="flex-2 min-w-[140px] py-3 rounded-xl btn-primary text-sm text-center">
              {task ? '💾 Guardar' : '✨ Criar Tarefa'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
