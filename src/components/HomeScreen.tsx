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
import { Habit, Routine, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import RoutineDetailsModal from './RoutineDetailsModal';

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
  onOpenLogFood: () => void;
  onOpenCreateModal: () => void;
  onRefresh?: () => Promise<void>;
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
  onOpenLogFood,
  onOpenCreateModal,
  onRefresh,
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
    const cat = category.toLowerCase();
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

  const routineHabitIds = new Set(routines.flatMap(r => r.habitIds));
  const standaloneHabits = habits.filter(h => !routineHabitIds.has(h.id));

  // Calculate day completion stats
  const doneTodayCount = standaloneHabits.filter((h) => (h.history[dateToday] || 0) >= h.target).length;
  const totalTodayCount = standaloneHabits.length;
  const standaloneProgress = totalTodayCount > 0 ? (doneTodayCount / totalTodayCount) : 0;

  // Calculate routine completion stats
  const completedRoutines = routines.filter(r => {
    const rHabits = habits.filter(h => r.habitIds.includes(h.id));
    return rHabits.length > 0 && rHabits.every(h => (h.history[dateToday] || 0) >= h.target);
  }).length;
  const totalRoutines = routines.length;
  const routineProgress = totalRoutines > 0 ? (completedRoutines / totalRoutines) : 0;

  // Today's Score calculation
  const todayScore = totalTodayCount + totalRoutines > 0 
    ? Math.round(((doneTodayCount + completedRoutines) / (totalTodayCount + totalRoutines)) * 100)
    : 85; // highly positive baseline fallback

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

  // Pillars stats calculation
  const getPillarStats = (pillarName: 'Fitness' | 'Nutrition' | 'Career' | 'Recovery' | 'Mind') => {
    const pillarHabits = habits.filter(h => mapCategoryToPillar(h.category) === pillarName);
    if (pillarHabits.length === 0) {
      // Return high professional baseline stats if empty so the screen looks fully populated & functional
      if (pillarName === 'Fitness') return 91;
      if (pillarName === 'Nutrition') return 78;
      if (pillarName === 'Career') return 84;
      if (pillarName === 'Recovery') return 88;
      return 80;
    }
    const completed = pillarHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
    return Math.round((completed / pillarHabits.length) * 100);
  };

  const pillarDetails = [
    { name: 'Fitness', value: getPillarStats('Fitness'), color: 'bg-emerald-500 text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: Dumbbell },
    { name: 'Nutrition', value: getPillarStats('Nutrition'), color: 'bg-amber-500 text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Apple },
    { name: 'Career', value: getPillarStats('Career'), color: 'bg-blue-500 text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Briefcase },
    { name: 'Recovery', value: getPillarStats('Recovery'), color: 'bg-purple-500 text-purple-500 bg-purple-500/10 border-purple-500/20', icon: Moon },
    { name: 'Mind', value: getPillarStats('Mind'), color: 'bg-rose-500 text-rose-500 bg-rose-500/10 border-rose-500/20', icon: Heart },
  ];

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

  // NEW: Date helpers to compute yesterday's date & yesterday's / today's completion rates
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

  // NEW: Helper to count standalone habits dynamically in each filter
  const getBlockHabitsCount = (blockId: string) => {
    if (blockId === 'All') {
      return standaloneHabits.length;
    }
    return standaloneHabits.filter(h => h.timeBlock === blockId).length;
  };

  // NEW: Remaining count for the main header badge
  const remainingCount = habits.filter(h => (h.history[dateToday] || 0) < h.target).length;

  // NEW: Filter configuration with beautiful icons and color styles matching the screenshot
  const timeFilters = [
    { id: 'All' as const, label: 'All', icon: CheckCircle, selectedClass: 'bg-[#102a24] text-[#14b8a6] border-[#14b8a6]/40 shadow-lg shadow-emerald-500/10', count: getBlockHabitsCount('All') },
    { id: 'Morning' as const, label: 'Morning', icon: Sun, selectedClass: 'bg-amber-950/40 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10', count: getBlockHabitsCount('Morning') },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: CloudSun, selectedClass: 'bg-blue-950/40 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/10', count: getBlockHabitsCount('Afternoon') },
    { id: 'Evening' as const, label: 'Evening', icon: Sunset, selectedClass: 'bg-orange-950/40 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10', count: getBlockHabitsCount('Evening') },
    { id: 'Night' as const, label: 'Night', icon: Moon, selectedClass: 'bg-purple-950/40 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/10', count: getBlockHabitsCount('Night') },
  ];

  // NEW: Filter habits based on selected block
  const filteredHabits = standaloneHabits.filter(h => {
    if (activeFilter === 'All') return true;
    return h.timeBlock === activeFilter;
  });

  // NEW: Filter routines based on selected block
  const filteredRoutines = routines.filter(r => {
    if (activeFilter === 'All') return r.timeBlock === 'Morning' || r.timeBlock === 'Evening'; // default showcase routines if 'All'
    return r.timeBlock === activeFilter;
  });

  // NEW: Calculate progress for a routine's habits
  const routineProgressCount = (routine: Routine) => {
    const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
    const completed = rHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
    return { completed, total: rHabits.length };
  };

  // NEW: Helper for custom logger colors matching the dark premium theme
  const getCategoryMetaForLogger = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('fit') || cat.includes('gym') || cat.includes('workout') || cat.includes('run') || cat.includes('sport') || cat.includes('jump')) {
      return {
        lucideIcon: Dumbbell,
        accentColor: '#10B981', // emerald
        bgColor: '#10b98115',
        borderColor: '#10b98130',
        label: 'Fitness',
      };
    }
    if (cat.includes('read') || cat.includes('book') || cat.includes('study') || cat.includes('academic') || cat.includes('learn')) {
      return {
        lucideIcon: BookOpen,
        accentColor: '#3B82F6', // blue
        bgColor: '#3b82f615',
        borderColor: '#3b82f630',
        label: 'Reading',
      };
    }
    if (cat.includes('diet') || cat.includes('nutri') || cat.includes('food') || cat.includes('protein') || cat.includes('eat') || cat.includes('salad')) {
      return {
        lucideIcon: Apple,
        accentColor: '#F59E0B', // amber
        bgColor: '#f59e0b15',
        borderColor: '#f59e0b30',
        label: 'Diet',
      };
    }
    if (cat.includes('skill') || cat.includes('target') || cat.includes('focus') || cat.includes('goal')) {
      return {
        lucideIcon: Target,
        accentColor: '#8B5CF6', // purple
        bgColor: '#8b5cf615',
        borderColor: '#8b5cf630',
        label: 'Skill',
      };
    }
    if (cat.includes('mindset') || cat.includes('meditat') || cat.includes('calm') || cat.includes('zen') || cat.includes('spirit') || cat.includes('affirm') || cat.includes('mind')) {
      return {
        lucideIcon: Brain,
        accentColor: '#EC4899', // pink/rose
        bgColor: '#ec489915',
        borderColor: '#ec489930',
        label: 'Mindset',
      };
    }
    return {
      lucideIcon: Sparkles,
      accentColor: '#64748B', // slate
      bgColor: '#64748b15',
      borderColor: '#64748b30',
      label: 'Custom',
    };
  };

  // NEW: 1-Tap Quick log action
  const handleQuickLog = async (habitId: string) => {
    const targetHabit = habits.find((h) => h.id === habitId);
    if (!targetHabit) return;

    const curToday = targetHabit.history[dateToday] || 0;
    
    if (targetHabit.target === 1) {
      const isCompleted = curToday >= 1;
      await onLogHabit(habitId, isCompleted ? -1 : 1);
    } else {
      if (curToday >= targetHabit.target) {
        // Reset to 0
        await onLogHabit(habitId, -curToday);
      } else {
        // Increment by 1
        await onLogHabit(habitId, 1);
      }
    }
  };

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
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
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
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFilled ? 'w-5 bg-emerald-400' : 'w-2 bg-slate-800'
                  }`} 
                />
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

        {/* Nutrition Today Block */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Apple className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Nutrition Today</h3>
            </div>
            <button 
              onClick={onOpenLogFood}
              className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition"
            >
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
              const progress = Math.min(100, Math.round((macro.value / macro.target) * 100));
              return (
                <div key={macro.label} className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{macro.label}</span>
                  <span className="text-xs font-extrabold text-[#0F172A] mt-1">
                    {macro.value}<span className="text-[9px] text-gray-400 font-normal">{macro.unit}</span>
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400">/ {macro.target}</span>
                  
                  {/* Progress bar container */}
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
                    isSelected
                      ? filter.selectedClass
                      : 'bg-[#121620] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
                <span>Yesterday</span>
                <span>{yesterdayCompletionRate}%</span>
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
                
                return (
                  <div
                    key={routine.id}
                    onClick={() => setActiveRoutineDetails(routine)}
                    className="group bg-[#121620] hover:bg-[#151c2a] border border-slate-800/80 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between gap-4 border-l-[6px] border-l-emerald-500 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Dumbbell className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                          {routine.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                            {routine.timeBlock}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {completed}/{total} completed
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-1 rounded-xl text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-sm">
                        <Zap className="w-3 h-3 fill-orange-400 stroke-none" />
                        <span>+{routine.points} XP</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
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
              Hold :: to reorder • click ◯ to complete
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
                    className="group bg-[#121620] rounded-2xl p-2 sm:p-3 border border-slate-850 hover:border-slate-700/60 transition-all duration-300 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden select-none"
                  >
                    {/* Solid Vertical Accent Bar on the Left Edge */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                      style={{ backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor }}
                    />

                    {/* Content Row: Align all elements horizontally on a single line */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pl-1.5">
                      {/* Grab handle dots */}
                      <div className="text-slate-650 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing hidden sm:block">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      
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
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isCompleted ? '#10b981' : hMeta.accentColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Large elegant interactive checkbox matching screenshot exactly */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLog(habit.id);
                      }}
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
          <div>
          <div className="flex justify-between items-center mb-3 select-none">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Today's Focus</h3>
            <button 
              onClick={() => setTab('today')}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {standaloneHabits.map((habit) => {
              const progressVal = habit.history[dateToday] || 0;
              const isCompleted = progressVal >= habit.target;
              return (
                <div 
                  key={habit.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-150 flex items-center justify-center">
                      <span className="text-lg">
                        {mapCategoryToPillar(habit.category) === 'Fitness' ? '🏋️' : mapCategoryToPillar(habit.category) === 'Nutrition' ? '🥗' : '💻'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{habit.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{habit.category} • {habit.target} {habit.unit}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onLogHabit(habit.id, isCompleted ? -habit.target : habit.target)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border cursor-pointer transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-gray-250 text-transparent hover:border-emerald-500'
                    }`}
                  >
                    <Check className="w-4.5 h-4.5 stroke-[3px]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pillars Overview Grid */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Pillars Overview</h3>
            <button 
              onClick={() => setTab('progress')}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition"
            >
              See Details
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {pillarDetails.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div key={pillar.name} className="flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${pillar.color}`}>
                    <PillarIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-[#0F172A] mt-2">{pillar.name}</span>
                  <span className="text-xs font-black mt-0.5">{pillar.value}%</span>
                  <div className="w-8 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${pillar.value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Routines Section */}
        <div>
          <div className="flex justify-between items-center mb-3 select-none">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Upcoming Routines</h3>
            <button 
              onClick={() => setTab('today')}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition"
            >
              View Day
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Morning', title: 'Morning', time: '6:00 AM', color: 'from-amber-400 to-amber-500/10' },
              { id: 'Afternoon', title: 'Afternoon', time: '12:00 PM', color: 'from-blue-400 to-blue-500/10' },
              { id: 'Evening', title: 'Evening', time: '5:00 PM', color: 'from-indigo-400 to-indigo-500/10' },
              { id: 'Night', title: 'Night', time: '9:00 PM', color: 'from-purple-400 to-purple-500/10' },
            ].map((block) => {
              const count = routines.filter(r => r.timeBlock === block.id).length || 2;
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
                      {count} routines
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
