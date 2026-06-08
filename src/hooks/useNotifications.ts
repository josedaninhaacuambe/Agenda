import { useCallback, useRef } from 'react';
import { parseISO, differenceInMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../types';
import {
  getLastNotificationTime, setLastNotificationTime,
  getSentAlerts, addSentAlert,
} from '../utils/storage';

const INTERVAL_MS = 15 * 60 * 1000;

const THRESHOLDS = [
  { key: '24h',    minutes: 1440, label: '24 horas'   },
  { key: '2h',     minutes: 120,  label: '2 horas'    },
  { key: '30min',  minutes: 30,   label: '30 minutos' },
  { key: '5min',   minutes: 5,    label: '5 minutos'  },
  { key: 'overdue',minutes: -1,   label: 'Prazo ultrapassado' },
];

function sendBrowserNotif(title: string, body: string, sw: ServiceWorkerRegistration | null) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Try service worker first (shows even when tab is in background)
  if (sw?.active) {
    sw.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
    return;
  }
  // Fallback: direct Notification API
  const n = new Notification(title, {
    body,
    icon: '/icon.svg',
    tag:  title.slice(0, 32),
    requireInteraction: false,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

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
      swRef.current = await navigator.serviceWorker.register('/sw.js');
    } catch {
      // SW not critical — direct Notification API is the fallback
    }
  }, []);

  // ── 15-min periodic reminder ──────────────────────────────────
  const sendNotification = useCallback((tasks: Task[]) => {
    const pending = tasks.filter((t) => !t.completed);
    if (pending.length === 0) return;

    const urgent    = pending.filter((t) => t.priority === 'Q1');
    const important = pending.filter((t) => t.priority === 'Q2');
    const time      = format(new Date(), 'HH:mm', { locale: ptBR });

    let title: string;
    let body:  string;

    if (urgent.length > 0) {
      title = `🔴 ${urgent.length} tarefa${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''} — ${time}`;
      body  = urgent.slice(0, 3).map((t) => `• ${t.title}`).join('\n');
      if (urgent.length > 3) body += `\n• +${urgent.length - 3} mais…`;
    } else if (important.length > 0) {
      title = `🔵 Lembrete: ${important.length} tarefa${important.length > 1 ? 's' : ''} importante${important.length > 1 ? 's' : ''}`;
      body  = important.slice(0, 3).map((t) => `• ${t.title}`).join('\n');
    } else {
      title = `📋 ${pending.length} tarefa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''} — ${time}`;
      body  = pending.slice(0, 3).map((t) => `• ${t.title}`).join('\n');
    }

    sendBrowserNotif(title, body, swRef.current);
    setLastNotificationTime();
  }, []);

  const checkAndRemind = useCallback((tasks: Task[]) => {
    if (Date.now() - getLastNotificationTime() >= INTERVAL_MS) {
      sendNotification(tasks);
    }
  }, [sendNotification]);

  // ── Deadline-based smart alerts ───────────────────────────────
  const checkDeadlines = useCallback((tasks: Task[], userId: string) => {
    const now  = new Date();
    const sent = getSentAlerts(userId);

    tasks
      .filter((t) => !t.completed && t.dueDate)
      .forEach((t) => {
        const due     = parseISO(t.dueDate!);
        const minLeft = differenceInMinutes(due, now);

        THRESHOLDS.forEach(({ key, minutes, label }) => {
          const alertKey = `${t.id}_${key}`;
          if (sent.has(alertKey)) return;

          const shouldFire =
            key === 'overdue'
              ? minLeft < 0
              : minLeft <= minutes && minLeft >= minutes - 16;

          if (!shouldFire) return;

          const dueStr = format(due, "d MMM 'às' HH:mm", { locale: ptBR });
          const title  = key === 'overdue' ? `⏰ Prazo ultrapassado!` : `🔔 Prazo em ${label}`;
          const body   = `"${t.title}" — ${dueStr}`;

          sendBrowserNotif(title, body, swRef.current);
          addSentAlert(userId, alertKey);
          sent.add(alertKey);
        });
      });
  }, []);

  return { requestPermission, registerSW, sendNotification, checkAndRemind, checkDeadlines };
};
