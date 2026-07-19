import React, { useState } from 'react';
import { 
  Flame, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  PlusCircle,
  TrendingUp,
  Dumbbell,
  Apple,
  Briefcase,
  Moon,
  Heart,
  ChevronLeft,
  BookOpen,
  Target,
  Brain,
  GripVertical,
  Sparkles,
  Users,
  Leaf,
  GraduationCap,
  Zap,
  X,
  Play
} from 'lucide-react';
import { Habit, Routine, Category, PillarGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import RoutineDetailsModal from './RoutineDetailsModal';
import { PILLAR_META, mapCategoryToPillar as mapToSharedPillar } from '../lib/pillars';

// Helper to get styled indicators, background and text colors, and lucide icons
const getCategoryMeta = (category: string) => {
  const pillar = mapToSharedPillar(category || 'Mind');
  const meta = PILLAR_META[pillar];
  const lucideIcon = pillar === 'Fitness'
    ? Dumbbell
    : pillar === 'Nutrition'
      ? Apple
      : pillar === 'Career'
        ? Briefcase
        : pillar === 'Recovery'
          ? Moon
          : Brain;

  return {
    icon: pillar,
    lucideIcon,
    bg: `${meta.accent}12`,
    border: `${meta.accent}28`,
    text: meta.text,
    accent: `border-l-4`,
    accentBg: meta.soft,
    accentColor: meta.accent,
    ring: meta.ring,
    label: pillar,
  };
};
const getBlockIcon = (tb?: string) => {
  switch (tb) {
    case 'Morning': return '☀️';
    case 'Afternoon': return '🌤️';
    case 'Evening': return '🌇';
    case 'Night': return '🌙';
    default: return '🔄';
  }
};

// ─── SHARED ROW COMPONENTS ──────────────────────────────────────────────────
// Used by BOTH the "By Time" and "By Pillar" views so a habit/routine looks and
// behaves identically no matter which grouping you're looking at it through.

interface HabitRowProps {
  habit: Habit;
  selectedDate: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
}

function HabitRow({ habit, selectedDate, onLogHabit }: HabitRowProps) {
  const val = habit.history[selectedDate] || 0;
  const isDone = val >= habit.target;
  const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;
  const hMeta = getCategoryMeta(habit.category);
  const IconComponent = hMeta.lucideIcon;

  // FIX: one-tap complete — a single tap fills the habit to target in one shot
  // (or, if already complete, undoes it back to 0). No incremental taps needed.
  const handleTap = () => onLogHabit(habit.id, isDone ? -habit.target : (habit.target - val));

  return (
    <div
      onClick={handleTap}
      className="group bg-white rounded-2xl p-2 sm:p-3 border border-slate-200/60 hover:border-slate-300 transition-all duration-300 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden select-none cursor-pointer"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
        style={{ backgroundColor: isDone ? '#10b981' : hMeta.accentColor }}
      />

      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pl-1.5">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300"
          style={{
            backgroundColor: isDone ? '#10b98110' : `${hMeta.bg}`,
            borderColor: isDone ? '#10b98125' : `${hMeta.border}`,
            color: isDone ? '#10b981' : hMeta.accentColor,
          }}
        >
          <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={`text-sm sm:text-base font-bold truncate leading-tight tracking-tight ${isDone ? 'line-through text-gray-400' : 'text-[#0F172A]'}`}>
            {habit.name}
          </h4>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[10px] sm:text-[11px] font-extrabold tracking-wide leading-none"
              style={{ color: isDone ? '#10b981' : hMeta.accentColor }}
            >
              {hMeta.label}
            </span>

            {habit.timeBlock && (
              <span className="w-5 h-5 rounded flex items-center justify-center border border-slate-100 bg-slate-50/50 leading-none shrink-0">
                <span className="text-[11px]">{getBlockIcon(habit.timeBlock)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start shrink-0 w-14 sm:w-16">
          <div className="flex items-baseline justify-between w-full">
            <span className="text-xs font-black font-mono leading-none" style={{ color: isDone ? '#10b981' : hMeta.accentColor }}>
              {val}/{habit.target}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 leading-none">
              {pct}%
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
            {habit.unit || 'reps'}
          </span>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: isDone ? '#10b981' : hMeta.accentColor }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleTap(); }}
        aria-label={isDone ? `Undo ${habit.name}` : `Complete ${habit.name}`}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-350 relative shrink-0 cursor-pointer ${
          isDone
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xs active:scale-95'
            : 'border-slate-200 text-transparent hover:border-emerald-500 hover:text-emerald-500 bg-slate-50/40 active:scale-95'
        }`}
      >
        {isDone ? (
          <Check className="w-4 h-4 stroke-[3px]" />
        ) : (
          <div className="w-5 h-5 rounded-full border border-slate-300/80 group-hover:border-slate-400 transition-all" />
        )}
      </button>
    </div>
  );
}

interface RoutineRowProps {
  routine: Routine;
  habits: Habit[];
  selectedDate: string;
  badgeLabel: string;
  onOpen: () => void;
}

function RoutineRow({ routine, habits, selectedDate, badgeLabel, onOpen }: RoutineRowProps) {
  const routineHabits = habits.filter(h => routine.habitIds.includes(h.id));
  const rCompletedCount = routineHabits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
  const rTotalCount = routineHabits.length;
  const firstHabit = routineHabits[0];
  const rMeta = firstHabit ? getCategoryMeta(firstHabit.category) : getCategoryMeta('Fitness');
  const IconComponent = rMeta.lucideIcon;
  const routineProgressPercent = rTotalCount > 0 ? Math.round((rCompletedCount / rTotalCount) * 100) : 0;

  return (
    <div
      onClick={onOpen}
      className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer border-l-[6px] border-l-emerald-500 relative overflow-hidden"
    >
      <div className="flex items-center gap-3.5 min-w-0 shrink-0 sm:w-1/3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100/60 text-emerald-500 flex items-center justify-center shrink-0">
          <IconComponent className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-black text-[#0F172A] leading-snug group-hover:text-emerald-600 transition-colors truncate">
            {routine.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[8px] font-extrabold tracking-widest bg-emerald-50 border border-emerald-100/60 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase">
              {badgeLabel}
            </span>
            <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
              {rTotalCount} tasks
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-3.5 min-w-0">
        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${routineProgressPercent}%` }} />
        </div>
        <div className="text-right shrink-0 flex items-baseline gap-1">
          <span className="text-xs font-black text-emerald-600 font-mono">
            {rCompletedCount}/{rTotalCount}
          </span>
          <span className="text-[9px] text-gray-400 font-semibold">
            ({routineProgressPercent}%)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t border-slate-50 sm:border-0">
        <div className="bg-[#FFF9DB] border border-[#FFE066] text-[#E08A00] px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wide flex items-center gap-1 shadow-xs">
          <Zap className="w-3 h-3 fill-[#F59E0B] stroke-none" />
          <span>+{routine.points} XP</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-550 group-hover:translate-x-0.5 transition-all hidden sm:block" />
      </div>
    </div>
  );
}

