import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import QuadrantBoard from './components/QuadrantBoard';
import AddTaskModal from './components/AddTaskModal';
import { Task, Priority } from './types';
import { loadTasks, saveTasks } from './utils/storage';
import { useNotifications } from './hooks/useNotifications';

const SEED_VERSION = 'v3_semana_junho_2026';
const SEED_KEY = 'agenda_seed_version';

// Metas da semana classificadas na Matriz de Eisenhower
const WEEKLY_TASKS: Omit<Task, 'id' | 'createdAt' | 'completedAt'>[] = [
  // ── Q1: FAÇA AGORA — Urgente + Importante ─────────────────────────────
  {
    title: 'Socialização da aplicação de Roud Report',
    description: 'Urgente — divulgar e implementar junto das equipas',
    priority: 'Q1', category: 'trabalho', completed: false,
  },
  {
    title: 'Elaboração das Matrizes de conhecimento',
    priority: 'Q1', category: 'trabalho', completed: false,
  },
  {
    title: 'Encontro com os participantes do mapeamento — validação dos resultados preliminares',
    description: 'Validar resultados preliminares do mapeamento',
    priority: 'Q1', category: 'trabalho', completed: false,
  },
  {
    title: 'Yanik — última parcela',
    priority: 'Q1', category: 'pessoal', completed: false,
  },
  {
    title: 'Fechar processo dos documentos para Beconnected',
    priority: 'Q1', category: 'pessoal', completed: false,
  },
  {
    title: 'Terminar toda a aplicação do Beconnected',
    priority: 'Q1', category: 'pessoal', completed: false,
  },
  {
    title: 'Aprovar os candidatos',
    priority: 'Q1', category: 'pessoal', completed: false,
  },

  // ── Q2: PLANEJE — Importante, Não Urgente ─────────────────────────────
  {
    title: 'Encontro com os formadores DIC',
    description: 'Agendar e preparar conteúdo',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Encontro de socialização — leitura dos parâmetros das máquinas',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Apresentar os avanços da aplicação da avaliação de desempenho',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Encontro DTI DID — aplicação dos PT\'s',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Solicitação de um servidor para aplicação de Roud Report',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Encontro com os CIEUM',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Encontro DTI — ponto focal para as iniciativas digitais',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Memorando DGRH — ponto de situação do uso dos resultados da consultoria',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Lançamento do Webinar — Senhora Directora',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Estudar e implementar gatilhos psicológicos para o repositório do conhecimento',
    description: 'Melhorar o engajamento dos utilizadores',
    priority: 'Q2', category: 'trabalho', completed: false,
  },
  {
    title: 'Eduardo — vender a máquina',
    priority: 'Q2', category: 'pessoal', completed: false,
  },
  {
    title: 'Iniciar o treinamento dos vendedores',
    priority: 'Q2', category: 'pessoal', completed: false,
  },
  {
    title: 'Pesquisar preços de tablets compatíveis com o POS Beconnected',
    priority: 'Q2', category: 'pessoal', completed: false,
  },

  // ── Q3: DELEGUE — Urgente, Não Importante ─────────────────────────────
  {
    title: 'Escolher motorizada',
    priority: 'Q3', category: 'pessoal', completed: false,
  },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultPriority, setDefaultPriority] = useState<Priority>('Q1');
  const [notificationGranted, setNotificationGranted] = useState(
    () => 'Notification' in window && Notification.permission === 'granted'
  );

  const { requestPermission, registerSW, checkAndRemind } = useNotifications();

  useEffect(() => {
    const saved = loadTasks();
    const seedVersion = localStorage.getItem(SEED_KEY);

    if (saved.length === 0 || seedVersion !== SEED_VERSION) {
      const seeded = WEEKLY_TASKS.map((t) => ({
        ...t,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      }));
      setTasks(seeded);
      localStorage.setItem(SEED_KEY, SEED_VERSION);
    } else {
      setTasks(saved);
    }

    registerSW();
  }, [registerSW]);

  useEffect(() => {
    if (tasks.length > 0) saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    checkAndRemind(tasks);
    const interval = setInterval(() => checkAndRemind(tasks), 60_000);
    return () => clearInterval(interval);
  }, [tasks, checkAndRemind]);

  const handleRequestNotification = useCallback(async () => {
    const granted = await requestPermission();
    setNotificationGranted(granted);
    if (granted) checkAndRemind(tasks);
  }, [requestPermission, checkAndRemind, tasks]);

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), completed: false };
    setTasks((prev) => [newTask, ...prev]);
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const updateTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t))
    );
    setIsModalOpen(false);
    setEditingTask(null);
  }, [editingTask]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      )
    );
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

  const pendingQ1 = tasks.filter((t) => t.priority === 'Q1' && !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <Header
        tasks={tasks}
        onAddTask={() => openAdd()}
        notificationGranted={notificationGranted}
        onRequestNotification={handleRequestNotification}
      />

      <main className="container mx-auto px-4 pt-5">
        {/* Urgent call-to-action banner */}
        <AnimatePresence>
          {pendingQ1 > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-red-100"
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }}
                className="text-3xl"
              >
                🚨
              </motion.span>
              <div className="flex-1">
                <h3 className="text-white font-black text-base">
                  {pendingQ1} tarefa{pendingQ1 > 1 ? 's' : ''} urgente{pendingQ1 > 1 ? 's' : ''} esta semana!
                </h3>
                <p className="text-white/75 text-sm mt-0.5">
                  Estas tarefas exigem a sua atenção imediata. Comece por elas agora.
                </p>
              </div>
              <button
                onClick={() => openAdd('Q1')}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all flex-shrink-0"
              >
                + Urgente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <StatsBar tasks={tasks} />

        <QuadrantBoard
          tasks={tasks}
          onToggleComplete={toggleComplete}
          onEdit={openEdit}
          onDelete={deleteTask}
          onAddTask={openAdd}
        />

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: 'Urgente + Importante', desc: 'Faça agora, não delegue', color: 'text-red-600 bg-red-50 border-red-200' },
            { label: 'Importante, Não Urgente', desc: 'Agende com antecedência', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { label: 'Urgente, Não Importante', desc: 'Delegue se possível', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Não Urgente, Não Importante', desc: 'Elimine ou minimize', color: 'text-slate-500 bg-slate-50 border-slate-200' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border px-3 py-2.5 shadow-sm ${item.color}`}>
              <p className="text-xs font-bold">{item.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AddTaskModal
            key="modal"
            task={editingTask}
            defaultPriority={defaultPriority}
            onSave={editingTask ? updateTask : addTask}
            onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
