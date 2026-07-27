import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Apple,
  Briefcase,
  Moon,
  Brain,
  Check,
  Plus,
  Target,
  Flame,
  NotebookPen,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Zap,
  Trophy,
  TrendingUp,
  Star,
  Play,
  Pause,
  RotateCcw,
  Activity,
  BarChart2,
  BookOpen,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Habit, Routine, PillarGoal, PillarNote } from '../types';
import {
  PILLAR_META,
  PILLAR_NAMES,
  mapCategoryToPillar,
  getRoutinePillar,
  getPillarProgress,
} from '../lib/pillars';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PillarsScreenProps {
  habits: Habit[];
  routines: Routine[];
  pillarGoals: PillarGoal[];
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onBatchLogHabits?: (updates: { id: string; value: number }[]) => Promise<void>;
  onOpenCreateModal?: () => void;
}

type PillarTab = 'habits' | 'routines' | 'goals' | 'notes' | 'stats';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PILLAR_ICONS: Record<Category, React.ElementType> = {
  Fitness: Dumbbell,
  Nutrition: Apple,
  Career: Briefcase,
  Recovery: Moon,
  Mind: Brain,
};

const NOTE_TYPES = ['Quick Note', 'PR / Record', 'Weekly Reflection'] as const;
type NoteType = typeof NOTE_TYPES[number];

