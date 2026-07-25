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
  Brain,
  Star,
  X,
  RotateCcw,
  Droplet,
  ArrowUpRight,
} from 'lucide-react';
import { Habit, Routine, Category, PillarGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import RoutineDetailsModal from './RoutineDetailsModal';
import InlinePillarView from './InlinePillarView';
import type { LoggedFood } from './DietScreen';
import { PILLAR_META } from '../lib/pillars';
import { getDietPreferences, saveDietPreferences, getWaterIntakeForDate, addWaterIntakeForDate } from '../lib/dietPreferences';

interface HomeScreenProps {
  habits: Habit[];
  routines: Routine[];
  userPoints: number;
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onBatchLogHabits?: (updates: { id: string; value: number }[]) => Promise<void>;
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
  onUpdateNutritionTargets?: (targets: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  }) => void;
  // NEW: today's actual food entries + remove handler, so the diet card can act as a real log
  todaysFoodLog?: LoggedFood[];
  onRemoveFood?: (id: string) => void;
  onOpenLogFood: () => void;
  onOpenCreateModal: () => void;
  onRefresh?: () => Promise<void>;
  pillarGoals?: PillarGoal[];
  focusedHabitIds?: string[];
  onToggleFocusHabit?: (habitId: string) => void;
  onResetDietProgress?: () => void;
}

