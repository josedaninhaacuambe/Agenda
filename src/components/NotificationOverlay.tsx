import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Bell, Clock, CheckCircle2, Zap } from 'lucide-react';

export interface NotifItem {
  id:      string;
  level:   'urgent' | 'important' | 'reminder' | 'deadline30' | 'deadline5' | 'overdue' | 'success';
  title:   string;
  body:    string;
  autoDismissMs?: number; // default 6000; urgent = 0 (manual only)
}

interface Props {
  notifications: NotifItem[];
  onDismiss: (id: string) => void;
}

const CONFIG = {
  urgent:    { bg: 'bg-red-600',     border: 'border-red-700',    text: 'text-white',      icon: AlertTriangle, emoji: '🚨', label: 'URGENTE',        bar: 'bg-red-400'    },
  important: { bg: 'bg-blue-600',    border: 'border-blue-700',   text: 'text-white',      icon: Bell,          emoji: '🔵', label: 'IMPORTANTE',     bar: 'bg-blue-400'   },
  reminder:  { bg: 'bg-slate-800',   border: 'border-slate-900',  text: 'text-white',      icon: Bell,          emoji: '🔔', label: 'LEMBRETE',       bar: 'bg-slate-600'  },
  deadline30:{ bg: 'bg-amber-500',   border: 'border-amber-600',  text: 'text-white',      icon: Clock,         emoji: '⚠️', label: 'PRAZO EM 30MIN', bar: 'bg-amber-300'  },
  deadline5: { bg: 'bg-orange-600',  border: 'border-orange-700', text: 'text-white',      icon: Zap,           emoji: '⚡', label: 'PRAZO EM 5MIN',  bar: 'bg-orange-400' },
  overdue:   { bg: 'bg-red-950',     border: 'border-red-900',    text: 'text-red-100',    icon: AlertTriangle, emoji: '💀', label: 'PRAZO PERDIDO',  bar: 'bg-red-800'    },
  success:   { bg: 'bg-emerald-600', border: 'border-emerald-700',text: 'text-white',      icon: CheckCircle2,  emoji: '✅', label: 'CONCLUÍDA',      bar: 'bg-emerald-400'},
};

function NotifCard({ notif, onDismiss }: { notif: NotifItem; onDismiss: () => void }) {
  const cfg   = CONFIG[notif.level];
  const Icon  = cfg.icon;
  const ms    = notif.autoDismissMs ?? (notif.level === 'urgent' || notif.level === 'overdue' ? 0 : 6000);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!ms) return;
    const start = Date.now();
    const tick  = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct     = Math.max(0, 100 - (elapsed / ms) * 100);
      setProgress(pct);
      if (pct === 0) { clearInterval(tick); onDismiss(); }
    }, 50);
    return () => clearInterval(tick);
  }, [ms, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 320, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,   scale: 1   }}
      exit={{    opacity: 0, x: 320, scale: 0.9, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl border-2 shadow-2xl overflow-hidden w-full max-w-sm ${cfg.bg} ${cfg.border}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Pulse ring for urgent/overdue */}
      {(notif.level === 'urgent' || notif.level === 'deadline5' || notif.level === 'overdue') && (
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className={`absolute inset-0 rounded-2xl border-4 ${cfg.border} pointer-events-none`}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <motion.div
            animate={(notif.level === 'urgent' || notif.level === 'overdue')
              ? { rotate: [0, -10, 10, -10, 10, 0] }
              : notif.level === 'success'
              ? { scale: [1, 1.2, 1] }
              : {}}
            transition={{ repeat: Infinity, duration: 0.8, repeatDelay: 1.5 }}
            className="text-2xl flex-shrink-0 mt-0.5"
          >
            {cfg.emoji}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-black tracking-widest ${cfg.text} opacity-80`}>{cfg.label}</span>
              <Icon className={`w-3.5 h-3.5 ${cfg.text} opacity-70`} />
            </div>
            <p className={`text-sm font-bold leading-snug ${cfg.text} line-clamp-2`}>{notif.title}</p>
            {notif.body && (
              <p className={`text-xs mt-1 opacity-75 ${cfg.text} line-clamp-2`}>{notif.body}</p>
            )}
          </div>

          <button
            onClick={onDismiss}
            className={`p-1.5 rounded-xl hover:bg-black/20 transition-colors flex-shrink-0 ${cfg.text}`}
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar (auto-dismiss countdown) */}
        {ms > 0 && (
          <div className="h-1 rounded-full bg-black/20 overflow-hidden mt-1">
            <motion.div
              className={`h-full rounded-full ${cfg.bar}`}
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function NotificationOverlay({ notifications, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 4).map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <NotifCard notif={n} onDismiss={() => onDismiss(n.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
