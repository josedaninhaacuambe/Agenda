import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  query, orderBy, writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { Task, Timeframe } from '../types';
import { loadTasks, saveTasks } from '../utils/storage';

type TaskData = Omit<Task, 'id' | 'createdAt' | 'completed'>;

export function useTasks(userId: string, isAuthenticated: boolean, onComplete?: (task: Task) => void) {
  const [tasks,   setTasksState] = useState<Task[]>([]);
  const [syncing, setSyncing]    = useState(false);
  const firebase = isFirebaseConfigured() && !!db;

  // ── Load / real-time sync ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !userId || userId === 'guest') return;

    if (firebase && db) {
      setSyncing(true);
      const q = query(collection(db, 'users', userId, 'tasks'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
        setTasksState(fetched);
        setSyncing(false);
        saveTasks(userId, fetched); // local cache for offline
      }, () => {
        // Firestore error → fall back to local cache
        const cached = loadTasks(userId);
        setTasksState(cached);
        setSyncing(false);
      });
      return unsub;
    } else {
      // localStorage mode
      const saved = loadTasks(userId);
      const migrated = saved.map((t) => ({
        ...t,
        timeframe: (t as Task & { timeframe?: Timeframe }).timeframe ?? ('semanal' as Timeframe),
      }));
      setTasksState(migrated);
    }
  }, [userId, isAuthenticated, firebase]);

  // ── Persist (localStorage only) ───────────────────────────────
  useEffect(() => {
    if (!firebase && isAuthenticated && tasks.length > 0) saveTasks(userId, tasks);
  }, [tasks, userId, isAuthenticated, firebase]);

  // ── Setters ───────────────────────────────────────────────────
  const setTasks = useCallback((fn: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(fn);
  }, []);

  const addTask = useCallback(async (data: TaskData): Promise<Task> => {
    const id   = uuidv4();
    const task: Task = { ...data, id, createdAt: new Date().toISOString(), completed: false };
    if (firebase && db) {
      await setDoc(doc(db, 'users', userId, 'tasks', id), task);
    } else {
      setTasksState((p) => [task, ...p]);
    }
    return task;
  }, [userId, firebase]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    if (firebase && db) {
      const { id: _id, ...rest } = { id, ...data }; void _id;
      await setDoc(doc(db, 'users', userId, 'tasks', id), rest, { merge: true });
    } else {
      setTasksState((p) => p.map((t) => (t.id === id ? { ...t, ...data } : t)));
    }
  }, [userId, firebase]);

  const deleteTask = useCallback(async (id: string) => {
    if (firebase && db) {
      await deleteDoc(doc(db, 'users', userId, 'tasks', id));
    } else {
      setTasksState((p) => p.filter((t) => t.id !== id));
    }
  }, [userId, firebase]);

  const toggleComplete = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    const updates: Partial<Task> = {
      completed:   newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : undefined,
    };
    await updateTask(id, updates);
    if (newCompleted && onComplete) onComplete({ ...task, ...updates });
  }, [tasks, updateTask, onComplete]);

  // Seed a list of tasks all at once (first login)
  const seedTasks = useCallback(async (seedList: TaskData[]) => {
    if (firebase && db) {
      const database = db;
      const batch = writeBatch(database);
      seedList.forEach((data) => {
        const id = uuidv4();
        const t: Task = { ...data, id, createdAt: new Date().toISOString(), completed: false };
        batch.set(doc(database, 'users', userId, 'tasks', id), t);
      });
      await batch.commit();
    } else {
      const seeded = seedList.map((data) => ({
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        completed: false,
      } as Task));
      setTasksState(seeded);
    }
  }, [userId, firebase]);

  return { tasks, setTasks, addTask, updateTask, deleteTask, toggleComplete, seedTasks, syncing };
}
