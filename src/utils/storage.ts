import { Task } from '../types';

const TASKS_KEY = 'agenda_pro_tasks';
const NOTIFICATION_KEY = 'agenda_last_notification';

export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getLastNotificationTime = (): number => {
  return parseInt(localStorage.getItem(NOTIFICATION_KEY) || '0', 10);
};

export const setLastNotificationTime = (): void => {
  localStorage.setItem(NOTIFICATION_KEY, Date.now().toString());
};
