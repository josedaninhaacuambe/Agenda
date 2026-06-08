import { Task } from '../types';

// v2 prefix = reset efectivo; chaves antigas (agenda_tasks_*) são ignoradas
const userKey   = (uid: string) => `agenda_v2_${uid}`;
const NOTIF_KEY  = 'agenda_last_notification';
const alertsKey = (uid: string) => `agenda_v2_alerts_${uid}`;

export const loadTasks = (userId: string): Task[] => {
  try {
    const data = localStorage.getItem(userKey(userId));
    return data ? (JSON.parse(data) as Task[]) : [];
  } catch {
    return [];
  }
};

export const saveTasks = (userId: string, tasks: Task[]): void => {
  localStorage.setItem(userKey(userId), JSON.stringify(tasks));
};

export const getLastNotificationTime = (): number =>
  parseInt(localStorage.getItem(NOTIF_KEY) || '0', 10);

export const setLastNotificationTime = (): void =>
  localStorage.setItem(NOTIF_KEY, Date.now().toString());

export const getSentAlerts = (uid: string): Set<string> => {
  try {
    const raw = localStorage.getItem(alertsKey(uid));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

export const addSentAlert = (uid: string, key: string): void => {
  const set = getSentAlerts(uid);
  set.add(key);
  const arr = Array.from(set).slice(-500);
  localStorage.setItem(alertsKey(uid), JSON.stringify(arr));
};
