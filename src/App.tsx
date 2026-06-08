import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useGoogleAuth } from './contexts/GoogleAuthContext';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import QuadrantBoard from './components/QuadrantBoard';
import AddTaskModal from './components/AddTaskModal';
import LoginPage from './components/LoginPage';
import { Task, Priority, Timeframe } from './types';
import { loadTasks, saveTasks } from './utils/storage';
import { useNotifications } from './hooks/useNotifications';


/* ── Setup instructions (no .env configured) ────────────────── */
function SetupScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-6">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
          <span className="text-2xl">⚙️</span>
        </div>
        <h2 className="text-slate-800 font-bold text-lg mb-2">Configurar Google OAuth</h2>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          Crie um ficheiro <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code> na raiz do projecto com:
        </p>
        <pre className="bg-slate-900 text-green-400 text-xs rounded-xl p-4 mb-4 overflow-x-auto">{`VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com`}</pre>
        <p className="text-slate-500 text-xs leading-relaxed">
          Obtenha o Client ID no <strong>Google Cloud Console</strong> → APIs &amp; Services → Credentials → OAuth 2.0 Client IDs.
        </p>
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────────── */
export default function App() {
  const { isAuthenticated, user } = useGoogleAuth();

  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [timeframe,  setTimeframe]  = useState<Timeframe>('semanal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultPriority, setDefaultPriority] = useState<Priority>('Q1');
  const [notifGranted, setNotifGranted] = useState(
    () => 'Notification' in window && Notification.permission === 'granted'
  );

  const { requestPermission, registerSW, checkAndRemind, checkDeadlines } = useNotifications();
  const userId = user?.sub ?? 'guest';

  // Load tasks when authenticated — each user has isolated storage
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const saved = loadTasks(userId);
    // Migrate any old tasks that lack a timeframe field
    const migrated = saved.map((t) => ({
      ...t,
      timeframe: (t as Task & { timeframe?: Timeframe }).timeframe ?? 'semanal' as Timeframe,
    }));
    setTasks(migrated);
    registerSW();
  }, [isAuthenticated, user, userId, registerSW]);

  // Persist
  useEffect(() => {
    if (isAuthenticated && tasks.length > 0) saveTasks(userId, tasks);
  }, [tasks, userId, isAuthenticated]);

  // 15-min periodic reminder + deadline alerts every minute
  useEffect(() => {
    if (!isAuthenticated) return;
    checkAndRemind(tasks);
    checkDeadlines(tasks, userId);
    const iv = setInterval(() => {
      checkAndRemind(tasks);
      checkDeadlines(tasks, userId);
    }, 60_000);
    return () => clearInterval(iv);
  }, [tasks, checkAndRemind, checkDeadlines, isAuthenticated, userId]);

  const handleRequestNotif = useCallback(async () => {
    const ok = await requestPermission();
    setNotifGranted(ok);
    if (ok) checkAndRemind(tasks);
  }, [requestPermission, checkAndRemind, tasks]);

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    setTasks((p) => [{ ...data, id: uuidv4(), createdAt: new Date().toISOString(), completed: false }, ...p]);
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const updateTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (!editingTask) return;
    setTasks((p) => p.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t)));
    setIsModalOpen(false);
    setEditingTask(null);
  }, [editingTask]);

  const deleteTask    = useCallback((id: string) => setTasks((p) => p.filter((t) => t.id !== id)), []);
  const toggleComplete = useCallback((id: string) => {
    setTasks((p) => p.map((t) =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    ));
  }, []);

  const openAdd = (priority: Priority = 'Q1') => {
    setEditingTask(null);
    setDefaultPriority(priority);
    setIsModalOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setDefaultPriority(task.priority);
    setIsModalOpen(true);
  };

  // ── Guards ──────────────────────────────────────────────────
  const envMissing = !import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envMissing)       return <SetupScreen />;
  if (!isAuthenticated) return <LoginPage />;

  // ── Filtered tasks for the current timeframe ────────────────
  const visibleTasks = tasks.filter((t) => t.timeframe === timeframe);
  const pendingQ1    = visibleTasks.filter((t) => t.priority === 'Q1' && !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <Header
        tasks={visibleTasks}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onAddTask={() => openAdd()}
        notificationGranted={notifGranted}
        onRequestNotification={handleRequestNotif}
      />

      <main className="container mx-auto px-4 pt-5">
        {/* Urgent CTA banner */}
        <AnimatePresence>
          {pendingQ1 > 0 && (
            <motion.div
              key="urgent-banner"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-red-100"
            >
              <motion.span animate={{ rotate: [0,-8,8,-8,0] }} transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }} className="text-3xl">🚨</motion.span>
              <div className="flex-1">
                <h3 className="text-white font-black text-base">
                  {pendingQ1} tarefa{pendingQ1 > 1 ? 's' : ''} urgente{pendingQ1 > 1 ? 's' : ''}!
                </h3>
                <p className="text-white/75 text-sm mt-0.5">Estas tarefas exigem atenção imediata. Comece por elas agora.</p>
              </div>
              <button onClick={() => openAdd('Q1')}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all flex-shrink-0">
                + Urgente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state for timeframe */}
        <AnimatePresence>
          {visibleTasks.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm"
            >
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-700 font-bold">Nenhuma tarefa aqui ainda</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">Adicione as suas actividades para este período</p>
              <button onClick={() => openAdd('Q1')} className="btn-primary text-sm mx-auto">
                + Adicionar primeira tarefa
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <StatsBar tasks={visibleTasks} timeframe={timeframe} />

        <QuadrantBoard
          tasks={visibleTasks}
          onToggleComplete={toggleComplete}
          onEdit={openEdit}
          onDelete={deleteTask}
          onAddTask={openAdd}
        />

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Urgente + Importante',        desc: 'Faça agora',         cls: 'text-red-600   bg-red-50   border-red-200' },
            { label: 'Importante, Não Urgente',     desc: 'Agende',             cls: 'text-blue-600  bg-blue-50  border-blue-200' },
            { label: 'Urgente, Não Importante',     desc: 'Delegue',            cls: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Não Urgente, Não Importante', desc: 'Elimine',            cls: 'text-slate-500 bg-slate-50 border-slate-200' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border px-3 py-2.5 shadow-sm ${item.cls}`}>
              <p className="text-xs font-bold">{item.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <AddTaskModal
            key="modal"
            task={editingTask}
            defaultPriority={defaultPriority}
            defaultTimeframe={timeframe}
            onSave={editingTask ? updateTask : addTask}
            onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