interface TodayScreenProps {
  habits: Habit[];
  routines: Routine[];
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onCompleteRoutine?: (routineId: string) => Promise<void>;
  userPoints: number;
  currentUser: any;
  nutritionToday: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  };
  nutritionTargets?: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  };
  onRefresh?: () => Promise<void>;
  pillarGoals?: PillarGoal[];
}

export default function TodayScreen({
  habits,
  routines,
  dateToday,
  onLogHabit,
  onCompleteRoutine,
  userPoints,
  currentUser,
  nutritionToday,
  nutritionTargets,
  onRefresh,
}: TodayScreenProps) {
  const targets = nutritionTargets || {
    protein: 120,
    carbs: 200,
    fats: 70,
    fiber: 25,
    calories: 2000,
  };

  const [selectedDate, setSelectedDate] = useState<string>(dateToday);
  const [activeTab, setActiveTab] = useState<'time' | 'pillar'>('time');
  const [expandedBlocks, setExpandedBlocks] = useState<{ [key: string]: boolean }>({
    'Morning': true,
    'Afternoon': true,
    'Evening': false,
    'Night': false,
    'Anytime': false,
  });

  // FIX: By Pillar now expands/collapses per-pillar, same interaction pattern as By Time
  const [expandedPillars, setExpandedPillars] = useState<{ [key: string]: boolean }>({
    Fitness: true,
    Nutrition: true,
    Career: false,
    Recovery: false,
    Mind: false,
  });
  const togglePillar = (name: string) => setExpandedPillars(prev => ({ ...prev, [name]: !prev[name] }));

  const [activeRoutineDetails, setActiveRoutineDetails] = useState<Routine | null>(null);

  // Generate week dates centered on selectedDate or today
  const getWeekDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = -4; i <= 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayNum = d.getDate();
      dates.push({ dateStr, dayName, dayNum, isToday: dateStr === dateToday });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Categories helper mapping to pillars
  const mapCategoryToPillar = (category: string): 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind' => {
    const cat = (category || '').toLowerCase();
    if (cat === 'fitness') return 'Fitness';
    if (cat === 'nutrition' || cat.includes('diet')) return 'Nutrition';
    if (cat === 'career') return 'Career';
    if (cat === 'recovery') return 'Recovery';
    if (cat === 'mind') return 'Mind';

    if (cat.includes('fit') || cat.includes('gym') || cat.includes('workout') || cat.includes('run')) return 'Fitness';
    if (cat.includes('nutri') || cat.includes('diet') || cat.includes('food') || cat.includes('protein')) return 'Nutrition';
    if (cat.includes('career') || cat.includes('study') || cat.includes('productiv') || cat.includes('work') || cat.includes('coding')) return 'Career';
    if (cat.includes('recov') || cat.includes('sleep') || cat.includes('health') || cat.includes('rest') || cat.includes('social')) return 'Recovery';
    return 'Mind';
  };

  // FIX: derive a routine's pillar from the majority category of the habits it
  // actually contains, so routines can be attributed to a pillar too.
  const getRoutineCategory = (routine: Routine): string => {
    const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
    if (rHabits.length === 0) return 'Mind';
    const counts: Record<string, number> = {};
    rHabits.forEach(h => { counts[h.category] = (counts[h.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Compute stats for selected day
  const routineHabitIds = new Set(routines.flatMap(r => r.habitIds));
  const standaloneHabits = habits.filter(h => !routineHabitIds.has(h.id));

  const totalTasks = habits.length;
  const completedTasks = habits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
  const tasksLeft = Math.max(0, totalTasks - completedTasks);
  const todayScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Day streak
  const dayStreak = currentUser?.consecutive_locked_in_streak !== undefined ? currentUser.consecutive_locked_in_streak : 0;

  // Journey details
  const journeyStart = currentUser?.journey_start_date ? new Date(currentUser.journey_start_date) : null;
  let currentDay = 1;
  if (journeyStart) {
    const diffTime = Math.abs(new Date().getTime() - journeyStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.max(1, Math.min(90, diffDays));
  }
  const missionProgressPercent = Math.round((currentDay / 90) * 100);

  // Toggle dynamic fold state
  const toggleBlock = (block: string) => {
    setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  // Helper: check off all habits in a routine instantly
  const handleMarkRoutineDone = async (routine: Routine) => {
    try {
      for (const hId of routine.habitIds) {
        const habit = habits.find(h => h.id === hId);
        if (habit) {
          const currentProgress = habit.history[selectedDate] || 0;
          if (currentProgress < habit.target) {
            await onLogHabit(habit.id, habit.target - currentProgress);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPillarColor = (pillar: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const meta = PILLAR_META[pillar];
    return `${meta.text} ${meta.soft} ${meta.border}`;
  };

  // FIX: pillar items now include BOTH standalone habits and routines (grouped
  // by the routine's derived majority category), matching HomeScreen's logic.
  const getPillarItems = (pillar: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const pHabits = standaloneHabits.filter(h => mapCategoryToPillar(h.category) === pillar);
    const pRoutines = routines.filter(r => mapCategoryToPillar(getRoutineCategory(r)) === pillar);
    return { pHabits, pRoutines };
  };

  // FIX: honest completion stats — no more fake baseline numbers (91/78/84/88/80)
  // when a pillar has no items. Blends habit + routine completion ratios.
  const getPillarProgress = (pillar: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const { pHabits, pRoutines } = getPillarItems(pillar);

    const habitRatios = pHabits.map(h => {
      const v = h.history[selectedDate] || 0;
      return h.target > 0 ? Math.min(1, v / h.target) : 0;
    });
    const routineRatios = pRoutines.map(r => {
      const rHabits = habits.filter(h => r.habitIds.includes(h.id));
      const completed = rHabits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
      return rHabits.length > 0 ? completed / rHabits.length : 0;
    });

    const allRatios = [...habitRatios, ...routineRatios];
    const pct = allRatios.length > 0 ? Math.round((allRatios.reduce((a, b) => a + b, 0) / allRatios.length) * 100) : 0;
    const completedItems = habitRatios.filter(r => r >= 1).length + routineRatios.filter(r => r >= 1).length;

    return { pct, ratio: `${completedItems}/${allRatios.length}`, totalItems: allRatios.length };
  };

  const [finishedLoading, setFinishedLoading] = useState(false);
  const handleFinishDay = () => {
    setFinishedLoading(true);
    setTimeout(() => {
      setFinishedLoading(false);
      alert(`🎉 DAY ${currentDay} LOCKED IN!\nAwesome job! Keep building momentum!`);
    }, 1200);
  };

  return (
    <div className="w-full bg-[#F8F9FC] text-[#1E293B] flex flex-col font-sans pb-12 relative">
      
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between select-none">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Today</h1>
          <p className="text-gray-400 text-xs font-semibold mt-0.5">Day {currentDay} of 90</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/10 shadow-sm text-xs font-bold">
            <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
            <span>{dayStreak} Streak</span>
          </div>
          <Calendar className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 transition" />
        </div>
      </div>

      {/* Calendar Horizontal Slider */}
      <div className="px-4 py-3 flex gap-2.5 overflow-x-auto select-none no-scrollbar">
        {weekDates.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl min-w-[50px] transition-all duration-300 relative cursor-pointer ${
                isSelected 
                  ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/25 scale-105 border border-emerald-400' 
                  : 'bg-white text-[#0F172A] border border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className={`text-[9px] font-black tracking-widest ${isSelected ? 'text-emerald-100' : 'text-gray-450'}`}>
                {day.dayName}
              </span>
              <span className="text-base font-black mt-1">
                {day.dayNum}
              </span>
              {day.isToday && !isSelected && (
                <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mission Quick stats */}
      <div className="mx-6 my-2 bg-white rounded-2xl p-4 border border-gray-150/40 shadow-sm flex items-center justify-between text-center divide-x divide-gray-100">
        <div className="flex-1 px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Lock-In</span>
          <span className="text-sm font-black text-[#0F172A] mt-1 block">{missionProgressPercent}%</span>
        </div>
        <div className="flex-1 px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Score</span>
          <span className="text-sm font-black text-emerald-500 mt-1 block">{todayScore}</span>
        </div>
        <div className="flex-1 px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Left</span>
          <span className="text-sm font-black text-orange-500 mt-1 block">{tasksLeft} tasks</span>
        </div>
        <div className="flex-1 px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Done</span>
          <span className="text-sm font-black text-blue-500 mt-1 block">{completedTasks}/{totalTasks}</span>
        </div>
      </div>

      {/* View Switch Tab bar */}
      <div className="px-6 my-3">
        <div className="bg-white p-1 rounded-2xl border border-gray-150 flex shadow-sm">
          <button
            onClick={() => setActiveTab('time')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'time' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            🕒 By Time
          </button>
          <button
            onClick={() => setActiveTab('pillar')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pillar' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            📊 By Pillar
          </button>
        </div>
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 space-y-4">
        {activeTab === 'time' ? (
          // By Time View
          <div className="space-y-4">
            {[
              { id: 'Morning', title: 'Morning', range: '6:00 AM – 11:00 AM', est: 'Est. 85 min' },
              { id: 'Afternoon', title: 'Afternoon', range: '11:00 AM – 5:00 PM', est: 'Est. 110 min' },
              { id: 'Evening', title: 'Evening', range: '5:00 PM – 9:00 PM', est: 'Est. 70 min' },
              { id: 'Night', title: 'Night', range: '9:00 PM – 11:00 PM', est: 'Est. 50 min' },
              { id: 'Anytime', title: 'Anytime', range: 'Flexible', est: 'All Day' },
            ].map((block) => {
              const blockRoutines = routines.filter(r => {
                if (block.id === 'Anytime') {
                  return r.timeBlock === 'Constant' || (r.timeBlock as string) === 'Anytime';
                }
                return r.timeBlock === block.id;
              });
              const blockHabits = standaloneHabits.filter(h => {
                if (block.id === 'Anytime') {
                  return !h.timeBlock || h.timeBlock === 'Anytime';
                }
                return h.timeBlock === block.id;
              });

              const isExpanded = expandedBlocks[block.id];
              return (
                <div key={block.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  {/* Fold Header */}
                  <div 
                    onClick={() => toggleBlock(block.id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">
                        {block.id === 'Morning' ? '☀️' : block.id === 'Afternoon' ? '🌤️' : block.id === 'Evening' ? '🌆' : block.id === 'Night' ? '🌙' : '🔄'}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#0F172A]">{block.title}</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{block.range}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400 font-semibold">{block.est}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-50/80 bg-slate-50/30 px-5 pb-5 pt-3 space-y-4"
                      >
                        {blockRoutines.length === 0 && blockHabits.length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center italic py-2">No active habits or routines scheduled in this block.</p>
                        ) : (
                          <div className="space-y-4">
                            {/* 1. Routines Section */}
                            {blockRoutines.length > 0 && (
                              <div className="space-y-3">
                                {blockRoutines.map((routine) => (
                                  <RoutineRow
                                    key={routine.id}
                                    routine={routine}
                                    habits={habits}
                                    selectedDate={selectedDate}
                                    badgeLabel={block.id.toUpperCase()}
                                    onOpen={() => setActiveRoutineDetails(routine)}
                                  />
                                ))}
                              </div>
                            )}

                            {/* 2. Standalone Habits Section */}
                            {blockHabits.length > 0 && (
                              <div className="space-y-3">
                                {blockRoutines.length > 0 && (
                                  <div className="flex items-center gap-2 pt-2 pb-1">
                                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#12B886] uppercase">
                                      STANDALONE HABITS
                                    </span>
                                    <div className="h-px bg-slate-100 flex-1" />
                                  </div>
                                )}
                                {blockHabits.map((h) => (
                                  <HabitRow key={h.id} habit={h} selectedDate={selectedDate} onLogHabit={onLogHabit} />
                                ))}
                              </div>
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
        ) : (
          // By Pillar View — habits AND routines grouped under their pillar, expandable
          <div className="space-y-4">
            {(['Fitness', 'Nutrition', 'Career', 'Recovery', 'Mind'] as const).map((pillarName) => {
              const stats = getPillarProgress(pillarName);
              const { pHabits, pRoutines } = getPillarItems(pillarName);
              const pColor = getPillarColor(pillarName);
              const pIcon = pillarName === 'Fitness' ? Dumbbell : pillarName === 'Nutrition' ? Apple : pillarName === 'Career' ? Briefcase : pillarName === 'Recovery' ? Moon : Heart;
              const IconComp = pIcon;
              const isExpanded = expandedPillars[pillarName];

              return (
                <div key={pillarName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div
                    onClick={() => togglePillar(pillarName)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 select-none"
                  >
                    <div className="flex items-center gap-3.5 flex-1 mr-4">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 text-lg ${pColor}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-black text-[#0F172A]">{pillarName}</h3>
                          <span className="text-xs font-black text-[#12B886]">{stats.pct}%</span>
                        </div>

                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.pct}%` }} />
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                          {stats.totalItems > 0 ? `${stats.ratio} completed` : 'No habits or routines yet'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />}
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-50/80 bg-slate-50/30 px-5 pb-5 pt-3 space-y-3"
                      >
                        {stats.totalItems === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center italic py-2">
                            No {pillarName.toLowerCase()} habits or routines yet — add one from the + button.
                          </p>
                        ) : (
                          <>
                            {pRoutines.length > 0 && (
                              <div className="space-y-3">
                                {pRoutines.map((routine) => (
                                  <RoutineRow
                                    key={routine.id}
                                    routine={routine}
                                    habits={habits}
                                    selectedDate={selectedDate}
                                    badgeLabel={routine.timeBlock?.toUpperCase() || 'ANYTIME'}
                                    onOpen={() => setActiveRoutineDetails(routine)}
                                  />
                                ))}
                              </div>
                            )}
                            {pHabits.length > 0 && (
                              <div className="space-y-3">
                                {pRoutines.length > 0 && (
                                  <div className="flex items-center gap-2 pt-2 pb-1">
                                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#12B886] uppercase">
                                      STANDALONE HABITS
                                    </span>
                                    <div className="h-px bg-slate-100 flex-1" />
                                  </div>
                                )}
                                {pHabits.map((h) => (
                                  <HabitRow key={h.id} habit={h} selectedDate={selectedDate} onLogHabit={onLogHabit} />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Diet snapshot — real macro data only (dropped the fake Water/Steps/Meditation
                numbers that weren't backed by any tracked state) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Diet Snapshot</h3>
                <span className={`text-xs font-black text-[#12B886]`}>
                  {targets.calories > 0 ? Math.min(100, Math.round((nutritionToday.calories / targets.calories) * 100)) : 0}%
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5 text-center">
                {[
                  { label: 'Protein', value: nutritionToday.protein, target: targets.protein, unit: 'g', color: 'bg-emerald-500' },
                  { label: 'Carbs', value: nutritionToday.carbs, target: targets.carbs, unit: 'g', color: 'bg-blue-500' },
                  { label: 'Fats', value: nutritionToday.fats, target: targets.fats, unit: 'g', color: 'bg-orange-500' },
                  { label: 'Fiber', value: nutritionToday.fiber, target: targets.fiber, unit: 'g', color: 'bg-purple-500' },
                  { label: 'Calories', value: nutritionToday.calories, target: targets.calories, unit: 'kcal', color: 'bg-slate-700' },
                ].map((macro) => {
                  const pct = macro.target > 0 ? Math.min(100, Math.round((macro.value / macro.target) * 100)) : 0;
                  return (
                    <div key={macro.label} className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{macro.label}</span>
                      <span className="text-xs font-extrabold text-[#0F172A] mt-1">
                        {macro.value}<span className="text-[9px] text-gray-400 font-normal">{macro.unit}</span>
                      </span>
                      <span className="text-[9px] font-semibold text-gray-400">/ {macro.target}</span>
                      <div className="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className={`${macro.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary Progress Bar & Finish Day action */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-150 p-4 flex items-center justify-between gap-4 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          {/* Circular dial progress today */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="22" cy="22" r="18" className="stroke-slate-100" strokeWidth="3" fill="transparent" />
              <circle cx="22" cy="22" r="18" className="stroke-[#12B886]" strokeWidth="3" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - todayScore / 100)} strokeLinecap="round" fill="transparent" />
            </svg>
            <span className="absolute text-[10px] font-black text-[#0F172A]">{todayScore}%</span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[#0F172A]">Today's Progress</h4>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{completedTasks} / {totalTasks} tasks completed</p>
          </div>
        </div>

        <button 
          onClick={handleFinishDay}
          disabled={finishedLoading}
          className="bg-[#12B886] hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20 disabled:bg-emerald-300"
        >
          {finishedLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Finish Day</span>
              <span>🏁</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Routine Details Modal */}
      <AnimatePresence>
        {activeRoutineDetails && (() => {
          const freshRoutine = routines.find(r => r.id === activeRoutineDetails.id) || activeRoutineDetails;
          return (
            <RoutineDetailsModal
              isOpen={!!activeRoutineDetails}
              onClose={() => setActiveRoutineDetails(null)}
              routine={freshRoutine}
              habits={habits}
              selectedDate={selectedDate}
              onLogHabit={onLogHabit}
              onMarkRoutineDone={handleMarkRoutineDone}
              onRefresh={onRefresh}
            />
          );
        })()}
      </AnimatePresence>

    </div>
  );
}