export default function HomeScreen({
  habits,
  routines,
  userPoints,
  dateToday,
  onLogHabit,
  onBatchLogHabits,
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
  focusedHabitIds = [],
  onToggleFocusHabit,
  onUpdateNutritionTargets,
  onResetDietProgress,
}: HomeScreenProps) {
  const [editingTargetKey, setEditingTargetKey] = useState<'protein' | 'calories' | 'water' | null>(null);
  const [targetInputValue, setTargetInputValue] = useState<string>('');
  const [waterMlState, setWaterMlState] = useState<number>(() => getWaterIntakeForDate(dateToday));

  const handleQuickWaterAddHome = (amountMl: number) => {
    const updated = addWaterIntakeForDate(dateToday, amountMl);
    setWaterMlState(updated);
  };

  const computeHabitStreak = (habit: Habit): number => {
    let streak = 0;
    const d = new Date(dateToday);
    const valToday = habit.history[dateToday] || 0;
    if (valToday >= habit.target) {
      streak++;
    }
    d.setDate(d.getDate() - 1);

    for (let i = 0; i < 30; i++) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const val = habit.history[dateStr] || 0;
      if (val >= habit.target) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleSaveTargetFromHome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(0, parseFloat(targetInputValue) || 0);
    if (editingTargetKey === 'protein' || editingTargetKey === 'calories') {
      if (onUpdateNutritionTargets) {
        onUpdateNutritionTargets({
          ...targets,
          [editingTargetKey]: val,
        });
      }
    } else if (editingTargetKey === 'water') {
      const prefs = getDietPreferences();
      saveDietPreferences({
        ...prefs,
        waterGoalMl: Math.round(val * 1000),
      });
    }
    setEditingTargetKey(null);
  };

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
  
  // State for active Pillar Details modal popup on HomeScreen
  const [selectedPillar, setSelectedPillar] = useState<Category | null>(null);

  // Toast notification state for celebrations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper: check off all habits in a routine instantly from HomeScreen
  const handleMarkRoutineDone = async (routine: Routine) => {
    try {
      const updates: { id: string; value: number }[] = [];
      for (const hId of routine.habitIds) {
        const h = habits.find(habit => habit.id === hId);
        if (h) {
          const val = h.history[dateToday] || 0;
          if (val < h.target) {
            updates.push({ id: h.id, value: h.target - val });
          }
        }
      }
      if (updates.length > 0) {
        if (onBatchLogHabits) {
          await onBatchLogHabits(updates);
        } else {
          for (const u of updates) {
            onLogHabit(u.id, u.value);
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

  // Helper for Weekly Overview Mon-Sun bar
  const getWeekDaysData = () => {
    try {
      const d = new Date(dateToday);
      const currentDayOfWeek = d.getDay();
      const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + distanceToMon);

      const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      return daysLabels.map((shortLabel, i) => {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        const yyyy = dayDate.getFullYear();
        const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dayDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayNum = dayDate.getDate();

        let completionPct = 0;
        if (habits.length > 0) {
          const done = habits.filter(h => (h.history[dateStr] || 0) >= h.target).length;
          completionPct = Math.round((done / habits.length) * 100);
        }

        return {
          shortLabel,
          dayNum,
          dateStr,
          completionPct,
          isToday: dateStr === dateToday,
        };
      });
    } catch (e) {
      return [];
    }
  };

  const weekDaysList = getWeekDaysData();
  const weeklyAverage = weekDaysList.length > 0 
    ? Math.round(weekDaysList.reduce((acc, d) => acc + d.completionPct, 0) / 7) 
    : 0;

  // Dynamic motivational tagline based on day, streak & score
  const getDynamicTagline = (): string => {
    if (currentDay === 1) return '🚀 Day 1. The journey of 90 starts now.';
    if (currentDay <= 7) return `⚡ Week 1 — build the foundation. ${7 - currentDay + 1} days left this week.`;
    if (currentDay === 45) return '🔥 Halfway through. 45 days in. Don\'t blink now.';
    if (currentDay >= 85) return `🏁 ${90 - currentDay} days to go. Finish like a champion.`;
    if (currentDay === 90) return '🏆 Day 90. You did it. Lock-in complete.';
    if (dayStreak >= 7 && todayScore >= 80) return `🔥 ${dayStreak}-day streak & ${todayScore}% today — you\'re locked in.`;
    if (todayScore === 100) return '✅ Perfect day. Every habit crushed. Stay the course.';
    if (todayScore === 0) return '💪 Nothing done yet. Start with one habit — build momentum.';
    if (dayStreak === 0) return '⚠️ Streak broken. Reset starts today. Go.';
    if (currentDay <= 30) return `📅 Day ${currentDay} — early days shape the whole 90. Stay consistent.`;
    if (currentDay <= 60) return `🧱 Day ${currentDay} — you\'re in the grind phase. Don\'t let up.`;
    return `💡 Day ${currentDay} — every rep today compounds into who you become.`;
  };

  // Dynamic badges — only show pillars scoring ≥ 80% today
  const PILLAR_BADGE_CONFIG = [
    { pillar: 'Fitness' as const,   emoji: '🏋️', label: 'Titan',     color: 'emerald' },
    { pillar: 'Nutrition' as const, emoji: '🥗', label: 'Clean Fuel', color: 'amber'   },
    { pillar: 'Career' as const,    emoji: '💼', label: 'Focus Ninja',color: 'blue'    },
    { pillar: 'Recovery' as const,  emoji: '🌙', label: 'Zen Rest',   color: 'purple'  },
    { pillar: 'Mind' as const,      emoji: '🧘', label: 'Mind Sharp', color: 'rose'    },
  ] as const;

  const earnedBadges = PILLAR_BADGE_CONFIG.filter(b => getPillarStats(b.pillar) >= 80);

  const BADGE_COLORS: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

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
      showToast(`🔥 Mastered "${targetHabit.name}"! +${targetHabit.points} pts`);
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

  // Only show a routine in Today's Focus if the user has explicitly pinned
  // at least one of its habits via the star/focus toggle in the Today tab.
  const focusRoutines = routines
    .filter((routine) => {
      const hasPinnedHabit = routine.habitIds.some(id => focusedHabitIds.includes(id));
      if (!hasPinnedHabit) return false;
      const { completed, total } = routineProgressCount(routine);
      return total > 0 && completed < total;
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

  // Habits pinned by user as "Today's Focus" (starred in Today screen)
  const userPinnedHabits = standaloneHabits.filter(h => focusedHabitIds.includes(h.id));

  // focusList = pinned first, then auto-priority if no pinned
  const focusList: typeof standaloneHabits = userPinnedHabits.length > 0
    ? userPinnedHabits
    : importantHabits.slice(0, 5);  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Charan';

  return (
    <div className="w-full bg-[#F8F9FC] text-[#1E293B] flex flex-col font-sans pb-12 relative">
      
      {/* Header Bar */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between select-none max-w-6xl mx-auto w-full">
        <div>
          <p className="text-gray-400 text-xs font-semibold tracking-wide">Good morning, {userName} 👋</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5">Let's win today.</h1>
        </div>
        <div className="relative cursor-pointer active:scale-95 transition-transform">
          <div className="bg-white p-2.5 rounded-full border border-gray-150 shadow-sm">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        </div>
      </div>

      {/* Main Single Column Container matching user's exact requested layout */}
      <div className="flex-1 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
         {/* FLOATING CELEBRATION TOAST */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] border border-emerald-500/40 text-emerald-400 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 select-none"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 1. HERO SECTION */}
        <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                90-Day Lock-In Mission
              </span>
              <h2 className="text-3xl font-black mt-3 tracking-tight font-sans">
                Day {currentDay} <span className="text-slate-400 text-xl font-normal">/ 90</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 font-medium max-w-[260px] leading-relaxed">
                {getDynamicTagline()}
              </p>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
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
                <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold">Progress</span>
              </div>
            </div>
          </div>

          {/* 90-Day Heatmap Consistency Grid */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">90-Day Matrix Heatmap</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">Day {currentDay} active</span>
            </div>
            <div className="grid grid-cols-15 gap-1">
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isPassed = dayNum <= currentDay;
                const isToday = dayNum === currentDay;

                return (
                  <div
                    key={idx}
                    title={`Day ${dayNum}`}
                    className={`h-2.5 rounded-sm transition-all ${
                      isToday 
                        ? 'bg-emerald-400 ring-2 ring-emerald-400/50 animate-pulse' 
                        : isPassed 
                        ? 'bg-emerald-600/80' 
                        : 'bg-slate-800/60'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. QUICK STATS ROW */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <div className="bg-orange-500/10 p-1 rounded-md text-orange-500 shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-extrabold text-[#0F172A] leading-none block">{dayStreak}</span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Streak</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <div className="bg-emerald-500/10 p-1 rounded-md text-emerald-500 shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-extrabold text-[#0F172A] leading-none block">{todayScore}%</span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Score</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <div className="bg-blue-500/10 p-1 rounded-md text-blue-500 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-extrabold text-[#0F172A] leading-none block">{userPoints}</span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Total Pts</span>
            </div>
          </div>
        </div>

        {/* WEEKLY PERFORMANCE OVERVIEW BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-sm space-y-3 select-none">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Weekly Overview</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Mon - Sun Consistency Bar</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                Weekly Avg: {weeklyAverage}%
              </span>
            </div>
          </div>

          {/* 7-Day Mon - Sun Progress Bar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDaysList.map((dayItem) => (
              <div
                key={dayItem.dateStr}
                className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                  dayItem.isToday
                    ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/40'
                    : 'bg-slate-50/70 border-slate-150 text-slate-700'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">{dayItem.shortLabel}</span>
                <span className={`text-xs sm:text-sm font-extrabold my-1 ${dayItem.isToday ? 'text-white' : 'text-slate-800'}`}>
                  {dayItem.dayNum}
                </span>
                <div className="w-full bg-gray-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      dayItem.completionPct >= 80 ? 'bg-emerald-500' : dayItem.completionPct >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${dayItem.completionPct}%` }}
                  />
                </div>
                <span className={`text-[8px] font-mono font-bold mt-1 ${dayItem.isToday ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {dayItem.completionPct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PILLAR MASTERY BADGES STRIP — dynamic, earned only when pillar ≥ 80% today */}
        <div className="bg-slate-900 rounded-2xl px-3.5 py-3 border border-slate-800 text-white flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">Today's Badges:</span>
          {earnedBadges.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic font-semibold">
              Hit 80%+ on any pillar to unlock a badge 🏅
            </span>
          ) : (
            earnedBadges.map(b => (
              <span
                key={b.pillar}
                className={`${BADGE_COLORS[b.color]} text-[10px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 shrink-0`}
              >
                {b.emoji} {b.label}
              </span>
            ))
          )}
        </div>

        {/* 3. TODAY'S FOCUS */}
        <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight leading-none">Today's Focus</h3>
                <p className="text-[9px] text-amber-400/80 font-semibold mt-1 uppercase tracking-wider">
                  {userPinnedHabits.length > 0 
                    ? `${userPinnedHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length}/${userPinnedHabits.length} PINNED COMPLETED` 
                    : 'TOP HIGH-PRIORITY TARGETS'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab('today')}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 cursor-pointer"
            >
              <span>Manage Focus</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Incomplete focus routines */}
            {focusRoutines.map((routine) => {
              const { completed, total } = routineProgressCount(routine);
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const rMeta = getRoutineMetaForLogger(routine);
              const RoutineIcon = rMeta.lucideIcon;
              return (
                <button
                  key={routine.id}
                  className="w-full text-left rounded-2xl border border-amber-500/20 bg-slate-800/80 p-3 flex items-center gap-3 relative overflow-hidden cursor-pointer hover:border-amber-400/50 transition"
                  onClick={() => setActiveRoutineDetails(routine)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: rMeta.accentColor }} />
                  <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${rMeta.accentColor}18`, borderColor: `${rMeta.accentColor}36`, color: rMeta.accentColor }}>
                    <RoutineIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate">{routine.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Routine · {completed} of {total} complete</p>
                  </div>
                  <span className="text-xs font-black font-mono" style={{ color: rMeta.accentColor }}>{pct}%</span>
                </button>
              );
            })}

            {/* Pinned / priority focus habits */}
            {focusList.length === 0 && focusRoutines.length === 0 ? (
              <div className="text-center py-6 text-xs text-amber-400/70 italic bg-amber-500/5 rounded-2xl border border-amber-500/10">
                No focus habits pinned yet. Star any habit in Today tab to pin it here!
              </div>
            ) : (
              focusList.map((habit) => {
                const val = habit.history[dateToday] || 0;
                const isCompleted = val >= habit.target;
                const isPinned = focusedHabitIds.includes(habit.id);
                const hMeta = getCategoryMetaForLogger(habit.category);
                const IconComp = hMeta.lucideIcon;
                const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;

                return (
                  <div
                    key={habit.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700/60 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {habit.name}
                          </h4>
                          {onToggleFocusHabit && (
                            <button
                              type="button"
                              onClick={() => onToggleFocusHabit(habit.id)}
                              title={isPinned ? "Unpin from Focus" : "Pin to Focus"}
                              className="text-amber-400 p-0.5 rounded transition hover:scale-110 active:scale-90 cursor-pointer"
                            >
                              <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : 'text-slate-500'}`} />
                            </button>
                          )}
                          {(() => {
                            const streak = computeHabitStreak(habit);
                            return (
                              <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                🔥 {streak}d streak
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">
                            {val}/{habit.target} {habit.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickLog(habit.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-400 bg-slate-800'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : <div className="w-4 h-4 rounded-full border border-slate-500" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. DIET LOGGER */}
        {(() => {
          const dietPrefs = getDietPreferences();
          const waterMlToday = getWaterIntakeForDate(dateToday);
          const mealsCountToday = todaysFoodLog.length;

          const macroStyles: Record<string, { bg: string; border: string; labelColor: string; valColor: string; bar: string }> = {
            calories: {
              bg: 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/5',
              border: 'border-amber-500/30',
              labelColor: 'text-amber-600 font-extrabold',
              valColor: 'text-amber-950 font-black',
              bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
            },
            protein: {
              bg: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/5',
              border: 'border-emerald-500/30',
              labelColor: 'text-emerald-600 font-extrabold',
              valColor: 'text-emerald-950 font-black',
              bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
            },
            water: {
              bg: 'bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-cyan-500/5',
              border: 'border-sky-500/30',
              labelColor: 'text-sky-600 font-extrabold',
              valColor: 'text-sky-950 font-black',
              bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
            },
            meals: {
              bg: 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-indigo-500/5',
              border: 'border-purple-500/30',
              labelColor: 'text-purple-600 font-extrabold',
              valColor: 'text-purple-950 font-black',
              bar: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
            },
            carbs: {
              bg: 'bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-indigo-500/5',
              border: 'border-blue-500/30',
              labelColor: 'text-blue-600 font-extrabold',
              valColor: 'text-blue-950 font-black',
              bar: 'bg-gradient-to-r from-blue-400 to-indigo-500',
            },
            fats: {
              bg: 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-pink-500/5',
              border: 'border-rose-500/30',
              labelColor: 'text-rose-600 font-extrabold',
              valColor: 'text-rose-950 font-black',
              bar: 'bg-gradient-to-r from-rose-400 to-pink-500',
            },
            fiber: {
              bg: 'bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-purple-500/5',
              border: 'border-indigo-500/30',
              labelColor: 'text-indigo-600 font-extrabold',
              valColor: 'text-indigo-950 font-black',
              bar: 'bg-gradient-to-r from-indigo-400 to-violet-500',
            },
          };

          const activeMetrics: { key: string; label: string; value: number | string; target?: number | string; targetRaw?: number; unit: string; canEditTarget?: boolean }[] = [];

          if (dietPrefs.showCalories) {
            activeMetrics.push({ key: 'calories', label: 'Calories', value: nutritionToday.calories, target: targets.calories, targetRaw: targets.calories, unit: 'kcal', canEditTarget: true });
          }
          if (dietPrefs.showProtein) {
            activeMetrics.push({ key: 'protein', label: 'Protein', value: nutritionToday.protein, target: targets.protein, targetRaw: targets.protein, unit: 'g', canEditTarget: true });
          }
          if (dietPrefs.showWater) {
            activeMetrics.push({ key: 'water', label: 'Water', value: (waterMlToday / 1000).toFixed(1), target: (dietPrefs.waterGoalMl / 1000).toFixed(1), targetRaw: dietPrefs.waterGoalMl / 1000, unit: 'L', canEditTarget: true });
          }
          if (dietPrefs.showMeals) {
            activeMetrics.push({ key: 'meals', label: 'Meals', value: mealsCountToday, target: dietPrefs.mealsGoal, unit: 'meals' });
          }
          if (dietPrefs.showCarbs) {
            activeMetrics.push({ key: 'carbs', label: 'Carbs', value: nutritionToday.carbs, target: targets.carbs, unit: 'g' });
          }
          if (dietPrefs.showFats) {
            activeMetrics.push({ key: 'fats', label: 'Fats', value: nutritionToday.fats, target: targets.fats, unit: 'g' });
          }
          if (dietPrefs.showFiber) {
            activeMetrics.push({ key: 'fiber', label: 'Fiber', value: nutritionToday.fiber, target: targets.fiber, unit: 'g' });
          }

          const displayMetrics = activeMetrics.length > 0 ? activeMetrics : [
            { key: 'calories', label: 'Calories', value: nutritionToday.calories, target: targets.calories, targetRaw: targets.calories, unit: 'kcal', canEditTarget: true },
            { key: 'protein', label: 'Protein', value: nutritionToday.protein, target: targets.protein, targetRaw: targets.protein, unit: 'g', canEditTarget: true },
          ];

          return (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0F172A] tracking-tight leading-none">Diet Logger</h3>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">DAILY NUTRITION & HYDRATION</p>
                  </div>
                </div>
                {onResetDietProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset today's diet log and water progress to 0?")) {
                        onResetDietProgress();
                        setWaterMlState(0);
                      }
                    }}
                    className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Reset today's food log & water to 0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>RESET</span>
                  </button>
                )}
              </div>

              {/* Dynamic Colorful Metric Cards */}
              <div className={`grid gap-2.5 text-center ${displayMetrics.length <= 2 ? 'grid-cols-2' : displayMetrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {displayMetrics.map((macro) => {
                  const style = macroStyles[macro.key] || macroStyles.calories;
                  const numVal = typeof macro.value === 'number' ? macro.value : parseFloat(String(macro.value)) || 0;
                  const numTarget = typeof macro.target === 'number' ? macro.target : parseFloat(String(macro.target)) || 1;
                  const progress = Math.min(100, Math.round((numVal / Math.max(0.1, numTarget)) * 100));

                  return (
                    <div key={macro.label} className={`${style.bg} ${style.border} p-3 rounded-2xl border flex flex-col items-center justify-between relative group transition-all duration-300 hover:shadow-xs`}>
                      <div className="w-full flex items-center justify-between">
                        <span className={`text-[9px] uppercase tracking-widest ${style.labelColor}`}>{macro.label}</span>
                        {macro.canEditTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTargetKey(macro.key as 'protein' | 'calories' | 'water');
                              setTargetInputValue(String(macro.targetRaw ?? macro.target ?? ''));
                            }}
                            className="p-0.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title={`Edit ${macro.label} Target`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </button>
                        )}
                      </div>

                      <span className={`text-sm font-black my-1 ${style.valColor}`}>
                        {macro.value}<span className="text-[9px] font-normal text-slate-400 ml-0.5">{macro.unit}</span>
                      </span>
                      {macro.target !== undefined && (
                        <span className="text-[8px] font-mono text-slate-400 font-semibold">/ {macro.target}{macro.unit}</span>
                      )}
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className={`${style.bar} h-full rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Hydration Log & Status Bar */}
              {dietPrefs.showWater && (
                <div className="mt-3 p-3 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 rounded-2xl border border-sky-200/80 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                      <Droplet className="w-4 h-4 fill-sky-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-sky-950">{(waterMlToday / 1000).toFixed(1)}L / {(dietPrefs.waterGoalMl / 1000).toFixed(1)}L</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 text-sky-700 border border-sky-200 shadow-2xs">
                          💧 {Math.min(100, Math.round((waterMlToday / dietPrefs.waterGoalMl) * 100))}% Hydrated {waterMlToday >= dietPrefs.waterGoalMl ? '- On Track!' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleQuickWaterAddHome(250)}
                      className="px-2.5 py-1 bg-white hover:bg-sky-100 text-sky-700 text-[10px] font-extrabold rounded-xl border border-sky-200 shadow-2xs transition cursor-pointer active:scale-95"
                    >
                      +250ml
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickWaterAddHome(500)}
                      className="px-3 py-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-[10px] font-extrabold rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                    >
                      +500ml
                    </button>
                  </div>
                </div>
              )}

              {/* Log Food Button */}
              <div className="mt-3.5">
                <button
                  onClick={onOpenLogFood}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black py-3 rounded-2xl shadow-md shadow-emerald-600/20 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Apple className="w-4 h-4" />
                  <span>🥗 Quick Log Food</span>
                </button>
              </div>

              {/* Target Editing Modal */}
              {editingTargetKey && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xs w-full shadow-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                        Edit {editingTargetKey === 'protein' ? 'Protein Goal (g)' : editingTargetKey === 'calories' ? 'Calories Goal (kcal)' : 'Water Goal (L)'}
                      </h3>
                      <button onClick={() => setEditingTargetKey(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTargetFromHome} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">New Target Goal</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={targetInputValue}
                          onChange={(e) => setTargetInputValue(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingTargetKey(null)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/15 cursor-pointer"
                        >
                          Save Target
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 5. QUICK HABIT LOGGER */}
        <div className="bg-[#0b0e14] text-[#ecefed] rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden select-none">
          {/* Subtle neon background accents */}
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
                    {/* Solid Vertical Accent Bar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                      style={{ backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor }}
                    />

                    {/* Content Row */}
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
                      
                      {/* Title & Category */}
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

                      {/* Compact Fraction Progress & Mini Bar */}
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
                        
                        <div className="w-full bg-[#1b2234] h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* 1-tap complete circle button */}
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

        {/* 6. PILLARS OVERVIEW */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Pillars Overview</h3>
            <button onClick={() => setTab('progress')} className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition cursor-pointer">
              See Details
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {pillarDetails.map((pillar) => {
              const PillarIcon = pillar.icon;
              const isSelected = selectedPillar === pillar.name;
              return (
                <button
                  key={pillar.name}
                  type="button"
                  onClick={() => setSelectedPillar(prev => prev === pillar.name ? null : pillar.name)}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 group cursor-pointer active:scale-95 relative overflow-hidden text-left ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-emerald-500/50 shadow-md' 
                      : 'bg-slate-50/70 hover:bg-white border-slate-150 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${pillar.meta.soft} ${pillar.meta.border} ${pillar.meta.text}`}>
                      <PillarIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-[#0F172A]'}`}>{pillar.name}</span>
                        <span className="text-xs font-black font-mono shrink-0" style={{ color: pillar.meta.accent }}>{pillar.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pillar.value}%`, backgroundColor: pillar.meta.accent }} />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-1">
                        <span>{pillar.items} items · {pillar.goals} goals</span>
                        <span className="text-[8px] font-black uppercase" style={{ color: pillar.meta.accent }}>
                          {isSelected ? 'Active' : 'Tap ➔'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* INLINE PILLAR COMMAND VIEW */}
          {selectedPillar && (
            <InlinePillarView
              pillar={selectedPillar}
              onClose={() => setSelectedPillar(null)}
              onSelectPillar={(p) => setSelectedPillar(p)}
              habits={habits}
              routines={routines}
              pillarGoals={pillarGoals}
              dateToday={dateToday}
              onLogHabit={onLogHabit}
              onBatchLogHabits={onBatchLogHabits}
              onOpenCreateModal={onOpenCreateModal}
              nutritionToday={nutritionToday}
              nutritionTargets={nutritionTargets}
              todaysFoodLog={todaysFoodLog}
              onRemoveFood={onRemoveFood}
              onOpenLogFood={onOpenLogFood}
            />
          )}

          {/* 90-Day Goals by Pillar */}
          {pillarGoals.length > 0 && (
            <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm text-white mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">90-Day Goals</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pinned by pillar</p>
                </div>
                <button onClick={onOpenCreateModal} className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition cursor-pointer">
                  + Add Goal
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

          {/* Mountain Quote Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-4 relative overflow-hidden select-none">
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
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mt-1">- Unknown Author</p>
            </div>
          </div>
        </div>

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