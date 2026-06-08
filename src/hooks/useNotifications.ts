import { useCallback, useRef } from 'react';
import { Task } from '../types';
import { getLastNotificationTime, setLastNotificationTime } from '../utils/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const INTERVAL_MS = 15 * 60 * 1000;

export const useNotifications = () => {
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const registerSW = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRef.current = reg;
    } catch {
      // SW not critical
    }
  }, []);

  const sendNotification = useCallback((tasks: Task[]) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const pending = tasks.filter((t) => !t.completed);
    if (pending.length === 0) return;

    const urgent = pending.filter((t) => t.priority === 'Q1');
    const important = pending.filter((t) => t.priority === 'Q2');
    const time = format(new Date(), 'HH:mm', { locale: ptBR });

    let title: string;
    let body: string;

    if (urgent.length > 0) {
      title = `🔴 ${urgent.length} tarefa${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''} — ${time}`;
      body = urgent
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join('\n');
      if (urgent.length > 3) body += `\n• +${urgent.length - 3} mais...`;
    } else if (important.length > 0) {
      title = `🔵 Lembrete: ${important.length} tarefa${important.length > 1 ? 's' : ''} importante${important.length > 1 ? 's' : ''}`;
      body = important
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join('\n');
    } else {
      title = `📋 ${pending.length} tarefa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''} — ${time}`;
      body = pending
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join('\n');
    }

    if (swRef.current?.active) {
      swRef.current.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
    } else {
      const notif = new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: 'agenda-reminder',
        requireInteraction: false,
      });
      notif.onclick = () => { window.focus(); notif.close(); };
    }

    setLastNotificationTime();
  }, []);

  const checkAndRemind = useCallback(
    (tasks: Task[]) => {
      const last = getLastNotificationTime();
      if (Date.now() - last >= INTERVAL_MS) {
        sendNotification(tasks);
      }
    },
    [sendNotification]
  );

  return { requestPermission, registerSW, sendNotification, checkAndRemind };
};
