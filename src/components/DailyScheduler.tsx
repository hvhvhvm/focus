import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Calendar as CalendarIcon,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Trash2,
  Dumbbell,
  RotateCcw,
  CheckCircle2,
  FolderPlus,
  ListTree,
  Clock,
  X,
  Pencil,
  GripVertical,
  Bell,
  BellOff,
  Repeat2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateString, dateToday } from '../data';
import type { NutritionTargets } from '../types';
import {
  getBlockProteinGoal,
  BLOCK_PROTEIN_KEYS,
  type TimeBlock,
} from '../lib/nutritionBlocks';
import ProteinBlockBar from './ProteinBlockBar';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface SchedulerTask {
  id: string;
  date: string; // YYYY-MM-DD
  timeBlock: TimeBlock;
  title: string;
  completed: boolean;
  scheduledTime?: string; // e.g. "07:30 AM"
  type?: 'standard' | 'choice' | 'group';
  options?: string[];
  selectedOption?: string;
  subtasks?: SubTask[];
  createdAt: string;
  /** Recurrence settings — only on template tasks */
  recurrence?: {
    type: RecurrenceType;
    reminderTime?: string; // "HH:MM" 24-h for push notification
    notificationId?: string;
  };
  /** Dates ("YYYY-MM-DD") of materialized instances that were deleted by user */
  deletedDates?: string[];
  /** True if this is the source template for a recurring series */
  isRecurrenceTemplate?: boolean;
  /** Links a materialized instance back to its template */
  recurrenceTemplateId?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'focus_now_daily_scheduler_tasks_v10';
const LOCAL_NUTRITION_TARGETS_KEY = 'focus_now_scheduler_protein_targets_v1';
const APP_NUTRITION_TARGETS_KEY = '90day_nutrition_targets';
const APP_LOGGED_FOODS_KEY = '90day_logged_foods';
const NOTIF_BANNER_KEY   = 'focus_now_notif_banner_dismissed';
const DAY_BRIEFING_HOUR  = 6; // 6:00 AM every day
const DAY_BRIEFING_MIN   = 0;

const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  protein: 150,
  carbs: 200,
  fats: 70,
  fiber: 25,
  calories: 2000,
};

export const DEFAULT_SPORTS_OPTIONS = [
  'Gym', 'Badminton', 'Tennis', 'Football', 'Basketball',
  'Swimming', 'Running', 'Yoga', 'Cycling', 'Cricket',
];

export const SPORTS_ICONS_MAP: Record<string, string> = {
  'Gym': '🏋️', 'Badminton': '🏸', 'Tennis': '🎾', 'Football': '⚽',
  'Basketball': '🏀', 'Swimming': '🏊', 'Running': '🏃', 'Yoga': '🧘',
  'Cycling': '🚴', 'Cricket': '🏏', 'Boxing': '🥊', 'Padel': '🎾',
  'Table Tennis': '🏓', 'Workout': '💪',
};

const BLOCK_TIME_PRESETS: Record<TimeBlock, string[]> = {
  Morning:   ['06:30 AM', '07:30 AM', '08:30 AM', '10:00 AM'],
  Afternoon: ['12:30 PM', '02:00 PM', '03:30 PM', '04:30 PM'],
  Evening:   ['05:30 PM', '06:30 PM', '07:45 PM', '08:30 PM'],
  Night:     ['09:15 PM', '10:00 PM', '11:00 PM', '11:30 PM'],
};

const MOTIVATIONAL_MESSAGES = [
  'Champions do it anyway — this is your moment! 🔥',
  'Discipline beats motivation every single time. Let\'s go! 💪',
  'Your future self is watching. Make them proud! 🏆',
  'One task at a time. You\'ve got this! ⚡',
  'Success is just consistent action. Start now! 🚀',
  'You chose this goal. Honor that choice! 🎯',
  'Hard days build strong habits. Push through! 💎',
  'The best time to start was yesterday. Second best? NOW! ⏰',
  'Every rep, every task — it compounds. Trust the process! 📈',
  'Locked in. Dialed in. Let\'s execute! 🔒',
  'Pain is temporary. Regret is forever. Move! 🦾',
  'Not motivated? Good. Discipline doesn\'t need motivation. 🧱',
  'The goal doesn\'t care how you feel today. Show up anyway! 🎯',
  'Identity is built in the moments you least want to try. 💥',
  'Outwork yesterday. Every. Single. Day. 🌅',
];

// ── Time-block reminder schedule ─────────────────────────────────────────────
const TIME_BLOCK_NOTIFS: { hour: number; min: number; block: TimeBlock; emoji: string; title: string; body: string }[] = [
  {
    hour: 6, min: 0, block: 'Morning', emoji: '🌅',
    title: '🌅 Morning Block — Rise & Dominate',
    body: 'Your Morning window is LIVE. Hydrate, move, and conquer the first block. Champions start before the world wakes up.'
  },
  {
    hour: 12, min: 0, block: 'Afternoon', emoji: '🔥',
    title: '🔥 Afternoon Block — Peak Performance',
    body: 'Midday is your power hour. Your Afternoon tasks are waiting. No excuses — lock in and execute.'
  },
  {
    hour: 17, min: 0, block: 'Evening', emoji: '💪',
    title: '💪 Evening Block — Move Your Body',
    body: 'Time to train, recover, and decompress. Your Evening block is live. Finish strong.'
  },
  {
    hour: 21, min: 0, block: 'Night', emoji: '🌙',
    title: '🌙 Night Protocol — Wind Down & Reflect',
    body: 'Check your Night tasks. Plan tomorrow. The last hour of your day shapes who you become next.'
  },
];

// ── Daily motivational quote blasts (3× per day) ─────────────────────────────
const DAILY_MOTIVATIONAL_SCHEDULE: { hour: number; min: number; title: string; body: string }[] = [
  {
    hour: 7, min: 0,
    title: '⚡ Morning Fuel — Day starts NOW',
    body: MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
  },
  {
    hour: 13, min: 0,
    title: '🔥 Midday Charge — Don\'t slow down',
    body: MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
  },
  {
    hour: 20, min: 0,
    title: '💎 Evening Reflection — Finish the day right',
    body: MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
  },
];

const RECURRENCE_OPTIONS: { type: RecurrenceType; label: string; short: string }[] = [
  { type: 'none',     label: 'None',     short: 'None' },
  { type: 'daily',    label: 'Daily',    short: '∞ Daily' },
  { type: 'weekdays', label: 'Weekdays', short: 'Mon–Fri' },
  { type: 'weekly',   label: 'Weekly',   short: 'Weekly' },
];

