import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useGoogleAuth } from './contexts/GoogleAuthContext';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import QuadrantBoard from './components/QuadrantBoard';
import AddTaskModal from './components/AddTaskModal';
import LoginPage from './components/LoginPage';
import NotificationOverlay, { NotifItem } from './components/NotificationOverlay';
import { Task, Priority, Timeframe } from './types';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { useAudioEngine } from './hooks/useAudioEngine';
import { getSentAlerts, addSentAlert, getLastNotificationTime, setLastNotificationTime } from './utils/storage';
import { isFirebaseConfigured } from './services/firebase';

// ── Seed for josedaninhaacuambe@gmail.com ─────────────────────────────
const JOSE_SEED_VERSION = 'v2_firebase_junho_2026';
const joseSeedKey = (uid: string) => `agenda_v2_jose_seed_${uid}`;

type SeedData = Omit<Task, 'id' | 'createdAt' | 'completedAt'>;

const JOSE_TASKS: SeedData[] = [
  { title: 'Socialização da aplicação de Roud Report',                                  priority: 'Q1', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Elaboração das Matrizes de conhecimento',                                    priority: 'Q1', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Validação dos resultados preliminares do mapeamento',                        priority: 'Q1', category: 'trabalho', timeframe: 'semanal', completed: false, description: 'Encontro com os participantes do mapeamento' },
  { title: 'Yanik — última parcela',                                                     priority: 'Q1', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Fechar documentos para Beconnected',                                         priority: 'Q1', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Terminar aplicação do Beconnected',                                          priority: 'Q1', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Encontro com os formadores DIC',                                             priority: 'Q2', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Socialização da app de leitura dos parâmetros das máquinas',                 priority: 'Q2', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Apresentar avanços da avaliação de desempenho',                              priority: 'Q2', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Encontro DTI DID — aplicação dos PT\'s',                                     priority: 'Q2', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Solicitação de servidor para Roud Report',                                   priority: 'Q2', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Eduardo — vender a máquina',                                                 priority: 'Q2', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Aprovar os candidatos',                                                      priority: 'Q2', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Iniciar treinamento dos vendedores',                                         priority: 'Q2', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Pesquisar preços de tablets — POS Beconnected',                              priority: 'Q2', category: 'pessoal',  timeframe: 'semanal', completed: false },
  { title: 'Encontro com os CIEUM',                                                      priority: 'Q3', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Encontro DTI — ponto focal para iniciativas digitais',                       priority: 'Q3', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Memorando DGRH — ponto de situação da consultoria',                          priority: 'Q3', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Lançamento do Webinar — Senhora Directora',                                  priority: 'Q3', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Gatilhos psicológicos para engajamento no repositório',                      priority: 'Q3', category: 'trabalho', timeframe: 'semanal', completed: false },
  { title: 'Escolher motorizada',                                                        priority: 'Q4', category: 'pessoal',  timeframe: 'semanal', completed: false },
];

// ── Setup screen ─────────────────────────────────────────────────────
function SetupScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-6">
        <span className="text-2xl">⚙️</span>
        <h2 className="text-slate-800 font-bold text-lg mt-3 mb-2">Configurar Google OAuth</h2>
        <pre className="bg-slate-900 text-green-400 text-xs rounded-xl p-4 mb-3 overflow-x-auto">{`VITE_GOOGLE_CLIENT_ID=...`}</pre>
        <p className="text-slate-500 text-xs">Google Cloud Console → Credentials → OAuth 2.0 Client IDs.</p>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, user } = useGoogleAuth();
  const userId = user?.sub ?? 'guest';
  const firebaseOk = isFirebaseConfigured();

  // Toast notifications queue
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const pushNotif = useCallback((n: Omit<NotifItem, 'id'>) => {
    setNotifs((prev) => [...prev, { ...n, id: uuidv4() }]);
  }, []);
  const dismissNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const { play, prewarm } = useAudioEngine();

  // Play sound + push visual notif
  const triggerAlert = useCallback((
    level: NotifItem['level'],
    title: string,
    body: string,
  ) => {
    play(level);
    pushNotif({ level, title, body });
    // Also send browser notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.svg', tag: title.slice(0, 32) });
    }
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  }, [play, pushNotif]);

  // Tasks hook (Firestore or localStorage)
  const {
    tasks, addTask: addTaskRaw, updateTask, deleteTask, toggleComplete: toggleCompleteRaw, seedTasks, syncing,
  } = useTasks(userId, isAuthenticated, (task) => {
    triggerAlert('success', `✅ Concluída!`, task.title);
  });

  const [timeframe,       setTimeframe]       = useState<Timeframe>('semanal');
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingTask,     setEditingTask]     = useState<Task | null>(null);
  const [defaultPriority, setDefaultPriority] = useState<Priority>('Q1');
  const [notifGranted,    setNotifGranted]    = useState(
    () => 'Notification' in window && Notification.permission === 'granted'
  );

  const { requestPermission, registerSW } = useNotifications();

  // Seed José's tasks on first login
  const seededRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !user || seededRef.current) return;
    if (user.email !== 'josedaninhaacuambe@gmail.com') return;
    if (tasks.length > 0) return;
    const already = localStorage.getItem(joseSeedKey(userId));
    if (already) return;
    seededRef.current = true;
    seedTasks(JOSE_TASKS).then(() => {
      localStorage.setItem(joseSeedKey(userId), JOSE_SEED_VERSION);
    });
  }, [isAuthenticated, user, tasks.length, userId, seedTasks]);

  // Register service worker
  useEffect(() => { if (isAuthenticated) registerSW(); }, [isAuthenticated, registerSW]);

  // ── Smart deadline checker ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const INTERVAL = 15 * 60 * 1000;

    const check = () => {
      const now  = new Date();
      const sent = getSentAlerts(userId);

      tasks.filter((t) => !t.completed && t.dueDate).forEach((t) => {
        const due  = parseISO(t.dueDate!);
        const mins = differenceInMinutes(due, now);

        const checks: Array<[string, number | null, NotifItem['level'], string]> = [
          ['24h',    1440, 'reminder',   '🔔 Prazo amanhã'],
          ['2h',     120,  'important',  '⚠️ Prazo em 2 horas'],
          ['30min',  30,   'deadline30', '⚠️ Prazo em 30 minutos'],
          ['5min',   5,    'deadline5',  '🚨 Prazo em 5 minutos!'],
          ['overdue',null, 'overdue',    '💀 Prazo ultrapassado!'],
        ];

        checks.forEach(([key, threshold, level, label]) => {
          const alertKey = `${t.id}_${key}`;
          if (sent.has(alertKey)) return;
          const fire = threshold === null
            ? mins < 0
            : mins <= threshold && mins >= threshold - 16;
          if (!fire) return;
          triggerAlert(level, label, t.title);
          addSentAlert(userId, alertKey);
          sent.add(alertKey);
        });
      });

      // 15-min periodic reminder
      if (Date.now() - getLastNotificationTime() >= INTERVAL) {
        const urgent = tasks.filter((t) => !t.completed && t.priority === 'Q1');
        if (urgent.length > 0) {
          triggerAlert('urgent', `🔴 ${urgent.length} tarefa${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''}`,
            urgent.slice(0, 2).map((t) => t.title).join(' • '));
          setLastNotificationTime();
        }
      }
    };

    check();
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, [tasks, userId, isAuthenticated, triggerAlert]);

  const handleRequestNotif = useCallback(async () => {
    prewarm(); // pre-warm AudioContext on user gesture
    const ok = await requestPermission();
    setNotifGranted(ok);
    if (ok) triggerAlert('reminder', '🔔 Notificações activadas!', 'Receberá alertas quando os prazos se aproximarem.');
  }, [requestPermission, triggerAlert, prewarm]);

  // ── Task actions ──────────────────────────────────────────────
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    await addTaskRaw(data);
    setIsModalOpen(false);
    setEditingTask(null);
    play('reminder');
  }, [addTaskRaw, play]);

  const handleUpdateTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    setIsModalOpen(false);
    setEditingTask(null);
  }, [editingTask, updateTask]);

  const handleDeleteTask = useCallback((id: string) => deleteTask(id), [deleteTask]);

  const handleToggle = useCallback(async (id: string) => {
    prewarm();
    await toggleCompleteRaw(id);
  }, [toggleCompleteRaw, prewarm]);

  const openAdd  = (priority: Priority = 'Q1') => { setEditingTask(null); setDefaultPriority(priority); setIsModalOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setDefaultPriority(task.priority); setIsModalOpen(true); };

  // ── Guards ────────────────────────────────────────────────────
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return <SetupScreen />;
  if (!isAuthenticated) return <LoginPage />;

  const visibleTasks = tasks.filter((t) => t.timeframe === timeframe);
  const pendingQ1    = visibleTasks.filter((t) => t.priority === 'Q1' && !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* Visual notifications */}
      <NotificationOverlay notifications={notifs} onDismiss={dismissNotif} />

      <Header
        tasks={visibleTasks}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onAddTask={() => openAdd()}
        notificationGranted={notifGranted}
        onRequestNotification={handleRequestNotif}
      />

      <main className="container mx-auto px-4 pt-5">
        {/* Sync indicator */}
        {firebaseOk && (
          <motion.div
            animate={{ opacity: syncing ? 1 : 0 }}
            className="mb-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-indigo-600 text-xs font-semibold">
            <Cloud className="w-4 h-4 animate-pulse" />
            A sincronizar com todos os dispositivos…
          </motion.div>
        )}

        {/* Urgent CTA */}
        <AnimatePresence>
          {pendingQ1 > 0 && (
            <motion.div key="urgent-banner"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-red-100">
              <motion.span animate={{ rotate: [0,-8,8,-8,0] }} transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }} className="text-3xl">🚨</motion.span>
              <div className="flex-1">
                <h3 className="text-white font-black text-base">
                  {pendingQ1} tarefa{pendingQ1 > 1 ? 's' : ''} urgente{pendingQ1 > 1 ? 's' : ''}!
                </h3>
                <p className="text-white/75 text-sm mt-0.5">Estas tarefas exigem atenção imediata.</p>
              </div>
              <button onClick={() => { prewarm(); openAdd('Q1'); }}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all flex-shrink-0">
                + Urgente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {visibleTasks.length === 0 && (
            <motion.div key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm">
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
          onToggleComplete={handleToggle}
          onEdit={openEdit}
          onDelete={handleDeleteTask}
          onAddTask={openAdd}
        />

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Urgente + Importante',        desc: 'Faça agora', cls: 'text-red-600   bg-red-50   border-red-200' },
            { label: 'Importante, Não Urgente',     desc: 'Agende',     cls: 'text-blue-600  bg-blue-50  border-blue-200' },
            { label: 'Urgente, Não Importante',     desc: 'Delegue',    cls: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Não Urgente, Não Importante', desc: 'Elimine',    cls: 'text-slate-500 bg-slate-50 border-slate-200' },
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
            onSave={editingTask ? handleUpdateTask : addTask}
            onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
