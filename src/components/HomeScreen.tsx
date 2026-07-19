import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  Zap, 
  Bell, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Dumbbell, 
  Compass, 
  BookOpen, 
  Briefcase, 
  Moon, 
  Heart, 
  Apple,
  Activity,
  CheckCircle,
  GripVertical,
  Plus,
  Sun,
  Sunset,
  CloudSun,
  Target,
  Brain
} from 'lucide-react';
import { Habit, Routine, Category, PillarGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import RoutineDetailsModal from './RoutineDetailsModal';
import type { LoggedFood } from './DietScreen';
import { PILLAR_META } from '../lib/pillars';

interface HomeScreenProps {
  habits: Habit[];
  routines: Routine[];
  userPoints: number;
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  setTab: (tab: string) => void;
  onNavigateToRoutine: (routineId: string) => void;
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
  // NEW: today's actual food entries + remove handler, so the diet card can act as a real log
  todaysFoodLog?: LoggedFood[];
  onRemoveFood?: (id: string) => void;
  onOpenLogFood: () => void;
  onOpenCreateModal: () => void;
  onRefresh?: () => Promise<void>;
  pillarGoals?: PillarGoal[];
}

export default function HomeScreen({
  habits,
  routines,
  userPoints,
  dateToday,
  onLogHabit,
  setTab,
  onNavigateToRoutine,
  currentUser,
  nutritionToday,
  nutritionTargets,
  todaysFoodLog = [],
  onRemoveFood,
  onOpenLogFood,
  onOpenCreateModal,
  onRefresh,
  pillarGoals = [],
}: HomeScreenProps) {
  const targets = nutritionTargets || {
    protein: 150,
    carbs: 200,
    fats: 70,
    fiber: 25,
    calories: 2000,
  };

  // Map standard categories to 5 Core Pillars
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

  const getPillarIcon = (pillar: Category) => {
    if (pillar === 'Fitness') return Dumbbell;
    if (pillar === 'Nutrition') return Apple;
    if (pillar === 'Career') return Briefcase;
    if (pillar === 'Recovery') return Moon;
    return Brain;
  };

  const getPillarGoalCount = (pillar: Category) => pillarGoals.filter(goal => goal.pillar === pillar).length;

  const routineHabitIds = new Set(routines.flatMap(r => r.habitIds));
  const standaloneHabits = habits.filter(h => !routineHabitIds.has(h.id));

  // Calculate day completion stats
  const doneTodayCount = standaloneHabits.filter((h) => (h.history[dateToday] || 0) >= h.target).length;
  const totalTodayCount = standaloneHabits.length;

  // Calculate routine completion stats
  const completedRoutines = routines.filter(r => {
    const rHabits = habits.filter(h => r.habitIds.includes(h.id));
    return rHabits.length > 0 && rHabits.every(h => (h.history[dateToday] || 0) >= h.target);
  }).length;
  const totalRoutines = routines.length;

  // Today's Score calculation
  const todayScore = totalTodayCount + totalRoutines > 0 
    ? Math.round(((doneTodayCount + completedRoutines) / (totalTodayCount + totalRoutines)) * 100)
    : 0;

  // Day streak calculation
  const dayStreak = currentUser?.consecutive_locked_in_streak !== undefined ? currentUser.consecutive_locked_in_streak : 0;

  // Journey details (90 Days Lock-In)
  const journeyStart = currentUser?.journey_start_date ? new Date(currentUser.journey_start_date) : null;
  let currentDay = 1;
  if (journeyStart) {
    const diffTime = Math.abs(new Date().getTime() - journeyStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.max(1, Math.min(90, diffDays));
  }
  const missionProgressPercent = Math.round((currentDay / 90) * 100);

  // FIX #2: Determine a routine's "focus category" from the habits it actually contains
  // (majority category wins), so routines can be attributed to a pillar too.
  const getRoutineCategory = (routine: Routine): string => {
    const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
    if (rHabits.length === 0) return 'Mind';
    const counts: Record<string, number> = {};
    rHabits.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Completion fraction (0-1) for a routine today, based on its constituent habits
  const routineProgressCount = (routine: Routine) => {
    const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
    const completed = rHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
    return { completed, total: rHabits.length };
  };

  // FIX #2: Pillar completion now blends BOTH standalone habits and routines whose
  // majority-category maps into that pillar — no more fake baseline numbers when empty.
  const getPillarStats = (pillarName: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const pillarStandaloneHabits = standaloneHabits.filter(h => mapCategoryToPillar(h.category) === pillarName);
    const pillarRoutines = routines.filter(r => mapCategoryToPillar(getRoutineCategory(r)) === pillarName);

    const habitRatios = pillarStandaloneHabits.map(h => {
      const val = h.history[dateToday] || 0;
      return h.target > 0 ? Math.min(1, val / h.target) : 0;
    });

    const routineRatios = pillarRoutines.map(r => {
      const { completed, total } = routineProgressCount(r);
      return total > 0 ? completed / total : 0;
    });

    const allRatios = [...habitRatios, ...routineRatios];
    if (allRatios.length === 0) return 0;
    return Math.round((allRatios.reduce((a, b) => a + b, 0) / allRatios.length) * 100);
  };

  const getPillarItemCount = (pillarName: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const h = standaloneHabits.filter(hh => mapCategoryToPillar(hh.category) === pillarName).length;
    const r = routines.filter(rt => mapCategoryToPillar(getRoutineCategory(rt)) === pillarName).length;
    return h + r;
  };

  const pillarDetails = (['Fitness', 'Nutrition', 'Career', 'Recovery', 'Mind'] as Category[]).map((name) => ({
    name,
    value: getPillarStats(name),
    items: getPillarItemCount(name),
    goals: getPillarGoalCount(name),
    meta: PILLAR_META[name],
    icon: getPillarIcon(name),
  }));

  // NEW: State for Quick Habit Logger Active Filter (All, Morning, Afternoon, Evening, Night)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('All');

  // State for active routine details popup on HomeScreen
  const [activeRoutineDetails, setActiveRoutineDetails] = useState<Routine | null>(null);

  // Helper: check off all habits in a routine instantly from HomeScreen
  const handleMarkRoutineDone = async (routine: Routine) => {
    try {
      for (const hId of routine.habitIds) {
        const h = habits.find(habit => habit.id === hId);
        if (h) {
          const val = h.history[dateToday] || 0;
          if (val < h.target) {
            await onLogHabit(h.id, h.target - val);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Date helpers to compute yesterday's date & yesterday's / today's completion rates
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getYesterdayDate = (todayStr: string) => {
    try {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 1);
      return formatDateString(d);
    } catch (e) {
      return '';
    }
  };
  const yesterdayDate = getYesterdayDate(dateToday);

  const getCompletionRateForDate = (dateStr: string) => {
    if (!dateStr || habits.length === 0) return 0;
    const completed = habits.filter(h => (h.history[dateStr] || 0) >= h.target).length;
    return Math.round((completed / habits.length) * 100);
  };

  const todayCompletionRate = getCompletionRateForDate(dateToday);
  const yesterdayCompletionRate = getCompletionRateForDate(yesterdayDate);
  const isAhead = todayCompletionRate >= yesterdayCompletionRate;

  // Helper to count standalone habits dynamically in each filter
  const getBlockHabitsCount = (blockId: string) => {
    if (blockId === 'All') {
      return standaloneHabits.length;
    }
    return standaloneHabits.filter(h => h.timeBlock === blockId).length;
  };

  // Remaining count for the main header badge
  const remainingCount = habits.filter(h => (h.history[dateToday] || 0) < h.target).length;

  // Filter configuration with beautiful icons and color styles matching the screenshot
  const timeFilters = [
    { id: 'All' as const, label: 'All', icon: CheckCircle, selectedClass: 'bg-[#102a24] text-[#14b8a6] border-[#14b8a6]/40 shadow-lg shadow-emerald-500/10', count: getBlockHabitsCount('All') },
    { id: 'Morning' as const, label: 'Morning', icon: Sun, selectedClass: 'bg-amber-950/40 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10', count: getBlockHabitsCount('Morning') },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: CloudSun, selectedClass: 'bg-blue-950/40 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/10', count: getBlockHabitsCount('Afternoon') },
    { id: 'Evening' as const, label: 'Evening', icon: Sunset, selectedClass: 'bg-orange-950/40 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10', count: getBlockHabitsCount('Evening') },
    { id: 'Night' as const, label: 'Night', icon: Moon, selectedClass: 'bg-purple-950/40 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/10', count: getBlockHabitsCount('Night') },
  ];

  // Filter habits based on selected block
  const filteredHabits = standaloneHabits.filter(h => {
    if (activeFilter === 'All') return true;
    return h.timeBlock === activeFilter;
  });

  // Filter routines based on selected block
  const filteredRoutines = routines.filter(r => {
    if (activeFilter === 'All') return r.timeBlock === 'Morning' || r.timeBlock === 'Evening'; // default showcase routines if 'All'
    return r.timeBlock === activeFilter;
  });

  const getCategoryMetaForLogger = (category: string) => {
    const pillar = mapCategoryToPillar(category);
    const meta = PILLAR_META[pillar];
    return {
      lucideIcon: getPillarIcon(pillar),
      accentColor: meta.accent,
      bgColor: `${meta.accent}18`,
      borderColor: `${meta.accent}36`,
      label: meta.label,
      pillar,
    };
  };

  const getRoutineMetaForLogger = (routine: Routine) => {
    const pillar = mapCategoryToPillar(getRoutineCategory(routine));
    const meta = PILLAR_META[pillar];
    return {
      lucideIcon: getPillarIcon(pillar),
      accentColor: meta.accent,
      label: meta.label,
      pillar,
    };
  };

  // FIX #1: One-tap complete. A single tap on the check circle marks the habit
  // FULLY done regardless of target (target - current, in one shot). Tapping an
  // already-completed habit undoes it back to 0. No more incremental +1 taps.
  const handleQuickLog = async (habitId: string) => {
    const targetHabit = habits.find((h) => h.id === habitId);
    if (!targetHabit) return;
    const curToday = targetHabit.history[dateToday] || 0;
    const isCompleted = curToday >= targetHabit.target;
    if (isCompleted) {
      await onLogHabit(habitId, -curToday); // undo
    } else {
      await onLogHabit(habitId, targetHabit.target - curToday); // complete in one tap
    }
  };

  const importantHabits = standaloneHabits
    .map((habit) => {
      const progress = habit.history[dateToday] || 0;
      const isCompleted = progress >= habit.target;
      const priority =
        (isCompleted ? -100 : 0) +
        (habit.enableFocusTimer ? 30 : 0) +
        (habit.repeat === 'Today Only' ? 25 : 0) +
        Math.min(30, habit.points || 0) +
        (habit.timeBlock && habit.timeBlock !== 'Anytime' ? 8 : 0);
      return { habit, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(item => item.habit);

  const focusRoutines = routines
    .filter((routine) => {
      const { completed, total } = routineProgressCount(routine);
      return total > 0 && completed < total;
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

  return (
    <div className="w-full bg-[#F8F9FC] text-[#1E293B] flex flex-col font-sans pb-12 relative">
      
      {/* Header Bar */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between select-none">
        <div>
          <p className="text-gray-400 text-xs font-semibold tracking-wide">Good morning, Charan 👋</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5">Let's win today.</h1>
        </div>
        <div className="relative cursor-pointer active:scale-95 transition-transform">
          <div className="bg-white p-2.5 rounded-full border border-gray-150 shadow-sm">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="flex-1 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Core Tracking, Stats, Pillars, and Routines */}
          <div className="lg:col-span-7 space-y-6">
        
        {/* 90-Day Lock-In Hero Card */}
        <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                90-Day Lock-In Mission
              </span>
              <h2 className="text-3xl font-black mt-3 tracking-tight font-sans">
                Day {currentDay} <span className="text-slate-400 text-xl font-normal">/ 90</span>
              </h2>
              <p className="text-xs text-slate-300 mt-2 font-medium max-w-[180px] leading-relaxed">
                You're building the life you always wanted.
              </p>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="38" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                <circle
                  cx="48" cy="48" r="38"
                  className="stroke-emerald-400 transition-all duration-1000"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - missionProgressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-white">{missionProgressPercent}%</span>
                <span className="text-[7px] text-slate-450 uppercase tracking-widest font-bold">Progress</span>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const isFilled = idx < Math.ceil((currentDay / 90) * 8);
              return (
                <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${isFilled ? 'w-5 bg-emerald-400' : 'w-2 bg-slate-800'}`} />
              );
            })}
          </div>
        </div>

        {/* Stats Row Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="bg-orange-500/10 p-2 rounded-xl text-orange-500">
              <Flame className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl font-extrabold text-[#0F172A] mt-2">{dayStreak}</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Day Streak</span>
            <span className="text-[9px] text-[#12B886] font-bold mt-1">Keep it up!</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl font-extrabold text-[#0F172A] mt-2">{todayScore}</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Today's Score</span>
            <span className="text-[9px] text-emerald-500 font-bold mt-1">Great progress!</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl font-extrabold text-[#0F172A] mt-2">+{userPoints}</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">Mission Pts</span>
            <span className="text-[9px] text-blue-500 font-bold mt-1">Keep going!</span>
          </div>
        </div>

        {/* Diet — same simple macro-grid layout as before, just relabeled from "Nutrition Today" to "Diet" */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Apple className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Diet</h3>
            </div>
            <button onClick={onOpenLogFood} className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition">
              Log Food &gt;
            </button>
          </div>

          {/* Quick Macro Indicators */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { label: 'Protein', value: nutritionToday.protein, target: targets.protein, unit: 'g', color: 'bg-emerald-500' },
              { label: 'Carbs', value: nutritionToday.carbs, target: targets.carbs, unit: 'g', color: 'bg-blue-500' },
              { label: 'Fats', value: nutritionToday.fats, target: targets.fats, unit: 'g', color: 'bg-orange-500' },
              { label: 'Fiber', value: nutritionToday.fiber, target: targets.fiber, unit: 'g', color: 'bg-purple-500' },
              { label: 'Calories', value: nutritionToday.calories, target: targets.calories, unit: 'kcal', color: 'bg-slate-700' },
            ].map((macro) => {
              const progress = Math.min(100, Math.round((macro.value / (macro.target || 1)) * 100));
              return (
                <div key={macro.label} className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{macro.label}</span>
                  <span className="text-xs font-extrabold text-[#0F172A] mt-1">
                    {macro.value}<span className="text-[9px] text-gray-400 font-normal">{macro.unit}</span>
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400">/ {macro.target}</span>

                  <div className="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div className={`${macro.color} h-full rounded-full`} style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[9px] font-extrabold text-gray-500 mt-1">{progress}%</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onOpenLogFood}
            className="w-full bg-[#12B886]/5 hover:bg-[#12B886]/10 text-emerald-500 text-xs font-bold py-2.5 rounded-xl border border-[#12B886]/10 flex items-center justify-center gap-1.5 transition mt-4"
          >
            🥗 Log Food
          </button>
        </div>

        {/* Quick Habit Logger Upgraded Card */}
        <div className="bg-[#0b0e14] text-[#ecefed] rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden select-none">
          {/* Subtle neon grid background accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight leading-none">Quick Habit Logger</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">1-TAP PROGRESS LOGGER</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-[#102a24] text-[#14b8a6] border border-[#14b8a6]/25 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full animate-ping" />
                <span>{remainingCount} remaining</span>
              </span>
              <span className="bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 fill-indigo-400 stroke-none" />
                <span>1-TAP</span>
              </span>
            </div>
          </div>

          {/* Time Block Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar select-none">
            {timeFilters.map((filter) => {
              const isSelected = activeFilter === filter.id;
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-300 border cursor-pointer whitespace-nowrap ${
                    isSelected ? filter.selectedClass : 'bg-[#121620] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? '' : 'text-slate-400'}`} />
                  <span>{filter.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress Comparison Row */}
          <div className="grid grid-cols-2 gap-4 bg-[#121620] border border-slate-800/60 rounded-2xl p-4 mb-4">
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <span>Yesterday</span><span>{yesterdayCompletionRate}%</span>
              </div>
              <div className="w-full bg-[#1b2234] h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-600 h-full rounded-full transition-all duration-500" style={{ width: `${yesterdayCompletionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  Today
                  {isAhead && <span className="text-[8px] text-emerald-400 uppercase tracking-wider font-black">↑ ahead</span>}
                </span>
                <span className="text-emerald-400 font-extrabold">{todayCompletionRate}%</span>
              </div>
              <div className="w-full bg-[#1b2234] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${todayCompletionRate}%` }} />
              </div>
            </div>
          </div>

          {/* Routines block matching the selected block */}
          {filteredRoutines.length > 0 && (
            <div className="mb-4 space-y-2.5">
              {filteredRoutines.map((routine) => {
                const { completed, total } = routineProgressCount(routine);
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const rMeta = getRoutineMetaForLogger(routine);
                const RoutineIcon = rMeta.lucideIcon;
                
                return (
                  <button
                    key={routine.id}
                    onClick={() => setActiveRoutineDetails(routine)}
                    className="group w-full bg-[#121620] hover:bg-[#151c2a] border border-slate-800/80 rounded-2xl px-3 py-2.5 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer shadow-sm relative overflow-hidden text-left"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: rMeta.accentColor }} />
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1.5">
                      <div
                        className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${rMeta.accentColor}16`, borderColor: `${rMeta.accentColor}34`, color: rMeta.accentColor }}
                      >
                        <RoutineIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-white truncate group-hover:opacity-90 transition-colors">
                            {routine.name}
                          </h4>
                          <span className="text-[10px] font-black font-mono shrink-0" style={{ color: rMeta.accentColor }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex-1">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: rMeta.accentColor }} />
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                            {completed}/{total} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border" style={{ color: rMeta.accentColor, borderColor: `${rMeta.accentColor}25`, backgroundColor: `${rMeta.accentColor}10` }}>
                        {rMeta.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Individual Habits List Header */}
          <div className="flex justify-between items-center mb-3 select-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Individual Habits
            </span>
            <span className="text-[9px] text-slate-500 font-semibold italic">
              Tap ◯ to complete instantly
            </span>
          </div>

          {/* Individual Habits list cards */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
            {filteredHabits.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic bg-[#121620]/40 rounded-2xl border border-slate-800/40">
                No active standalone habits in this filter.
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const val = habit.history[dateToday] || 0;
                const isCompleted = val >= habit.target;
                const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;
                const hMeta = getCategoryMetaForLogger(habit.category);
                const IconComponent = hMeta.lucideIcon;

                const timeBlockMeta = habit.timeBlock ? {
                  emoji: habit.timeBlock === 'Morning' ? '☀️' : habit.timeBlock === 'Afternoon' ? '🌤️' : habit.timeBlock === 'Evening' ? '🌆' : '🌙',
                  borderColor: habit.timeBlock === 'Morning' ? 'border-amber-500/30 bg-amber-500/10' : habit.timeBlock === 'Afternoon' ? 'border-yellow-500/30 bg-yellow-500/10' : habit.timeBlock === 'Evening' ? 'border-orange-500/30 bg-orange-500/10' : 'border-purple-500/30 bg-purple-500/10'
                } : null;
                
                return (
                  <div
                    key={habit.id}
                    className="group bg-[#121620] rounded-2xl p-2 sm:p-3 border border-slate-850 hover:border-slate-700/60 transition-all duration-300 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden select-none cursor-pointer"
                    onClick={() => handleQuickLog(habit.id)}
                  >
                    {/* Solid Vertical Accent Bar on the Left Edge */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                      style={{ backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor }}
                    />

                    {/* Content Row: Align all elements horizontally on a single line */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pl-1.5">
                      {/* Category Icon Circle */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300"
                        style={{
                          backgroundColor: isCompleted ? '#10b98115' : hMeta.bgColor,
                          borderColor: isCompleted ? '#10b98130' : hMeta.borderColor,
                          color: isCompleted ? '#10b981' : hMeta.accentColor,
                        }}
                      >
                        <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </div>
                      
                      {/* Title & Category with timeblock column */}
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm sm:text-base font-bold truncate leading-tight tracking-tight ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                          {habit.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className="text-[10px] sm:text-[11px] font-extrabold tracking-wide leading-none"
                            style={{ color: isCompleted ? '#10b981' : hMeta.accentColor }}
                          >
                            {hMeta.label}
                          </span>
                          
                          {timeBlockMeta && (
                            <span className={`w-5 h-5 rounded flex items-center justify-center border leading-none shrink-0 ${timeBlockMeta.borderColor}`}>
                              <span className="text-[11px]">{timeBlockMeta.emoji}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle-Right Column: Compact Fraction Progress & Mini Bar */}
                      <div className="flex flex-col items-start shrink-0 w-14 sm:w-16">
                        <div className="flex items-baseline justify-between w-full">
                          <span className="text-xs font-black font-mono leading-none" style={{ color: isCompleted ? '#10b981' : hMeta.accentColor }}>
                            {val}/{habit.target}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 leading-none">
                            {pct}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                          {habit.unit || 'reps'}
                        </span>
                        
                        {/* Compact Horizontal mini progress line track */}
                        <div className="w-full bg-[#1b2234] h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: One-tap complete circle. Clicking the row OR this button both fire the same one-tap action. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLog(habit.id);
                      }}
                      aria-label={isCompleted ? `Undo ${habit.name}` : `Complete ${habit.name}`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-300 relative shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10 active:scale-95'
                          : 'bg-[#12141C] border-[#232734] hover:border-emerald-500/40 text-transparent active:scale-95'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3px]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-800/80 group-hover:border-slate-700 transition-all" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        </div> {/* End Left Column */}

        {/* Right Column: Today's Focus, Pillars, Routines, and Quote */}
        <div className="lg:col-span-5 space-y-6">

          {/* Today's Focus List */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 select-none">
              <div>
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Today Focus</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Highest-leverage actions for the next 24 hours</p>
              </div>
              <button onClick={() => setTab('today')} className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition">
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {focusRoutines.map((routine) => {
                const { completed, total } = routineProgressCount(routine);
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const rMeta = getRoutineMetaForLogger(routine);
                const RoutineIcon = rMeta.lucideIcon;
                return (
                  <button
                    key={routine.id}
                    className="w-full text-left rounded-2xl border border-gray-100 bg-slate-50/70 p-3 flex items-center gap-3 relative overflow-hidden cursor-pointer hover:border-slate-200 transition"
                    onClick={() => setActiveRoutineDetails(routine)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: rMeta.accentColor }} />
                    <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${rMeta.accentColor}12`, borderColor: `${rMeta.accentColor}26`, color: rMeta.accentColor }}>
                      <RoutineIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-[#0F172A] truncate">{routine.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Routine / {completed} of {total} complete</p>
                    </div>
                    <span className="text-xs font-black font-mono" style={{ color: rMeta.accentColor }}>{pct}%</span>
                  </button>
                );
              })}

              {importantHabits.map((habit) => {
                const progressVal = habit.history[dateToday] || 0;
                const isCompleted = progressVal >= habit.target;
                const hMeta = getCategoryMetaForLogger(habit.category);
                const HabitIcon = hMeta.lucideIcon;
                return (
                  <button
                    key={habit.id}
                    className="w-full bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer relative overflow-hidden hover:border-gray-200 transition text-left"
                    onClick={() => handleQuickLog(habit.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: isCompleted ? '#10B981' : hMeta.accentColor }} />
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${hMeta.accentColor}12`, borderColor: `${hMeta.accentColor}26`, color: hMeta.accentColor }}>
                        <HabitIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-black truncate ${isCompleted ? 'line-through text-gray-400' : 'text-[#0F172A]'}`}>{habit.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-bold">{hMeta.label} / {habit.target} {habit.unit}</p>
                      </div>
                    </div>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${
                      isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent'
                    }`}>
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </span>
                  </button>
                );
              })}

              {focusRoutines.length === 0 && importantHabits.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400 font-semibold bg-slate-50 rounded-2xl border border-gray-100">
                  All clear for now. Add a focused habit from the + button.
                </div>
              )}
            </div>
          </div>
        {/* Pillars Overview Grid — now reflects real habit + routine completion */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Pillars Overview</h3>
            <button onClick={() => setTab('progress')} className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition">
              See Details
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {pillarDetails.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div key={pillar.name} className="flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${pillar.meta.soft} ${pillar.meta.border} ${pillar.meta.text}`}>
                    <PillarIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-[#0F172A] mt-2">{pillar.name}</span>
                  <span className="text-xs font-black mt-0.5" style={{ color: pillar.meta.accent }}>{pillar.value}%</span>
                  <div className="w-8 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pillar.value}%`, backgroundColor: pillar.meta.accent }} />
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1">{pillar.items} item{pillar.items === 1 ? '' : 's'}</span>
                  <span className="text-[8px] font-black mt-0.5" style={{ color: pillar.meta.accent }}>{pillar.goals} goal{pillar.goals === 1 ? '' : 's'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {pillarGoals.length > 0 && (
          <div className="bg-[#0F172A] rounded-2xl p-5 border border-slate-800 shadow-sm text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">90-Day Goals</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pinned by pillar</p>
              </div>
              <button onClick={onOpenCreateModal} className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition">
                Add Goal
              </button>
            </div>
            <div className="space-y-2.5">
              {pillarGoals.slice(0, 4).map((goal) => {
                const meta = PILLAR_META[goal.pillar];
                const GoalIcon = getPillarIcon(goal.pillar);
                return (
                  <div key={goal.id} className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.accent }} />
                    <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.accent}14`, borderColor: `${meta.accent}28`, color: meta.accent }}>
                      <GoalIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black truncate">{goal.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">{goal.target || goal.desc}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border" style={{ color: meta.accent, borderColor: `${meta.accent}24`, backgroundColor: `${meta.accent}10` }}>
                      {goal.pillar}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Routines Section */}
        <div>
          <div className="flex justify-between items-center mb-3 select-none">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Upcoming Routines</h3>
            <button onClick={() => setTab('today')} className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition">
              View Day
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Morning', title: 'Morning', time: '6:00 AM' },
              { id: 'Afternoon', title: 'Afternoon', time: '12:00 PM' },
              { id: 'Evening', title: 'Evening', time: '5:00 PM' },
              { id: 'Night', title: 'Night', time: '9:00 PM' },
            ].map((block) => {
              const count = routines.filter(r => r.timeBlock === block.id).length;
              return (
                <div
                  key={block.id}
                  onClick={() => setTab('today')}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{block.title}</h4>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{block.time}</p>
                    </div>
                    <span className="text-lg">
                      {block.id === 'Morning' ? '☀️' : block.id === 'Afternoon' ? '🌤️' : block.id === 'Evening' ? '🌆' : '🌙'}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {count} routine{count === 1 ? '' : 's'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mountain Quote Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4 relative overflow-hidden select-none">
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <svg className="w-24 h-24 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
            </svg>
          </div>
          <div className="bg-emerald-500/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg">⛰️</span>
          </div>
          <div>
            <p className="text-[#099268] text-[11px] font-extrabold italic leading-relaxed">
              "Discipline today, freedom tomorrow."
            </p>
            <p className="text-gray-405 text-[9px] font-bold uppercase tracking-wider mt-1">- Unknown Author</p>
          </div>
        </div>

          </div> {/* End Right Column */}
        </div> {/* End Grid Wrapper */}
      </div> {/* End Main Responsive Container */}

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
              selectedDate={dateToday}
              onLogHabit={onLogHabit}
              onMarkRoutineDone={handleMarkRoutineDone}
              onEditRoutine={onNavigateToRoutine}
              onRefresh={onRefresh}
            />
          );
        })()}
      </AnimatePresence>

    </div>
  );
}