const DEFAULT_TASKS_SEED: SchedulerTask[] = [
  {
    id: 'seed-1', date: dateToday, timeBlock: 'Morning',
    title: 'Hydrate & Morning Stretch', scheduledTime: '06:30 AM',
    completed: false, type: 'standard', createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2', date: dateToday, timeBlock: 'Morning',
    title: 'Morning Rituals Group', scheduledTime: '07:30 AM',
    completed: false, type: 'group',
    subtasks: [
      { id: 'sub-1', title: '50 Pushups & Plank', completed: true },
      { id: 'sub-2', title: 'Cold Shower', completed: false },
      { id: 'sub-3', title: '10 min Meditation', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3', date: dateToday, timeBlock: 'Afternoon',
    title: 'Play Sports Choice', scheduledTime: '04:00 PM',
    completed: false, type: 'choice',
    options: ['Gym', 'Badminton', 'Basketball', 'Tennis', 'Running', 'Swimming'],
    selectedOption: 'Badminton',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-4', date: dateToday, timeBlock: 'Evening',
    title: 'Review today\'s goal block', scheduledTime: '06:30 PM',
    completed: false, type: 'standard', createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-5', date: dateToday, timeBlock: 'Night',
    title: 'Wind down & read 15 pages', scheduledTime: '10:00 PM',
    completed: false, type: 'standard', createdAt: new Date().toISOString(),
  },
];

const TIME_BLOCK_META: Record<TimeBlock, { label: string; timeRange: string; icon: React.ElementType; desc: string }> = {
  Morning:   { label: 'Morning',   timeRange: '06:00 AM – 12:00 PM', icon: Sun,      desc: 'Set the tone for the day' },
  Afternoon: { label: 'Afternoon', timeRange: '12:00 PM – 05:00 PM', icon: Sparkles, desc: 'Peak execution & output' },
  Evening:   { label: 'Evening',   timeRange: '05:00 PM – 09:00 PM', icon: Sunset,   desc: 'Movement & recovery' },
  Night:     { label: 'Night',     timeRange: '09:00 PM – 12:00 AM', icon: Moon,     desc: 'Wind down & reflect' },
};

const BLOCK_PROTEIN_TARGET_KEYS: Record<TimeBlock, 'morningProtein' | 'afternoonProtein' | 'eveningProtein' | 'nightProtein'> = {
  Morning:   'morningProtein',
  Afternoon: 'afternoonProtein',
  Evening:   'eveningProtein',
  Night:     'nightProtein',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const generateDateStrip = (centerDateStr: string) => {
  const dates: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean; isSelected: boolean }[] = [];
  const baseDate = new Date(centerDateStr + 'T00:00:00');
  for (let i = -3; i <= 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = formatDateString(d);
    dates.push({
      dateStr,
      dayName:   d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday:    dateStr === dateToday,
      isSelected: dateStr === centerDateStr,
    });
  }
  return dates;
};

const getCurrentTimeBlock = (): TimeBlock => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
};

const getNextTimeBlock = (block: TimeBlock): TimeBlock => {
  const order: TimeBlock[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
  return order[(order.indexOf(block) + 1) % order.length];
};

const readStoredNutritionTargets = (): NutritionTargets => {
  try {
    const raw = localStorage.getItem(LOCAL_NUTRITION_TARGETS_KEY) || localStorage.getItem(APP_NUTRITION_TARGETS_KEY);
    return raw ? { ...DEFAULT_NUTRITION_TARGETS, ...JSON.parse(raw) } : DEFAULT_NUTRITION_TARGETS;
  } catch {
    return DEFAULT_NUTRITION_TARGETS;
  }
};

const readStoredLoggedFoods = () => {
  try {
    const raw = localStorage.getItem(APP_LOGGED_FOODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const mergeTargets = (base: NutritionTargets, incoming?: NutritionTargets): NutritionTargets => {
  if (!incoming) return base;
  return {
    ...base, ...incoming,
    morningProtein:   incoming.morningProtein   ?? base.morningProtein,
    afternoonProtein: incoming.afternoonProtein ?? base.afternoonProtein,
    eveningProtein:   incoming.eveningProtein   ?? base.eveningProtein,
    nightProtein:     incoming.nightProtein     ?? base.nightProtein,
  };
};

/** Pure fn – returns new task instances that should be created for `forDate` */
const materializeRecurringTasks = (tasks: SchedulerTask[], forDate: string): SchedulerTask[] => {
  const templates = tasks.filter(t => t.isRecurrenceTemplate);
  if (templates.length === 0) return [];

  const newInstances: SchedulerTask[] = [];
  const dateObj = new Date(forDate + 'T00:00:00');
  const dow = dateObj.getDay(); // 0 = Sun

  for (const tpl of templates) {
    if (!tpl.recurrence || tpl.recurrence.type === 'none') continue;
    if (forDate < tpl.date) continue;
    if (tpl.deletedDates?.includes(forDate)) continue;

    const tplDateObj = new Date(tpl.date + 'T00:00:00');
    let shouldCreate = false;
    switch (tpl.recurrence.type) {
      case 'daily':    shouldCreate = true; break;
      case 'weekdays': shouldCreate = dow >= 1 && dow <= 5; break;
      case 'weekly':   shouldCreate = dateObj.getDay() === tplDateObj.getDay(); break;
    }
    if (!shouldCreate) continue;

    const exists = tasks.some(t => t.recurrenceTemplateId === tpl.id && t.date === forDate);
    if (exists) continue;

    newInstances.push({
      ...tpl,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      date: forDate,
      completed: false,
      selectedOption: undefined,
      subtasks: tpl.subtasks?.map(s => ({ ...s, completed: false })),
      createdAt: new Date().toISOString(),
      isRecurrenceTemplate: false,
      recurrenceTemplateId: tpl.id,
    });
  }
  return newInstances;
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface DailySchedulerProps {
  loggedFoods?: Array<{ id: string; name: string; protein: number; calories: number; mealType?: string; date?: string }>;
  nutritionTargets?: NutritionTargets;
  onUpdateNutritionTargets?: (targets: NutritionTargets) => void;
  onOpenLogFoodForBlock?: (block: 'Morning' | 'Afternoon' | 'Evening' | 'Night') => void;
  userPoints?: number;
  currentUser?: any;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DailyScheduler({
  loggedFoods = [],
  nutritionTargets,
  onUpdateNutritionTargets,
  onOpenLogFoodForBlock,
  userPoints,
  currentUser,
}: DailySchedulerProps = {}) {

  // ── Core state ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(dateToday);

  const [tasks, setTasks] = useState<SchedulerTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TASKS_SEED;
  });

  const [expandedBlocks, setExpandedBlocks] = useState<Record<TimeBlock, boolean>>({
    Morning: true, Afternoon: true, Evening: true, Night: true,
  });
  const [currentTimeBlock, setCurrentTimeBlock] = useState<TimeBlock>(() => getCurrentTimeBlock());
  const [visibleBlock, setVisibleBlock] = useState<TimeBlock>(() => getCurrentTimeBlock());
  const [manualBlockNavigation, setManualBlockNavigation] = useState(false);

  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({
    'seed-2': false, 'seed-3': false,
  });

  const [localNutritionTargets, setLocalNutritionTargets] = useState<NutritionTargets>(() =>
    mergeTargets(readStoredNutritionTargets(), nutritionTargets)
  );
  const [localLoggedFoods, setLocalLoggedFoods] = useState<DailySchedulerProps['loggedFoods']>(readStoredLoggedFoods);
  const [editingProteinGoal, setEditingProteinGoal] = useState<{ block: TimeBlock; value: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Inline task creator ───────────────────────────────────────────────────
  const [inlineTaskInput, setInlineTaskInput] = useState<{
    block: TimeBlock | null;
    text: string;
    scheduledTime: string;
    taskType: 'standard' | 'choice' | 'group';
    initialSubtasks: string[];
    customChoices: string[];
    newChoiceInput: string;
    recurrenceType: RecurrenceType;
    reminderTime: string;
  }>({
    block: null, text: '', scheduledTime: '',
    taskType: 'standard', initialSubtasks: [''],
    customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '',
    recurrenceType: 'none', reminderTime: '',
  });

  const [newSubtaskInput, setNewSubtaskInput] = useState<{ taskId: string | null; text: string }>({ taskId: null, text: '' });
  const [newChoiceTaskOptionInput, setNewChoiceTaskOptionInput] = useState<{ taskId: string | null; text: string }>({ taskId: null, text: '' });

  // ── Drag-and-drop state ───────────────────────────────────────────────────
  const [dragState, setDragState] = useState<{
    draggingId: string | null;
    dragOverId: string | null;
    dragOverBlock: TimeBlock | null;
  }>({ draggingId: null, dragOverId: null, dragOverBlock: null });

  // ── Notification state ────────────────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [notifBannerDismissed, setNotifBannerDismissed] = useState<boolean>(() =>
    localStorage.getItem(NOTIF_BANNER_KEY) === '1'
  );
  const notifTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const swRegRef       = useRef<ServiceWorkerRegistration | null>(null);
  const deferredPrompt = useRef<any>(null);
  const timeBlockViewportRef = useRef<HTMLDivElement | null>(null);
  const [pwaInstallable, setPwaInstallable] = useState(false);
  const [swReady, setSwReady]               = useState(false);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Persist tasks
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  // Sync nutrition targets from parent
  useEffect(() => {
    if (nutritionTargets) setLocalNutritionTargets(prev => mergeTargets(prev, nutritionTargets));
  }, [nutritionTargets]);

  // Keep today's scheduler focused on the live block as the clock changes.
  useEffect(() => {
    const syncBlockToClock = () => {
      const nextCurrentBlock = getCurrentTimeBlock();
      setCurrentTimeBlock(nextCurrentBlock);
      if (selectedDate === dateToday && !manualBlockNavigation) {
        setVisibleBlock(nextCurrentBlock);
        setExpandedBlocks(prev => ({ ...prev, [nextCurrentBlock]: true }));
      }
    };

    syncBlockToClock();
    const intervalId = window.setInterval(syncBlockToClock, 60_000);
    return () => window.clearInterval(intervalId);
  }, [manualBlockNavigation, selectedDate]);

  useEffect(() => {
    const nextVisibleBlock = selectedDate === dateToday ? getCurrentTimeBlock() : 'Morning';
    setManualBlockNavigation(false);
    setVisibleBlock(nextVisibleBlock);
    setExpandedBlocks(prev => ({ ...prev, [nextVisibleBlock]: true }));
  }, [selectedDate]);

  // Refresh food logs on window focus / storage event
  useEffect(() => {
    const refresh = () => setLocalLoggedFoods(readStoredLoggedFoods());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  // Register Service Worker for background notifications
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        swRegRef.current = reg;
        setSwReady(true);
      })
      .catch(err => console.warn('[FocusNow] SW registration failed:', err));

    // PWA install prompt
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setPwaInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  // Helper: post a message to the active SW
  const postToSW = useCallback((msg: object) => {
    const sw = swRegRef.current?.active;
    if (sw) sw.postMessage(msg);
  }, []);

  // Materialize recurring tasks whenever selectedDate changes (±7 day buffer)
  useEffect(() => {
    const datesToCheck: string[] = [];
    for (let i = -3; i <= 7; i++) {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + i);
      datesToCheck.push(formatDateString(d));
    }
    setTasks(prev => {
      const fresh: SchedulerTask[] = [];
      for (const date of datesToCheck) {
        fresh.push(...materializeRecurringTasks(prev, date));
      }
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh];
    });
  }, [selectedDate]);

  // Schedule daily time-block reminders + motivational quotes + Day Briefing via SW
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!swReady) return;

    const now = new Date();
    const batch: object[] = [];

    // ── Day Briefing (6 AM) — includes 90-day mission day ─────────────────
    (() => {
      const briefingFire = new Date();
      briefingFire.setHours(DAY_BRIEFING_HOUR, DAY_BRIEFING_MIN, 0, 0);
      const msUntil = briefingFire.getTime() - now.getTime();
      if (msUntil > 0) {
        // ── Calculate current 90-day mission day ──
        let missionDay = 1;
        const journeyStart = currentUser?.journey_start_date
          ? new Date(currentUser.journey_start_date)
          : null;
        if (journeyStart) {
          const diffDays = Math.floor((now.getTime() - journeyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          missionDay = Math.max(1, Math.min(90, diffDays));
        }
        const daysLeft = 90 - missionDay;

        // ── Phase-aware motivational opener ──
        const phaseMsg =
          missionDay <= 7   ? `First week warrior! Every habit you build now is compounding. Don't stop.` :
          missionDay <= 14  ? `Two weeks in — the identity shift is happening. Keep showing up!` :
          missionDay <= 30  ? `One month locked in. You're proving something to yourself every single day.` :
          missionDay <= 60  ? `Halfway warrior. Most people quit here. You're not most people.` :
          missionDay <= 80  ? `The final stretch. ${daysLeft} days left. This is where legends are made.` :
                              `FINAL 10 DAYS. You came this far — finish it. No surrender. 🏆`;

        // ── Task breakdown ──
        let morningCount = 0, afternoonCount = 0, eveningCount = 0, nightCount = 0, total = 0;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const allTasks: SchedulerTask[] = JSON.parse(raw);
            const todayTasks = allTasks.filter(t => !t.isRecurrenceTemplate && t.date === dateToday);
            total = todayTasks.length;
            morningCount   = todayTasks.filter(t => t.timeBlock === 'Morning').length;
            afternoonCount = todayTasks.filter(t => t.timeBlock === 'Afternoon').length;
            eveningCount   = todayTasks.filter(t => t.timeBlock === 'Evening').length;
            nightCount     = todayTasks.filter(t => t.timeBlock === 'Night').length;
          }
        } catch {}

        const blockLines: string[] = [];
        if (morningCount   > 0) blockLines.push(`🌅 Morning ×${morningCount}`);
        if (afternoonCount > 0) blockLines.push(`🔥 Afternoon ×${afternoonCount}`);
        if (eveningCount   > 0) blockLines.push(`💪 Evening ×${eveningCount}`);
        if (nightCount     > 0) blockLines.push(`🌙 Night ×${nightCount}`);

        const taskLine = total > 0
          ? `${blockLines.join('  ')} — ${total} tasks today.`
          : 'No tasks scheduled yet — plan your blocks for max output! 📅';

        batch.push({
          id: 'day-briefing',
          title: `🏆 Day ${missionDay} of 90 — ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
          body: `${phaseMsg}\n\n${taskLine}`,
          msUntil,
          requireInteraction: true,
        });
      }
    })();

    // ── Time-block reminders ───────────────────────────────────────────────
    TIME_BLOCK_NOTIFS.forEach(n => {
      const fireAt = new Date();
      fireAt.setHours(n.hour, n.min, 0, 0);
      const msUntil = fireAt.getTime() - now.getTime();
      if (msUntil <= 0) return;
      batch.push({
        id: `block-${n.block}`,
        title: n.title,
        body: n.body,
        msUntil,
        requireInteraction: true,
      });
    });

    // ── Motivational quote blasts ───────────────────────────────────────────
    DAILY_MOTIVATIONAL_SCHEDULE.forEach((n, i) => {
      const fireAt = new Date();
      fireAt.setHours(n.hour, n.min, 0, 0);
      const msUntil = fireAt.getTime() - now.getTime();
      if (msUntil <= 0) return;
      batch.push({
        id: `motivational-${i}`,
        title: n.title,
        body: MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
        msUntil,
      });
    });

    if (batch.length > 0) postToSW({ type: 'SCHEDULE_BATCH', payload: batch });
  }, [notifPermission, swReady, postToSW]);

  // Schedule task-specific reminders (prefer SW; fall back to setTimeout)
  useEffect(() => {
    // Clear old fallback timers
    notifTimersRef.current.forEach(t => clearTimeout(t));
    notifTimersRef.current.clear();

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const now = new Date();
    const taskBatch: object[] = [];

    tasks
      .filter(t => !t.isRecurrenceTemplate && t.date === dateToday && !t.completed && t.recurrence?.reminderTime)
      .forEach(task => {
        const [h, m] = (task.recurrence!.reminderTime!).split(':').map(Number);
        const fireAt = new Date();
        fireAt.setHours(h, m, 0, 0);
        const msUntil = fireAt.getTime() - now.getTime();
        if (msUntil <= 0) return;

        const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

        if (swReady && swRegRef.current?.active) {
          // Route through Service Worker (survives tab close)
          taskBatch.push({
            id: `task-${task.id}`,
            title: `⏰ Time for: ${task.title}`,
            body: msg,
            msUntil,
            requireInteraction: true,
          });
        } else {
          // Fallback: in-page setTimeout
          const timer = setTimeout(() => {
            try {
              new Notification(`⏰ Time for: ${task.title}`, { body: msg, icon: '/favicon.ico' });
            } catch {}
          }, msUntil);
          notifTimersRef.current.set(task.id, timer);
        }
      });

    if (taskBatch.length > 0) postToSW({ type: 'SCHEDULE_BATCH', payload: taskBatch });

    return () => { notifTimersRef.current.forEach(t => clearTimeout(t)); };
  }, [tasks, notifPermission, swReady, postToSW]);

  // ── Derived values ────────────────────────────────────────────────────────
  const activeNutritionTargets = mergeTargets(localNutritionTargets, nutritionTargets);
  const schedulerLoggedFoods   = loggedFoods.length > 0 ? loggedFoods : (localLoggedFoods || []);

  const tasksForSelectedDate = useMemo(
    () => tasks.filter(t => !t.isRecurrenceTemplate && t.date === selectedDate),
    [tasks, selectedDate]
  );

  const completionByDate = useMemo(() => {
    const result: Record<string, { done: number; total: number }> = {};
    tasks.filter(t => !t.isRecurrenceTemplate).forEach(t => {
      if (!result[t.date]) result[t.date] = { done: 0, total: 0 };
      result[t.date].total++;
      if (t.completed) result[t.date].done++;
    });
    return result;
  }, [tasks]);

  const datesStrip      = generateDateStrip(selectedDate);
  const timeBlocks: TimeBlock[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const visibleTimeBlocks: TimeBlock[] = [visibleBlock];
  const visibleBlockIndex = timeBlocks.indexOf(visibleBlock);
  const nextVisibleBlock = getNextTimeBlock(visibleBlock);

  const totalTasksCount     = tasksForSelectedDate.length;
  const completedTasksCount = tasksForSelectedDate.filter(t => t.completed).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const toggleExpandBlock = (block: TimeBlock) =>
    setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));

  const toggleExpandTask = (taskId: string) =>
    setExpandedTaskIds(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  const handleShowBlock = (block: TimeBlock, manual = true) => {
    setManualBlockNavigation(manual);
    setVisibleBlock(block);
    setExpandedBlocks(prev => ({ ...prev, [block]: true }));
    window.setTimeout(() => {
      timeBlockViewportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleShowNextBlock = () => handleShowBlock(getNextTimeBlock(visibleBlock));

  const handleShowCurrentTimeBlock = () => {
    if (selectedDate !== dateToday) setSelectedDate(dateToday);
    handleShowBlock(getCurrentTimeBlock(), false);
  };

  const startEditingProteinGoal = (block: TimeBlock, currentGoal: number) =>
    setEditingProteinGoal({ block, value: String(currentGoal) });

  const handleSaveProteinGoal = () => {
    if (!editingProteinGoal) return;
    const parsed  = Number.parseFloat(editingProteinGoal.value);
    const nextGoal = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
    const targetKey = BLOCK_PROTEIN_TARGET_KEYS[editingProteinGoal.block];
    const nextTargets = { ...activeNutritionTargets, [targetKey]: nextGoal };
    setLocalNutritionTargets(nextTargets);
    try {
      localStorage.setItem(LOCAL_NUTRITION_TARGETS_KEY, JSON.stringify(nextTargets));
      localStorage.setItem(APP_NUTRITION_TARGETS_KEY,   JSON.stringify(nextTargets));
    } catch {}
    onUpdateNutritionTargets?.(nextTargets);
    showToast(`${editingProteinGoal.block} protein goal → ${nextGoal}g`);
    setEditingProteinGoal(null);
  };

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const nextCompleted = !t.completed;
      return {
        ...t, completed: nextCompleted,
        subtasks: t.subtasks?.map(s => ({ ...s, completed: nextCompleted })),
      };
    }));
  };

  // Toggle subtask
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.subtasks) return t;
      const updated = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
      return { ...t, subtasks: updated, completed: updated.length > 0 && updated.every(st => st.completed) };
    }));
  };

  // Add subtask to group
  const handleAddSubtaskToGroup = (taskId: string) => {
    const text = newSubtaskInput.text.trim();
    if (!text) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newSub: SubTask = { id: 'sub_' + Math.random().toString(36).substring(2, 9), title: text, completed: false };
      return { ...t, subtasks: [...(t.subtasks || []), newSub], completed: false };
    }));
    setNewSubtaskInput({ taskId: null, text: '' });
  };

  // Add option to choice task
  const handleAddOptionToChoiceTask = (taskId: string) => {
    const text = newChoiceTaskOptionInput.text.trim();
    if (!text) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const existing = t.options || [];
      if (existing.includes(text)) return t;
      return { ...t, options: [...existing, text] };
    }));
    setNewChoiceTaskOptionInput({ taskId: null, text: '' });
  };

  // Delete subtask
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.subtasks) return t;
      const updated = t.subtasks.filter(s => s.id !== subtaskId);
      return { ...t, subtasks: updated, completed: updated.length > 0 && updated.every(st => st.completed) };
    }));
  };

  // Select sport / choice option
  const handleSelectOption = (taskId: string, option: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const isSame = t.selectedOption === option;
      return { ...t, selectedOption: isSame ? undefined : option, completed: !isSame };
    }));
  };

  // Add new task
  const handleAddTask = (block: TimeBlock) => {
    const title = inlineTaskInput.text.trim() ||
      (inlineTaskInput.taskType === 'group' ? 'New Group' : inlineTaskInput.taskType === 'choice' ? 'Sports Choice' : 'New Task');

    const subtasksList = inlineTaskInput.taskType === 'group'
      ? inlineTaskInput.initialSubtasks
          .filter(st => st.trim().length > 0)
          .map(st => ({ id: 'sub_' + Math.random().toString(36).substring(2, 9), title: st.trim(), completed: false }))
      : undefined;

    const recurrence = inlineTaskInput.recurrenceType !== 'none' ? {
      type: inlineTaskInput.recurrenceType,
      reminderTime: inlineTaskInput.reminderTime || undefined,
    } : undefined;

    const isTemplate = inlineTaskInput.recurrenceType !== 'none';

    // Build the task (or template)
    const baseTask: SchedulerTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      date: selectedDate,
      timeBlock: block,
      title,
      scheduledTime: inlineTaskInput.scheduledTime.trim() || undefined,
      completed: false,
      type: inlineTaskInput.taskType,
      options: inlineTaskInput.taskType === 'choice' ? [...inlineTaskInput.customChoices] : undefined,
      subtasks: subtasksList,
      createdAt: new Date().toISOString(),
      recurrence,
      isRecurrenceTemplate: isTemplate || undefined,
    };

    if (isTemplate) {
      // Add template + immediately materialize for today's viewing date
      setTasks(prev => {
        const withTemplate = [...prev, baseTask];
        const instances = materializeRecurringTasks(withTemplate, selectedDate);
        return [...withTemplate, ...instances];
      });
      showToast(`🔁 Recurring task added (${inlineTaskInput.recurrenceType})`);
    } else {
      setTasks(prev => [...prev, baseTask]);
      if (inlineTaskInput.taskType !== 'standard') setExpandedTaskIds(prev => ({ ...prev, [baseTask.id]: true }));
      showToast(`Added to ${block}`);
    }

    setInlineTaskInput({
      block: null, text: '', scheduledTime: '',
      taskType: 'standard', initialSubtasks: [''],
      customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '',
      recurrenceType: 'none', reminderTime: '',
    });
  };

  // Delete task (or entire series if template-linked)
  const handleDeleteTask = (taskId: string, deleteSeries = false) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      if (deleteSeries || (task.isRecurrenceTemplate && deleteSeries)) {
        const templateId = task.isRecurrenceTemplate ? task.id : task.recurrenceTemplateId;
        return prev.filter(t => t.id !== templateId && t.recurrenceTemplateId !== templateId);
      }

      if (task.recurrenceTemplateId) {
        return prev
          .filter(t => t.id !== taskId)
          .map(t => {
            if (t.id === task.recurrenceTemplateId) {
              const currentDeleted = t.deletedDates || [];
              if (!currentDeleted.includes(task.date)) {
                return { ...t, deletedDates: [...currentDeleted, task.date] };
              }
            }
            return t;
          });
      }

      return prev.filter(t => t.id !== taskId);
    });
    showToast(deleteSeries ? '🗑 Series deleted' : 'Task removed');
  };

  // Move task within / across blocks with arrow buttons
  const TIME_BLOCK_LIST: TimeBlock[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      const target = prev.find(t => t.id === taskId);
      if (!target) return prev;
      const sameBlock = prev.filter(t => t.date === target.date && t.timeBlock === target.timeBlock && !t.isRecurrenceTemplate);
      const idx = sameBlock.findIndex(t => t.id === taskId);

      if (direction === 'up') {
        if (idx > 0) {
          const swap = sameBlock[idx - 1];
          const arr = [...prev];
          const a = arr.findIndex(t => t.id === target.id);
          const b = arr.findIndex(t => t.id === swap.id);
          if (a !== -1 && b !== -1) { [arr[a], arr[b]] = [arr[b], arr[a]]; }
          return arr;
        } else {
          const ci = TIME_BLOCK_LIST.indexOf(target.timeBlock);
          if (ci <= 0) return prev;
          return prev.map(t => t.id === taskId ? { ...t, timeBlock: TIME_BLOCK_LIST[ci - 1] } : t);
        }
      } else {
        if (idx < sameBlock.length - 1) {
          const swap = sameBlock[idx + 1];
          const arr = [...prev];
          const a = arr.findIndex(t => t.id === target.id);
          const b = arr.findIndex(t => t.id === swap.id);
          if (a !== -1 && b !== -1) { [arr[a], arr[b]] = [arr[b], arr[a]]; }
          return arr;
        } else {
          const ci = TIME_BLOCK_LIST.indexOf(target.timeBlock);
          if (ci < 0 || ci >= TIME_BLOCK_LIST.length - 1) return prev;
          return prev.map(t => t.id === taskId ? { ...t, timeBlock: TIME_BLOCK_LIST[ci + 1] } : t);
        }
      }
    });
  };

  // Move subtask
  const handleMoveSubtask = (taskId: string, subtaskId: string, direction: 'up' | 'down') => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.subtasks) return t;
      const subs = [...t.subtasks];
      const idx = subs.findIndex(s => s.id === subtaskId);
      if (idx === -1) return t;
      if (direction === 'up' && idx <= 0) return t;
      if (direction === 'down' && idx >= subs.length - 1) return t;
      const ti = direction === 'up' ? idx - 1 : idx + 1;
      [subs[idx], subs[ti]] = [subs[ti], subs[idx]];
      return { ...t, subtasks: subs };
    }));
  };

  // Move initial subtask (while creating)
  const handleMoveInitialSubtask = (index: number, direction: 'up' | 'down') => {
    setInlineTaskInput(prev => {
      const updated = [...prev.initialSubtasks];
      if (direction === 'up' && index <= 0) return prev;
      if (direction === 'down' && index >= updated.length - 1) return prev;
      const ti = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[ti]] = [updated[ti], updated[index]];
      return { ...prev, initialSubtasks: updated };
    });
  };

  // Replicate to tomorrow
  const handleReplicateToTomorrow = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    const tomorrowStr = formatDateString(cur);
    const currentTasks = tasksForSelectedDate;
    if (currentTasks.length === 0) { showToast('No tasks to replicate'); return; }
    const newTasks: SchedulerTask[] = currentTasks.map(t => ({
      ...t, id: 'task_' + Math.random().toString(36).substring(2, 9),
      date: tomorrowStr, completed: false, selectedOption: undefined,
      subtasks: t.subtasks?.map(s => ({ ...s, completed: false })),
      createdAt: new Date().toISOString(),
      isRecurrenceTemplate: undefined, recurrenceTemplateId: undefined,
    }));
    setTasks(prev => {
      const others = prev.filter(t => t.date !== tomorrowStr || t.isRecurrenceTemplate);
      return [...others, ...newTasks];
    });
    setSelectedDate(tomorrowStr);
    showToast(`Replicated ${currentTasks.length} tasks to tomorrow!`);
  };

  // ── Drag-and-Drop Handlers ────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
    setDragState(prev => ({ ...prev, draggingId: taskId }));
  };

  const handleDragEnd = () => {
    setDragState({ draggingId: null, dragOverId: null, dragOverBlock: null });
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string, block: TimeBlock) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => ({ ...prev, dragOverId: taskId, dragOverBlock: block }));
  };

  const handleDragOverBlock = (e: React.DragEvent, block: TimeBlock) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => ({ ...prev, dragOverBlock: block }));
  };

  const handleDropOnTask = (e: React.DragEvent, dropOnTaskId: string, dropBlock: TimeBlock) => {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('taskId') || dragState.draggingId;
    if (!draggingId || draggingId === dropOnTaskId) {
      setDragState({ draggingId: null, dragOverId: null, dragOverBlock: null });
      return;
    }
    setTasks(prev => {
      const dragging = prev.find(t => t.id === draggingId);
      const dropOn   = prev.find(t => t.id === dropOnTaskId);
      if (!dragging || !dropOn) return prev;

      // Remove dragging task from list
      let newArr = prev.filter(t => t.id !== draggingId);
      // Update its block
      const updatedDragging = { ...dragging, timeBlock: dropBlock };
      // Find the drop position
      const dropIdx = newArr.findIndex(t => t.id === dropOnTaskId);
      newArr.splice(dropIdx, 0, updatedDragging);
      return newArr;
    });
    setDragState({ draggingId: null, dragOverId: null, dragOverBlock: null });
  };

  const handleDropOnBlock = (e: React.DragEvent, block: TimeBlock) => {
    e.preventDefault();
    const draggingId = e.dataTransfer.getData('taskId') || dragState.draggingId;
    if (!draggingId) { setDragState({ draggingId: null, dragOverId: null, dragOverBlock: null }); return; }
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, timeBlock: block } : t));
    setDragState({ draggingId: null, dragOverId: null, dragOverBlock: null });
  };

  // ── Notification handlers ─────────────────────────────────────────────────

  const handleRequestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') showToast('🔔 Reminders enabled! You\'re locked in.');
    else if (permission === 'denied') showToast('Notifications blocked. Enable in browser settings.');
  };

  const dismissNotifBanner = () => {
    setNotifBannerDismissed(true);
    localStorage.setItem(NOTIF_BANNER_KEY, '1');
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setPwaInstallable(false);
      showToast('🚀 App installed! Notifications will work even when closed.');
    }
    deferredPrompt.current = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const showNotifBanner =
    typeof Notification !== 'undefined' &&
    Notification.permission === 'default' &&
    !notifBannerDismissed;

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none pb-20 font-sans">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-neutral-700"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification Permission Banner ────────────────────────────────── */}
      <AnimatePresence>
        {showNotifBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-400/10 pointer-events-none rounded-2xl" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
              <Bell className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-900 leading-tight">Enable smart reminders 🔔</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Get block alerts at 6 AM, 12 PM, 5 PM, 9 PM + 3× daily motivation blasts.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestNotifPermission}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Enable
              </button>
              <button
                type="button"
                onClick={dismissNotifBanner}
                className="w-7 h-7 rounded-lg text-amber-600 hover:text-amber-900 hover:bg-amber-100 flex items-center justify-center transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PWA Install Banner ────────────────────────────────────────────── */}
      <AnimatePresence>
        {pwaInstallable && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 pointer-events-none rounded-2xl" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-base">📲</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-900 leading-tight">Install as App — Get Background Alerts</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Install Focus Now on your device so notifications fire even when the tab is closed.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallPWA}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => setPwaInstallable(false)}
                className="w-7 h-7 rounded-lg text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 flex items-center justify-center transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Lock-In Mode
              </span>
              {userPoints !== undefined && (
                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ⚡ {userPoints} Points
                </span>
              )}
              {selectedDate === dateToday && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Today
                </span>
              )}
              {notifPermission === 'granted' && (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Reminders On
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-1">Daily Scheduler</h1>
            <p className="text-xs text-neutral-500 font-medium">
              Time-anchored daily schedule · drag to reorder · recurring tasks
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {selectedDate !== dateToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(dateToday)}
                className="h-9 flex items-center gap-1.5 px-3 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleReplicateToTomorrow}
              title="Copy current schedule to tomorrow"
              className="h-9 flex items-center gap-2 px-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-300" />
              <span>Replicate to Tomorrow</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-black" />
              Select Date
            </span>
            <span className="text-xs font-bold text-black">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {datesStrip.map((item) => {
              const stats  = completionByDate[item.dateStr];
              const pct    = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : -1;
              const dotColor = pct >= 80 ? '#22c55e' : pct >= 30 ? '#f59e0b' : pct >= 0 ? '#9ca3af' : 'transparent';
              const tooltip  = stats && stats.total > 0
                ? `${item.dayName} ${item.dayNumber} — ${stats.done}/${stats.total} done (${pct}%)`
                : `${item.dayName} ${item.dayNumber} — No tasks`;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  title={tooltip}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-xl border transition-all cursor-pointer ${
                    item.isSelected
                      ? 'bg-black text-white border-black shadow-md scale-105'
                      : item.isToday
                      ? 'bg-neutral-100 text-black border-neutral-300 font-bold'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <span className={`text-[9px] font-bold tracking-wider uppercase ${item.isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {item.dayName}
                  </span>
                  <span className={`text-sm font-black mt-0.5 ${item.isSelected ? 'text-white' : 'text-black'}`}>
                    {item.dayNumber}
                  </span>

                  {pct >= 0 ? (
                    <span
                      className="w-3.5 h-0.5 rounded-full mt-1 transition-all duration-300"
                      style={{ backgroundColor: item.isSelected ? 'rgba(255,255,255,0.6)' : dotColor }}
                    />
                  ) : item.isToday && !item.isSelected ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-black mt-1" />
                  ) : (
                    <span className="w-3.5 h-0.5 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-4 mt-1 pl-1">
            <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
              <span className="w-3 h-0.5 rounded-full bg-green-400 inline-block" /> ≥80%
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
              <span className="w-3 h-0.5 rounded-full bg-amber-400 inline-block" /> 30–79%
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
              <span className="w-3 h-0.5 rounded-full bg-neutral-300 inline-block" /> &lt;30%
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Viewing Block</span>
                {selectedDate === dateToday && visibleBlock === currentTimeBlock && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-full">Live Now</span>
                )}
                {selectedDate === dateToday && visibleBlock !== currentTimeBlock && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">Peek Ahead</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 min-w-0">
                <span className="text-lg font-black text-black truncate">{visibleBlock}</span>
                <span className="text-xs font-bold text-neutral-400">{visibleBlockIndex + 1}/4</span>
                <span className="text-xs font-semibold text-neutral-500 truncate">{TIME_BLOCK_META[visibleBlock].timeRange}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShowCurrentTimeBlock}
                disabled={selectedDate === dateToday && visibleBlock === currentTimeBlock}
                title="Jump to the current time block"
                className="h-9 px-3 rounded-xl border border-neutral-300 bg-white text-black hover:border-black disabled:opacity-40 disabled:hover:border-neutral-300 text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:cursor-default"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Now</span>
              </button>
              <button
                type="button"
                onClick={handleShowNextBlock}
                title={`Show ${nextVisibleBlock}`}
                className="h-9 px-3 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 stroke-[3]" />
                <span>{nextVisibleBlock}</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-black shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              <span>{completedTasksCount}/{totalTasksCount}</span>
            </div>
            <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden border border-neutral-200">
              <div
                className="bg-black h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-black w-8 text-right">{completionPercentage}%</span>
          </div>
        </div>
      </div>
      {/* ── Time Block Sections ────────────────────────────────────────────────── */}
      <div ref={timeBlockViewportRef} className="space-y-4 scroll-mt-6">
        {visibleTimeBlocks.map(block => {
          const meta           = TIME_BLOCK_META[block];
          const BlockIcon      = meta.icon;
          const blockTasks     = tasksForSelectedDate.filter(t => t.timeBlock === block);
          const isExpanded     = expandedBlocks[block];
          const completedCount = blockTasks.filter(t => t.completed).length;
          const timePresets    = BLOCK_TIME_PRESETS[block];
          const isCurrent      = selectedDate === dateToday && block === getCurrentTimeBlock();
          const isAllDone      = blockTasks.length > 0 && completedCount === blockTasks.length;
          const isDragTarget   = dragState.draggingId !== null && dragState.dragOverBlock === block;

          return (
            <div
              key={block}
              onDragOver={e => handleDragOverBlock(e, block)}
              onDrop={e => handleDropOnBlock(e, block)}
              className={`bg-white border rounded-3xl overflow-hidden transition-all ${
                isDragTarget
                  ? 'border-black ring-2 ring-black/20 shadow-lg'
                  : isCurrent
                  ? 'border-black ring-1 ring-black/10 shadow-sm'
                  : isAllDone
                  ? 'border-neutral-300 bg-neutral-50/40'
                  : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
              }`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleExpandBlock(block)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/80 transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent ? 'bg-black text-white ring-2 ring-neutral-300' : 'bg-white text-black border border-neutral-300'
                  }`}>
                    <BlockIcon className="w-4.5 h-4.5 stroke-[2px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black tracking-tight text-black">{meta.label}</h2>
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                        {meta.timeRange}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Protein pill (today only) */}
                  {selectedDate === dateToday && (() => {
                    const todayFoods = schedulerLoggedFoods.filter(f => !f.date || f.date === dateToday);
                    const blockP     = todayFoods.reduce((s, f) => f.mealType === block ? s + (f.protein || 0) : s, 0);
                    const blockGoal  = getBlockProteinGoal(block, activeNutritionTargets);
                    const pct        = Math.min(100, blockGoal > 0 ? Math.round((blockP / blockGoal) * 100) : 0);
                    return (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); startEditingProteinGoal(block, blockGoal); }}
                        disabled={!onUpdateNutritionTargets}
                        className="hidden sm:flex flex-col items-end gap-1 min-w-28 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-left hover:border-black transition"
                        title={`Edit ${meta.label} protein goal`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Protein</span>
                        <span className="text-xs font-black text-black">{blockP}g / {blockGoal}g</span>
                        <span className="h-1 w-full rounded-full bg-neutral-100 overflow-hidden">
                          <span className="block h-full rounded-full bg-black transition-all duration-500" style={{ width: `${pct}%` }} />
                        </span>
                      </button>
                    );
                  })()}

                  {/* Completed counter */}
                  {isAllDone ? (
                    <span className="text-xs font-black text-white bg-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>{completedCount}/{blockTasks.length}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">
                      {completedCount}/{blockTasks.length}
                    </span>
                  )}

                  {/* Food log button */}
                  {selectedDate === dateToday && onOpenLogFoodForBlock && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onOpenLogFoodForBlock(block); }}
                      title={`Log food to ${meta.label}`}
                      className="w-8 h-8 rounded-xl bg-white text-black border border-neutral-300 flex items-center justify-center hover:border-black active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" />
                    </button>
                  )}

                  {/* Add task button */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (!isExpanded) setExpandedBlocks(prev => ({ ...prev, [block]: true }));
                      setInlineTaskInput(prev =>
                        prev.block === block
                          ? { block: null, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '', recurrenceType: 'none', reminderTime: '' }
                          : { block, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '', recurrenceType: 'none', reminderTime: '' }
                      );
                    }}
                    title="Add task to this section"
                    className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-xs cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 stroke-[2.5px]" />
                  </button>

                  {/* Expand/Collapse */}
                  <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Accordion Body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="border-t border-neutral-100 bg-white"
                  >
                    <div className="p-4 space-y-2.5">

                      {/* Protein strip (today) */}
                      {selectedDate === dateToday && (() => {
                        const todayFoods = schedulerLoggedFoods.filter(f => !f.date || f.date === dateToday);
                        const blockP     = todayFoods.reduce((s, f) => f.mealType === block ? s + (f.protein || 0) : s, 0);
                        const blockGoal  = getBlockProteinGoal(block, activeNutritionTargets);
                        const pct        = Math.min(100, blockGoal > 0 ? Math.round((blockP / blockGoal) * 100) : 0);
                        const isEditing  = editingProteinGoal?.block === block;

                        return (
                          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-xs mb-1">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg border border-neutral-300 bg-neutral-50 text-black flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black">P</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-wide text-black">Protein Goal</div>
                                    <div className="text-[10px] font-bold text-neutral-500">{blockP}g logged in {meta.label}</div>
                                  </div>
                                  {isEditing ? (
                                    <form onSubmit={e => { e.preventDefault(); handleSaveProteinGoal(); }} className="flex items-center gap-1.5 shrink-0">
                                      <input
                                        type="number" min="0" value={editingProteinGoal.value}
                                        onChange={e => setEditingProteinGoal({ block, value: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Escape') setEditingProteinGoal(null); }}
                                        className="w-14 h-7 rounded-lg border border-black bg-white px-2 text-xs font-black text-black text-center focus:outline-none"
                                        autoFocus
                                      />
                                      <button type="submit" className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center cursor-pointer active:scale-95" title="Save">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </button>
                                      <button type="button" onClick={() => setEditingProteinGoal(null)} className="w-7 h-7 rounded-lg border border-neutral-300 text-neutral-500 hover:text-black flex items-center justify-center cursor-pointer active:scale-95" title="Cancel">
                                        <X className="w-3.5 h-3.5 stroke-[3]" />
                                      </button>
                                    </form>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startEditingProteinGoal(block, blockGoal)}
                                      disabled={!onUpdateNutritionTargets}
                                      className="h-7 rounded-lg border border-neutral-300 bg-white hover:border-black px-2 flex items-center gap-1.5 text-[10px] font-black text-black transition cursor-pointer shrink-0"
                                    >
                                      <span>{blockGoal}g</span>
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="w-8 text-right text-[10px] font-black text-black">{pct}%</span>
                                </div>
                              </div>
                              {onOpenLogFoodForBlock && (
                                <button
                                  type="button"
                                  onClick={() => onOpenLogFoodForBlock(block)}
                                  className="shrink-0 w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── Inline Task Creator ─────────────────────────────────────── */}
                      {inlineTaskInput.block === block && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-neutral-50 border border-black rounded-2xl p-3.5 space-y-3 shadow-md"
                        >
                          {/* Task Type */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 flex-wrap gap-2">
                            <span className="text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider">Type:</span>
                            <div className="flex items-center gap-1.5">
                              {(['standard', 'group', 'choice'] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setInlineTaskInput(prev => ({
                                    ...prev, taskType: type,
                                    text: type === 'group' ? (prev.text || 'Morning Rituals') : type === 'choice' ? (prev.text || 'Play Sports') : prev.text,
                                  }))}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                    inlineTaskInput.taskType === type ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200 hover:border-black'
                                  }`}
                                >
                                  {type === 'group' && <ListTree className="w-3.5 h-3.5 opacity-60" />}
                                  {type === 'choice' && <Dumbbell className="w-3.5 h-3.5 opacity-60" />}
                                  {type === 'standard' ? 'Standard' : type === 'group' ? 'Group' : 'Sports/Choice'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3 text-black" /> Time:
                            </span>
                            <button
                              type="button"
                              onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: '' }))}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${!inlineTaskInput.scheduledTime.trim() ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'}`}
                            >
                              No Time
                            </button>
                            {timePresets.map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: prev.scheduledTime === preset ? '' : preset }))}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${inlineTaskInput.scheduledTime === preset ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'}`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {/* ── Recurrence Row ──────────────────────────────────────────── */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-neutral-200">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                              <Repeat2 className="w-3 h-3 text-black" /> Repeat:
                            </span>
                            {RECURRENCE_OPTIONS.map(opt => (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() => setInlineTaskInput(prev => ({ ...prev, recurrenceType: opt.type }))}
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                  inlineTaskInput.recurrenceType === opt.type ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                                }`}
                              >
                                {opt.type !== 'none' && <Repeat2 className="w-2.5 h-2.5 opacity-70" />}
                                {opt.short}
                              </button>
                            ))}
                          </div>

                          {/* Reminder time (only if recurring) */}
                          {inlineTaskInput.recurrenceType !== 'none' && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                              <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Reminder:</span>
                              <input
                                type="time"
                                value={inlineTaskInput.reminderTime}
                                onChange={e => setInlineTaskInput(prev => ({ ...prev, reminderTime: e.target.value }))}
                                className="flex-1 bg-transparent text-xs font-bold text-amber-900 focus:outline-none"
                              />
                              {inlineTaskInput.reminderTime && (
                                <button
                                  type="button"
                                  onClick={() => setInlineTaskInput(prev => ({ ...prev, reminderTime: '' }))}
                                  className="text-amber-500 hover:text-amber-800 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              {notifPermission !== 'granted' && (
                                <span className="text-[9px] text-amber-600 font-bold">Enable notifs first ↑</span>
                              )}
                            </div>
                          )}

                          {/* Task Name & Time Input */}
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder={
                                inlineTaskInput.taskType === 'group' ? 'Group Name...' :
                                inlineTaskInput.taskType === 'choice' ? 'Choice Title...' :
                                'Task title...'
                              }
                              value={inlineTaskInput.text}
                              onChange={e => setInlineTaskInput(prev => ({ ...prev, text: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(block); }}
                              className="flex-1 bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none focus:border-black w-full"
                            />
                            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 shrink-0 w-full sm:w-auto">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <input
                                type="text"
                                placeholder="Time (Optional)"
                                value={inlineTaskInput.scheduledTime}
                                onChange={e => setInlineTaskInput(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                className="w-28 bg-transparent text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none"
                              />
                              {inlineTaskInput.scheduledTime && (
                                <button type="button" onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: '' }))} className="text-neutral-400 hover:text-black p-0.5 cursor-pointer">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddTask(block)}
                              className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow-xs cursor-pointer shrink-0 w-full sm:w-auto"
                            >
                              {inlineTaskInput.recurrenceType !== 'none' ? '+ Recurring' : 'Add'}
                            </button>
                          </div>

                          {/* Choice options config */}
                          {inlineTaskInput.taskType === 'choice' && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Choice Options:</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {inlineTaskInput.customChoices.map(opt => (
                                  <span key={opt} className="bg-neutral-100 border border-neutral-300 text-black text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <span>{SPORTS_ICONS_MAP[opt] || '🏆'} {opt}</span>
                                    <button type="button" onClick={() => setInlineTaskInput(prev => ({ ...prev, customChoices: prev.customChoices.filter(o => o !== opt) }))} className="text-neutral-400 hover:text-red-500 cursor-pointer p-0.5">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text" placeholder="Add custom option..."
                                  value={inlineTaskInput.newChoiceInput}
                                  onChange={e => setInlineTaskInput(prev => ({ ...prev, newChoiceInput: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && inlineTaskInput.newChoiceInput.trim()) {
                                      e.preventDefault();
                                      const val = inlineTaskInput.newChoiceInput.trim();
                                      if (!inlineTaskInput.customChoices.includes(val))
                                        setInlineTaskInput(prev => ({ ...prev, customChoices: [...prev.customChoices, val], newChoiceInput: '' }));
                                    }
                                  }}
                                  className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = inlineTaskInput.newChoiceInput.trim();
                                    if (val && !inlineTaskInput.customChoices.includes(val))
                                      setInlineTaskInput(prev => ({ ...prev, customChoices: [...prev.customChoices, val], newChoiceInput: '' }));
                                  }}
                                  className="bg-black text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer hover:bg-neutral-800"
                                >
                                  + Option
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Group subtasks config */}
                          {inlineTaskInput.taskType === 'group' && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Sub-tasks:</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {inlineTaskInput.initialSubtasks.map((stText, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-0.5 shadow-2xs">
                                    <input
                                      type="text"
                                      placeholder={`Sub-task ${idx + 1}...`}
                                      value={stText}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setInlineTaskInput(prev => {
                                          const updated = [...prev.initialSubtasks];
                                          updated[idx] = val;
                                          return { ...prev, initialSubtasks: updated };
                                        });
                                      }}
                                      className="w-28 bg-transparent text-xs text-black placeholder:text-neutral-400 focus:outline-none font-bold"
                                    />
                                    <div className="flex items-center gap-0 border-l border-neutral-200 pl-1">
                                      <button type="button" disabled={idx === 0} onClick={() => handleMoveInitialSubtask(idx, 'up')} className="text-neutral-500 hover:text-black disabled:opacity-20 p-0.5 active:scale-90 transition-all cursor-pointer touch-manipulation">
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" disabled={idx === inlineTaskInput.initialSubtasks.length - 1} onClick={() => handleMoveInitialSubtask(idx, 'down')} className="text-neutral-500 hover:text-black disabled:opacity-20 p-0.5 active:scale-90 transition-all cursor-pointer touch-manipulation">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {inlineTaskInput.initialSubtasks.length > 1 && (
                                      <button type="button" onClick={() => setInlineTaskInput(prev => ({ ...prev, initialSubtasks: prev.initialSubtasks.filter((_, i) => i !== idx) }))} className="text-neutral-400 hover:text-red-500 p-0.5 cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button type="button" onClick={() => setInlineTaskInput(prev => ({ ...prev, initialSubtasks: [...prev.initialSubtasks, ''] }))} className="text-xs font-bold text-black bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 px-2 py-0.5 rounded-lg transition cursor-pointer">
                                  + Sub-task
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* ── Task List ───────────────────────────────────────────────── */}
                      {blockTasks.length === 0 ? (
                        <div
                          className={`text-center py-5 border border-dashed rounded-2xl transition-colors ${isDragTarget ? 'border-black bg-neutral-50' : 'border-neutral-200 bg-neutral-50/50'}`}
                          onDragOver={e => handleDragOverBlock(e, block)}
                          onDrop={e => handleDropOnBlock(e, block)}
                        >
                          <p className="text-xs font-medium text-neutral-400">
                            {isDragTarget ? 'Drop task here →' : `No tasks scheduled for ${meta.label.toLowerCase()}.`}
                          </p>
                          {!isDragTarget && (
                            <button
                              type="button"
                              onClick={() => setInlineTaskInput({ block, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '', recurrenceType: 'none', reminderTime: '' })}
                              className="mt-1.5 text-xs font-bold text-black underline underline-offset-4 hover:opacity-75 cursor-pointer"
                            >
                              + Add a task
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {blockTasks.map((task) => {
                            const isExpandable     = task.type === 'group' || task.type === 'choice';
                            const isTaskExpanded   = expandedTaskIds[task.id];
                            const subtasks         = task.subtasks || [];
                            const completedSubsCount = subtasks.filter(s => s.completed).length;
                            const isDragging       = dragState.draggingId === task.id;
                            const isDraggedOver    = dragState.dragOverId === task.id;
                            const isRecurring      = !!task.recurrenceTemplateId || task.isRecurrenceTemplate;

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={e => handleDragStart(e, task.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={e => handleDragOverTask(e, task.id, block)}
                                onDrop={e => handleDropOnTask(e, task.id, block)}
                                className={`group relative rounded-xl border transition-all duration-150 overflow-hidden ${
                                  isDragging
                                    ? 'opacity-40 scale-[0.98] border-black shadow-none'
                                    : isDraggedOver
                                    ? 'border-black ring-2 ring-black/20 shadow-md -translate-y-0.5'
                                    : task.completed
                                    ? 'bg-neutral-50/80 border-neutral-200'
                                    : 'bg-white border-neutral-200 hover:border-black/30 shadow-xs'
                                }`}
                              >
                                {/* Drag insertion indicator */}
                                {isDraggedOver && (
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-black rounded-full" />
                                )}

                                {/* Task Row */}
                                <div
                                  onClick={() => { if (isExpandable) toggleExpandTask(task.id); }}
                                  className={`px-3 py-2.5 flex items-center justify-between gap-2.5 select-none ${isExpandable ? 'cursor-pointer hover:bg-neutral-50/60' : ''}`}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 cursor-grab active:cursor-grabbing touch-manipulation"
                                    title="Drag to reorder"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <GripVertical className="w-4 h-4 text-neutral-400" />
                                  </div>

                                  {/* Left: Chevron + Time + Title */}
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {isExpandable && (
                                      <span className="w-5 h-5 rounded bg-neutral-100 text-black flex items-center justify-center shrink-0">
                                        {isTaskExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </span>
                                    )}

                                    {task.scheduledTime && (
                                      <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 shadow-2xs">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        {task.scheduledTime}
                                      </span>
                                    )}

                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      {task.type === 'group' && <span className="text-xs shrink-0">📁</span>}
                                      {task.type === 'choice' && (
                                        <span className="text-xs shrink-0">
                                          {task.selectedOption ? (SPORTS_ICONS_MAP[task.selectedOption] || '🏸') : '🏆'}
                                        </span>
                                      )}

                                      <span
                                        title={task.title}
                                        className={`text-xs sm:text-sm font-bold tracking-tight min-w-0 truncate ${task.completed ? 'line-through text-neutral-400 opacity-60' : 'text-neutral-900'}`}
                                      >
                                        {task.title}
                                      </span>

                                      {task.type === 'group' && (
                                        <span className="text-[10px] font-extrabold text-black bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded shrink-0">
                                          ({completedSubsCount}/{subtasks.length})
                                        </span>
                                      )}

                                      {task.type === 'choice' && task.selectedOption && (
                                        <span className="text-[10px] font-extrabold text-black bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded shrink-0">
                                          • {task.selectedOption}
                                        </span>
                                      )}

                                      {/* Recurring badge */}
                                      {isRecurring && (
                                        <span
                                          className="text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 cursor-pointer hover:bg-amber-200 transition"
                                          title="Recurring task – click to delete series"
                                          onClick={e => {
                                            e.stopPropagation();
                                            if (window.confirm('Delete this entire recurring series?')) handleDeleteTask(task.id, true);
                                          }}
                                        >
                                          <Repeat2 className="w-2.5 h-2.5" />
                                          {task.recurrence?.type || 'Recurring'}
                                        </span>
                                      )}

                                      {/* Reminder badge */}
                                      {task.recurrence?.reminderTime && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                          <Bell className="w-2.5 h-2.5" />
                                          {task.recurrence.reminderTime}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: quick select, arrows, delete, checkbox */}
                                  <div className="flex items-center gap-1.5 shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
                                    {task.type === 'choice' && !task.selectedOption && (
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandTask(task.id)}
                                        className="text-[10px] font-extrabold text-black bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 px-2 py-0.5 rounded-md transition cursor-pointer shrink-0"
                                      >
                                        Select Sport ▾
                                      </button>
                                    )}

                                    {/* Arrow reorder buttons */}
                                    <div className="opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0 bg-neutral-100/80 border border-neutral-200/80 rounded-lg p-0.5 shrink-0">
                                      <button type="button" onClick={() => handleMoveTask(task.id, 'up')} className="text-neutral-500 hover:text-black active:scale-90 active:bg-neutral-200 p-0.5 rounded-md hover:bg-neutral-200 transition-all cursor-pointer touch-manipulation" title="Move up">
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={() => handleMoveTask(task.id, 'down')} className="text-neutral-500 hover:text-black active:scale-90 active:bg-neutral-200 p-0.5 rounded-md hover:bg-neutral-200 transition-all cursor-pointer touch-manipulation" title="Move down">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(task.id, false)}
                                      className="text-neutral-300 hover:text-red-500 p-1 sm:p-0.5 hover:bg-neutral-100 rounded transition cursor-pointer touch-manipulation"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div
                                      onClick={() => handleToggleTask(task.id)}
                                      className={`w-5.5 h-5.5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                                        task.completed ? 'bg-black border-black text-white scale-105 shadow-2xs' : 'border-neutral-300 bg-white hover:border-black'
                                      }`}
                                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                    </div>
                                  </div>
                                </div>

                                {/* Group progress bar */}
                                {task.type === 'group' && subtasks.length > 0 && (
                                  <div className="w-full bg-neutral-100 h-0.5 overflow-hidden">
                                    <div className="bg-black h-full transition-all duration-300" style={{ width: `${Math.round((completedSubsCount / subtasks.length) * 100)}%` }} />
                                  </div>
                                )}

                                {/* Expandable body */}
                                <AnimatePresence>
                                  {isExpandable && isTaskExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                                      className="border-t border-neutral-100 bg-neutral-50/70 p-3 space-y-2.5"
                                    >
                                      {/* Group Sub-tasks */}
                                      {task.type === 'group' && (
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">
                                              Sub-tasks ({completedSubsCount}/{subtasks.length} done):
                                            </span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {subtasks.map((st, sIdx) => (
                                              <div
                                                key={st.id}
                                                onClick={() => handleToggleSubtask(task.id, st.id)}
                                                className="group/sub flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 hover:border-black/40 transition cursor-pointer"
                                              >
                                                <span className={`text-xs font-bold ${st.completed ? 'line-through text-neutral-400 opacity-60' : 'text-black'}`}>
                                                  {st.title}
                                                </span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <div className="opacity-80 sm:opacity-0 group-hover/sub:opacity-100 flex items-center gap-0 bg-neutral-100/80 border border-neutral-200/80 rounded-md p-0.5 transition-opacity shrink-0">
                                                    <button type="button" disabled={sIdx === 0} onClick={e => { e.stopPropagation(); handleMoveSubtask(task.id, st.id, 'up'); }} className="text-neutral-500 hover:text-black disabled:opacity-20 p-0.5 cursor-pointer rounded hover:bg-neutral-200 active:scale-90 transition-all touch-manipulation" title="Move Up">
                                                      <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button type="button" disabled={sIdx === subtasks.length - 1} onClick={e => { e.stopPropagation(); handleMoveSubtask(task.id, st.id, 'down'); }} className="text-neutral-500 hover:text-black disabled:opacity-20 p-0.5 cursor-pointer rounded hover:bg-neutral-200 active:scale-90 transition-all touch-manipulation" title="Move Down">
                                                      <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                  <button type="button" onClick={e => { e.stopPropagation(); handleDeleteSubtask(task.id, st.id); }} className="text-neutral-300 hover:text-red-500 p-0.5 hover:bg-neutral-100 rounded transition cursor-pointer" title="Delete subtask">
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${st.completed ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'}`}>
                                                    {st.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {newSubtaskInput.taskId === task.id ? (
                                            <div className="flex items-center gap-2 pt-1">
                                              <input
                                                type="text" autoFocus placeholder="New sub-task..."
                                                value={newSubtaskInput.text}
                                                onChange={e => setNewSubtaskInput({ taskId: task.id, text: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') handleAddSubtaskToGroup(task.id); if (e.key === 'Escape') setNewSubtaskInput({ taskId: null, text: '' }); }}
                                                className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:outline-none focus:border-black"
                                              />
                                              <button type="button" onClick={() => handleAddSubtaskToGroup(task.id)} className="bg-black text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer">Add</button>
                                            </div>
                                          ) : (
                                            <button type="button" onClick={() => setNewSubtaskInput({ taskId: task.id, text: '' })} className="text-[11px] font-bold text-black hover:opacity-75 underline underline-offset-4 cursor-pointer block pt-0.5">
                                              + Add sub-task
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* Choice Selector */}
                                      {task.type === 'choice' && (
                                        <div className="space-y-2">
                                          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">Select Option:</span>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {(task.options || DEFAULT_SPORTS_OPTIONS).map(opt => {
                                              const isSelected = task.selectedOption === opt;
                                              return (
                                                <button
                                                  key={opt} type="button"
                                                  onClick={() => handleSelectOption(task.id, opt)}
                                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${isSelected ? 'bg-black text-white border-black shadow-2xs' : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:bg-neutral-50'}`}
                                                >
                                                  <span>{SPORTS_ICONS_MAP[opt] || '🏆'}</span>
                                                  <span>{opt}</span>
                                                  {isSelected && <Check className="w-3 h-3 stroke-[3px] ml-0.5 text-white" />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {newChoiceTaskOptionInput.taskId === task.id ? (
                                            <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                                              <input
                                                type="text" autoFocus placeholder="New option..."
                                                value={newChoiceTaskOptionInput.text}
                                                onChange={e => setNewChoiceTaskOptionInput({ taskId: task.id, text: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') handleAddOptionToChoiceTask(task.id); if (e.key === 'Escape') setNewChoiceTaskOptionInput({ taskId: null, text: '' }); }}
                                                className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:outline-none focus:border-black"
                                              />
                                              <button type="button" onClick={() => handleAddOptionToChoiceTask(task.id)} className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer">Add</button>
                                            </div>
                                          ) : (
                                            <button type="button" onClick={() => setNewChoiceTaskOptionInput({ taskId: task.id, text: '' })} className="text-[11px] font-bold text-black hover:opacity-75 underline underline-offset-4 cursor-pointer block pt-0.5">
                                              + Add custom option
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