const NOTE_TYPE_ICONS: Record<NoteType, React.ElementType> = {
  'Quick Note': NotebookPen,
  'PR / Record': Trophy,
  'Weekly Reflection': BookOpen,
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getLast30Days(dateToday: string): string[] {
  const dates: string[] = [];
  const d = new Date(dateToday);
  for (let i = 29; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

// ─── Focus Timer (for Career pillar) ─────────────────────────────────────────

function FocusTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const pct = ((25 * 60 - seconds) / (25 * 60)) * 100;

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-blue-500/20 flex flex-col items-center gap-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Focus Timer</p>
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="34" strokeWidth="5" fill="transparent" className="stroke-slate-800" />
          <circle
            cx="40" cy="40" r="34" strokeWidth="5" fill="transparent"
            stroke="#3B82F6"
            strokeDasharray={2 * Math.PI * 34}
            strokeDashoffset={2 * Math.PI * 34 * (1 - pct / 100)}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white font-mono">
          {mins}:{secs}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition cursor-pointer"
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => { setSeconds(25 * 60); setRunning(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Habit Card (quick-log) ───────────────────────────────────────────────────

function HabitCard({
  habit,
  dateToday,
  onLogHabit,
  accentColor,
}: {
  key?: React.Key;
  habit: Habit;
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  accentColor: string;
}) {
  const val = habit.history[dateToday] || 0;
  const isCompleted = val >= habit.target;
  const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;

  const handleTap = async () => {
    if (isCompleted) {
      await onLogHabit(habit.id, -val);
    } else {
      await onLogHabit(habit.id, habit.target - val);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
        isCompleted
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
      }`}
      onClick={handleTap}
    >
      <button
        onClick={(e) => { e.stopPropagation(); handleTap(); }}
        className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition cursor-pointer ${
          isCompleted
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            : 'border-slate-700 text-transparent hover:border-slate-500'
        }`}
      >
        {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
          {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : accentColor }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {val}/{habit.target} {habit.unit}
          </span>
        </div>
      </div>
      <span
        className="text-[10px] font-black font-mono shrink-0"
        style={{ color: isCompleted ? '#10b981' : accentColor }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Routine Card ─────────────────────────────────────────────────────────────

function RoutineCard({
  routine,
  habits,
  dateToday,
  onLogHabit,
  onBatchLogHabits,
  accentColor,
}: {
  key?: React.Key;
  routine: Routine;
  habits: Habit[];
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onBatchLogHabits?: (updates: { id: string; value: number }[]) => Promise<void>;
  accentColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const routineHabits = habits.filter((h) => routine.habitIds.includes(h.id));
  const completed = routineHabits.filter((h) => (h.history[dateToday] || 0) >= h.target).length;
  const total = routineHabits.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;

  const handleMarkAllDone = async () => {
    const updates = routineHabits
      .filter((h) => (h.history[dateToday] || 0) < h.target)
      .map((h) => ({ id: h.id, value: h.target - (h.history[dateToday] || 0) }));
    if (updates.length === 0) return;
    if (onBatchLogHabits) {
      await onBatchLogHabits(updates);
    } else {
      for (const u of updates) await onLogHabit(u.id, u.value);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isComplete ? 'border-emerald-500/30' : 'border-slate-800'}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`w-full flex items-center gap-3 p-3.5 text-left transition cursor-pointer ${
          isComplete ? 'bg-emerald-950/20' : 'bg-slate-900/60 hover:bg-slate-800/60'
        }`}
      >
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black truncate ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
            {routine.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: isComplete ? '#10b981' : accentColor }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">{completed}/{total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black font-mono" style={{ color: isComplete ? '#10b981' : accentColor }}>
            {pct}%
          </span>
          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2 bg-slate-900/40 border-t border-slate-800">
              {routineHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  dateToday={dateToday}
                  onLogHabit={onLogHabit}
                  accentColor={accentColor}
                />
              ))}
              {!isComplete && (
                <button
                  onClick={handleMarkAllDone}
                  className="w-full py-2 rounded-xl text-xs font-black transition cursor-pointer mt-1"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
                >
                  ✓ Mark All Done
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stats Mini Chart ─────────────────────────────────────────────────────────

function PillarStatsTab({
  pillar,
  habits,
  routines,
  dateToday,
}: {
  pillar: Category;
  habits: Habit[];
  routines: Routine[];
  dateToday: string;
}) {
  const routineHabitIds = new Set(routines.flatMap((r) => r.habitIds));
  const last30 = getLast30Days(dateToday);

  const dailyData = last30.map((date) => {
    const prog = getPillarProgress(pillar, habits, routines, date, routineHabitIds);
    return { date, pct: prog.pct };
  });

  const avg = Math.round(dailyData.reduce((a, b) => a + b.pct, 0) / dailyData.length);
  const best = Math.max(...dailyData.map((d) => d.pct));
  const daysHit = dailyData.filter((d) => d.pct >= 80).length;

  const meta = PILLAR_META[pillar];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '30-Day Avg', value: `${avg}%`, icon: Activity },
          { label: 'Best Day', value: `${best}%`, icon: Trophy },
          { label: 'Days ≥ 80%', value: String(daysHit), icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-slate-900 rounded-2xl p-3 border border-slate-800 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: meta.accent }} />
            <p className="text-base font-black text-white">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 30-Day Bar Chart */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">30-Day Trend</p>
        <div className="flex items-end gap-0.5 h-16">
          {dailyData.map(({ date, pct }) => (
            <div
              key={date}
              className="flex-1 rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(4, pct)}%`,
                backgroundColor: pct >= 80 ? meta.accent : pct >= 40 ? `${meta.accent}60` : '#1e293b',
              }}
              title={`${formatDate(date)}: ${pct}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-1.5">
          <span>30d ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab({
  pillar,
  dateToday,
}: {
  pillar: Category;
  dateToday: string;
}) {
  const storageKey = '90day_pillar_notes_v2';
  const meta = PILLAR_META[pillar];

  const [notes, setNotes] = useState<Array<PillarNote & { noteType?: NoteType }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>('Quick Note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const saveNotes = (next: typeof notes) => {
    setNotes(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const handleAdd = () => {
    if (!content.trim()) return;
    const next = [
      {
        id: Math.random().toString(36).slice(2),
        pillar,
        title: title.trim() || noteType,
        content: content.trim(),
        date: dateToday,
        createdAt: dateToday,
        noteType,
      },
      ...notes,
    ];
    saveNotes(next);
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const pillarNotes = notes.filter((n) => n.pillar === pillar);

  return (
    <div className="space-y-3">
      {/* Add Note Button */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed text-sm font-bold transition cursor-pointer"
          style={{ borderColor: `${meta.accent}40`, color: meta.accent }}
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl border border-slate-700 p-4 space-y-3"
        >
          {/* Note Type Selector */}
          <div className="flex gap-2 flex-wrap">
            {NOTE_TYPES.map((type) => {
              const Icon = NOTE_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer border ${
                    noteType === type
                      ? 'text-white border-transparent'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                  style={noteType === type ? { backgroundColor: meta.accent, borderColor: meta.accent } : {}}
                >
                  <Icon className="w-3 h-3" />
                  {type}
                </button>
              );
            })}
          </div>

          <input
            placeholder={`Title (optional)`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
          <textarea
            placeholder={
              noteType === 'PR / Record'
                ? 'e.g. Bench Press: 85kg × 5 reps'
                : noteType === 'Weekly Reflection'
                ? "What went well? What to improve next week?"
                : "Quick note for today..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="flex-1 py-2 rounded-xl text-xs font-black text-white transition cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: meta.accent }}
            >
              Save Note
            </button>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      {pillarNotes.length === 0 && !isAdding ? (
        <div className="text-center py-10 text-slate-600 text-sm italic">
          No notes yet. Add your first one above.
        </div>
      ) : (
        <div className="space-y-2.5">
          {pillarNotes.map((note) => {
            const Icon = NOTE_TYPE_ICONS[(note.noteType as NoteType) || 'Quick Note'];
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{note.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                        {note.noteType || 'Quick Note'} · {formatDate(note.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 mt-2.5 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Goals Tab ─────────────────────────────────────────────────────────────────

function GoalsTab({
  pillar,
  pillarGoals,
  habits,
  routines,
  routineHabitIds,
  dateToday,
  onOpenCreateModal,
}: {
  pillar: Category;
  pillarGoals: PillarGoal[];
  habits: Habit[];
  routines: Routine[];
  routineHabitIds: Set<string>;
  dateToday: string;
  onOpenCreateModal?: () => void;
}) {
  const meta = PILLAR_META[pillar];
  const goals = pillarGoals.filter((g) => g.pillar === pillar);
  const prog = getPillarProgress(pillar, habits, routines, dateToday, routineHabitIds);

  return (
    <div className="space-y-3">
      {/* Overall Pillar Progress */}
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: `${meta.accent}10`, borderColor: `${meta.accent}25` }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: meta.accent }}>
            Today's Progress
          </p>
          <span className="text-sm font-black font-mono" style={{ color: meta.accent }}>
            {prog.pct}%
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${prog.pct}%`, backgroundColor: meta.accent }}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-1.5">
          {prog.completed} of {prog.total} items complete today
        </p>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-8 text-slate-600 text-sm italic">
          No goals set for {pillar} yet.
        </div>
      ) : (
        goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 flex items-center gap-3 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-full" style={{ backgroundColor: meta.accent }} />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${meta.accent}15`, borderColor: `${meta.accent}28`, color: meta.accent }}
            >
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate">{goal.title}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                {goal.target || goal.desc}
              </p>
            </div>
          </div>
        ))
      )}

      <button
        onClick={onOpenCreateModal}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed text-sm font-bold transition cursor-pointer"
        style={{ borderColor: `${meta.accent}40`, color: meta.accent }}
      >
        <Plus className="w-4 h-4" />
        Add Goal
      </button>
    </div>
  );
}

// ─── Pillar Detail View ───────────────────────────────────────────────────────

function PillarDetailView({
  pillar,
  habits,
  routines,
  pillarGoals,
  dateToday,
  onLogHabit,
  onBatchLogHabits,
  onOpenCreateModal,
  onBack,
}: {
  pillar: Category;
  habits: Habit[];
  routines: Routine[];
  pillarGoals: PillarGoal[];
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onBatchLogHabits?: (updates: { id: string; value: number }[]) => Promise<void>;
  onOpenCreateModal?: () => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PillarTab>('habits');
  const meta = PILLAR_META[pillar];
  const Icon = PILLAR_ICONS[pillar];

  const routineHabitIds = new Set(routines.flatMap((r) => r.habitIds));

  const pillarHabits = habits.filter(
    (h) => !routineHabitIds.has(h.id) && mapCategoryToPillar(h.category) === pillar
  );
  const pillarRoutines = routines.filter((r) => getRoutinePillar(r, habits) === pillar);

  const prog = getPillarProgress(pillar, habits, routines, dateToday, routineHabitIds);

  const TABS: { id: PillarTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'habits', label: 'Habits', icon: CheckCircle2, count: pillarHabits.length },
    { id: 'routines', label: 'Routines', icon: Layers, count: pillarRoutines.length },
    { id: 'goals', label: 'Goals', icon: Target, count: pillarGoals.filter((g) => g.pillar === pillar).length },
    { id: 'notes', label: 'Notes', icon: NotebookPen },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col min-h-screen bg-[#06070a]"
    >
      {/* Header */}
      <div
        className="px-4 pt-5 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${meta.accent}18 0%, transparent 70%)` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1" />
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg shrink-0"
            style={{
              backgroundColor: `${meta.accent}20`,
              borderColor: `${meta.accent}40`,
              color: meta.accent,
              boxShadow: `0 0 24px ${meta.accent}20`,
            }}
          >
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-white tracking-tight">{pillar}</h2>
              {prog.pct >= 80 && (
                <span
                  className="text-[10px] font-black px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${meta.accent}20`, color: meta.accent }}
                >
                  🏅 {prog.pct}% — Badge Earned
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Today's Completion
            </span>
            <span className="text-xs font-black font-mono" style={{ color: meta.accent }}>
              {prog.completed}/{prog.total} · {prog.pct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prog.pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: meta.accent }}
            />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-4 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={isActive ? { backgroundColor: `${meta.accent}20`, color: meta.accent } : {}}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? `${meta.accent}30` : '#1e293b',
                    color: isActive ? meta.accent : '#64748b',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* HABITS TAB */}
            {activeTab === 'habits' && (
              <div className="space-y-2.5">
                {pillarHabits.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm italic">
                    No standalone habits in this pillar yet.
                  </div>
                ) : (
                  pillarHabits.map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      dateToday={dateToday}
                      onLogHabit={onLogHabit}
                      accentColor={meta.accent}
                    />
                  ))
                )}
                <button
                  onClick={onOpenCreateModal}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed text-sm font-bold transition cursor-pointer mt-1"
                  style={{ borderColor: `${meta.accent}40`, color: meta.accent }}
                >
                  <Plus className="w-4 h-4" />
                  Add Habit
                </button>

                {/* Career Pillar: Focus Timer */}
                {pillar === 'Career' && (
                  <div className="mt-4">
                    <FocusTimer />
                  </div>
                )}
              </div>
            )}

            {/* ROUTINES TAB */}
            {activeTab === 'routines' && (
              <div className="space-y-2.5">
                {pillarRoutines.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm italic">
                    No routines in this pillar yet.
                  </div>
                ) : (
                  pillarRoutines.map((r) => (
                    <RoutineCard
                      key={r.id}
                      routine={r}
                      habits={habits}
                      dateToday={dateToday}
                      onLogHabit={onLogHabit}
                      onBatchLogHabits={onBatchLogHabits}
                      accentColor={meta.accent}
                    />
                  ))
                )}
                <button
                  onClick={onOpenCreateModal}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed text-sm font-bold transition cursor-pointer mt-1"
                  style={{ borderColor: `${meta.accent}40`, color: meta.accent }}
                >
                  <Plus className="w-4 h-4" />
                  Add Routine
                </button>
              </div>
            )}

            {/* GOALS TAB */}
            {activeTab === 'goals' && (
              <GoalsTab
                pillar={pillar}
                pillarGoals={pillarGoals}
                habits={habits}
                routines={routines}
                routineHabitIds={routineHabitIds}
                dateToday={dateToday}
                onOpenCreateModal={onOpenCreateModal}
              />
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <NotesTab pillar={pillar} dateToday={dateToday} />
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <PillarStatsTab
                pillar={pillar}
                habits={habits}
                routines={routines}
                dateToday={dateToday}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main PillarsScreen ───────────────────────────────────────────────────────

export default function PillarsScreen({
  habits,
  routines,
  pillarGoals,
  dateToday,
  onLogHabit,
  onBatchLogHabits,
  onOpenCreateModal,
}: PillarsScreenProps) {
  const [selectedPillar, setSelectedPillar] = useState<Category | null>(null);

  const routineHabitIds = new Set(routines.flatMap((r) => r.habitIds));

  const overallPct = (() => {
    const allPcts = PILLAR_NAMES.map(
      (p) => getPillarProgress(p, habits, routines, dateToday, routineHabitIds).pct
    );
    return Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length);
  })();

  // Per-pillar data
  const pillarData = PILLAR_NAMES.map((name) => {
    const prog = getPillarProgress(name, habits, routines, dateToday, routineHabitIds);
    const meta = PILLAR_META[name];
    const Icon = PILLAR_ICONS[name];
    const goalCount = pillarGoals.filter((g) => g.pillar === name).length;
    return { name, prog, meta, Icon, goalCount };
  });

  // If a pillar is selected, show its detail
  if (selectedPillar) {
    return (
      <PillarDetailView
        pillar={selectedPillar}
        habits={habits}
        routines={routines}
        pillarGoals={pillarGoals}
        dateToday={dateToday}
        onLogHabit={onLogHabit}
        onBatchLogHabits={onBatchLogHabits}
        onOpenCreateModal={onOpenCreateModal}
        onBack={() => setSelectedPillar(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-white pb-12">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mission Control</p>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">5 Pillars</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: overallPct >= 80 ? '#10b981' : overallPct >= 50 ? '#f59e0b' : '#ef4444' }}>
              {overallPct}%
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Overall Today</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: overallPct >= 80
                ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                : overallPct >= 50
                ? 'linear-gradient(90deg, #f59e0b, #fb923c)'
                : 'linear-gradient(90deg, #ef4444, #f43f5e)',
            }}
          />
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="px-4 space-y-3">
        {pillarData.map(({ name, prog, meta, Icon, goalCount }) => {
          const isStrong = prog.pct >= 80;
          return (
            <motion.button
              key={name}
              onClick={() => setSelectedPillar(name)}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left rounded-2xl border transition-all cursor-pointer overflow-hidden group"
              style={{
                backgroundColor: '#0d1117',
                borderColor: isStrong ? `${meta.accent}40` : '#1e293b',
              }}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${meta.accent}15`,
                    color: meta.accent,
                    boxShadow: isStrong ? `0 0 20px ${meta.accent}25` : 'none',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-base font-black text-white">{name}</h3>
                      {isStrong && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: `${meta.accent}20`, color: meta.accent }}>
                          🏅
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black font-mono shrink-0" style={{ color: meta.accent }}>
                      {prog.pct}%
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">{meta.subtitle}</p>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prog.pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.accent }}
                    />
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] text-slate-500 font-bold">
                      {prog.standaloneHabits.length} habits · {prog.pillarRoutines.length} routines
                    </span>
                    {goalCount > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: `${meta.accent}80` }}>
                        {goalCount} goals
                      </span>
                    )}
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-400 transition">
                      {prog.completed}/{prog.total} done →
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom accent strip — visible when strong */}
              {isStrong && (
                <div className="h-0.5 w-full" style={{ backgroundColor: meta.accent, opacity: 0.4 }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer Quote */}
      <div className="px-4 mt-6">
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex items-center gap-3">
          <span className="text-2xl">⛰️</span>
          <p className="text-xs text-slate-400 font-semibold italic leading-relaxed">
            "You are the sum of what you repeatedly do. Master the pillars, master the mission."
          </p>
        </div>
      </div>
    </div>
  );
}
