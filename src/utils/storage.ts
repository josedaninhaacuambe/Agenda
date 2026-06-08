import { Task } from '../types';

const userKey  = (uid: string) => `agenda_tasks_${uid}`;
const seedKey  = (uid: string) => `agenda_seed_${uid}`;
const NOTIF_KEY = 'agenda_last_notification';
const LEGACY_KEY = 'agenda_pro_tasks';

export const loadTasks = (userId: string): Task[] => {
  try {
    const data = localStorage.getItem(userKey(userId));
    if (data) return JSON.parse(data) as Task[];

    // One-time migration from the old anonymous key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.setItem(userKey(userId), legacy);
      localStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy) as Task[];
    }
    return [];
  } catch {
    return [];
  }
};

export const saveTasks = (userId: string, tasks: Task[]): void => {
  localStorage.setItem(userKey(userId), JSON.stringify(tasks));
};

export const getSeedVersion = (userId: string): string | null =>
  localStorage.getItem(seedKey(userId));

export const setSeedVersion = (userId: string, version: string): void =>
  localStorage.setItem(seedKey(userId), version);

export const getLastNotificationTime = (): number =>
  parseInt(localStorage.getItem(NOTIF_KEY) || '0', 10);

export const setLastNotificationTime = (): void =>
  localStorage.setItem(NOTIF_KEY, Date.now().toString());
