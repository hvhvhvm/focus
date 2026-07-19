import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import { CreateHabitModal, CreateRoutineModal } from './components/Modals';
import { Habit, Category, Routine } from './types';
import { getInitialState, calculateMomentum, dateToday, dateYesterday } from './data';
import { api } from './api';
import { 
  Home as HomeIcon, 
  Calendar as CalendarIcon, 
  Plus as PlusIcon, 
  BarChart3 as BarChartIcon, 
  User as UserIcon,
  Flame,
  Zap,
  Bell,
  Apple as AppleIcon
} from 'lucide-react';

import HomeScreen from './components/HomeScreen';
import TodayScreen from './components/TodayScreen';
import ProgressScreen from './components/ProgressScreen';
import ProfileScreen from './components/ProfileScreen';
import CreateModal from './components/CreateModal';
import DietScreen, { LoggedFood } from './components/DietScreen';
import LogFoodModal from './components/LogFoodModal';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('habit_mountain_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [currentTab, setTab] = useState<string>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [appLoading, setAppLoading] = useState<boolean>(true);

  // Nutrition goals state
  const [nutritionTargets, setNutritionTargets] = useState<{
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  }>(() => {
    const cached = localStorage.getItem('90day_nutrition_targets');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      protein: 150,
      carbs: 200,
      fats: 70,
      fiber: 25,
      calories: 2000,
    };
  });

  // Food log state
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>(() => {
    const cached = localStorage.getItem('90day_logged_foods');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    // Default initial mock foods sum exactly to protein 82, carbs 160, fats 50, fiber 18, calories 1880
    return [
      { id: 'init-1', name: 'Eggs (3x) & Avocado Toast', protein: 26, carbs: 45, fats: 22, fiber: 8, calories: 580, timestamp: '08:30 AM', date: dateYesterday },
      { id: 'init-2', name: 'Grilled Chicken Breast & Rice Bowl', protein: 56, carbs: 115, fats: 28, fiber: 10, calories: 1300, timestamp: '01:15 PM', date: dateYesterday },
    ];
  });

  // Dynamically derive nutritionToday based on loggedFoods FOR TODAY ONLY
  const nutritionToday = loggedFoods
    .filter(item => !item.date || item.date === dateToday)
    .reduce(
      (acc, item) => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fats += item.fats;
        acc.fiber += item.fiber;
        acc.calories += item.calories;
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0, fiber: 0, calories: 0 }
    );

  const handleAddFood = (food: Omit<LoggedFood, 'id' | 'timestamp'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newFood: LoggedFood = {
      ...food,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      date: dateToday,
    };
    setLoggedFoods(prev => {
      const next = [...prev, newFood];
      localStorage.setItem('90day_logged_foods', JSON.stringify(next));
      return next;
    });
    // Reward points for tracking
    handleAddPoints(15);
  };

  const handleRemoveFood = (id: string) => {
    setLoggedFoods(prev => {
      const next = prev.filter(f => f.id !== id);
      localStorage.setItem('90day_logged_foods', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateNutritionTargets = (targets: { protein: number; carbs: number; fats: number; fiber: number; calories: number }) => {
    setNutritionTargets(targets);
    localStorage.setItem('90day_nutrition_targets', JSON.stringify(targets));
  };

  const handleClearLogs = () => {
    setLoggedFoods(prev => {
      const next = prev.filter(f => f.date && f.date !== dateToday);
      localStorage.setItem('90day_logged_foods', JSON.stringify(next));
      return next;
    });
  };

  // Backwards-compatible handleAddNutrition
  const handleAddNutrition = (macros: { protein: number; carbs: number; fats: number; fiber: number; calories: number }) => {
    handleAddFood({
      name: 'Custom Logged Meal',
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      fiber: macros.fiber,
      calories: macros.calories,
    });
  };

  const handleAddPoints = async (points: number) => {
    try {
      const nextPoints = userPoints + points;
      setUserPoints(nextPoints);
      await api.syncJourney({ total_points: nextPoints });
    } catch (err: any) {
      console.error('Failed to sync points:', err);
      if (err.message && (
        err.message.includes('401') || 
        err.message.includes('403') || 
        err.message.includes('404') || 
        err.message.includes('expired') || 
        err.message.includes('not found') ||
        err.message.includes('profile') ||
        err.message.includes('session')
      )) {
        handleLogout();
      }
    }
  };

  const [customGoals, setCustomGoals] = useState<Array<{ title: string; desc: string }>>([
    { title: 'Fitness Goals', desc: 'Workout, lift, and maintain physical activity.' },
    { title: 'Diet & Nutrition', desc: 'Protein target 120g+, 3L water daily.' },
    { title: 'Study & Career', desc: 'Technical reading, coding, and focus blocks.' },
  ]);

  const handleAddCustomGoal = (goal: { title: string; desc: string }) => {
    setCustomGoals(prev => [...prev, goal]);
  };

  // States for routine timeline details
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<Category | null>(null);

  // State for Create dialogue modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isPlusModalOpen, setIsPlusModalOpen] = useState(false);
  const [isLogFoodModalOpen, setIsLogFoodModalOpen] = useState(false);

  // Fetch all user details, habits, routines on mounting/authentication
  const loadAllData = async () => {
    if (!token) {
      setAppLoading(false);
      return;
    }
    setAppLoading(true);
    try {
      // 1. Fetch profiles
      const profile = await api.getProfile();
      setCurrentUser(profile);
      setUserPoints(profile.total_points || 0);

      // 2. Fetch habits
      const hData = await api.getHabits();
      setHabits(hData);

      // 3. Fetch routines
      const rData = await api.getRoutines();
      setRoutines(rData);

    } catch (err: any) {
      console.error('Error loading full-stack assets:', err);
      // If unauthorized token or user profile/session not found, force session clear
      if (err.message && (
        err.message.includes('401') || 
        err.message.includes('403') || 
        err.message.includes('404') || 
        err.message.includes('expired') || 
        err.message.includes('not found') ||
        err.message.includes('profile') ||
        err.message.includes('session')
      )) {
        handleLogout();
      }
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Auth helper success callback
  const handleAuthSuccess = (newToken: string, user: any) => {
    localStorage.setItem('habit_mountain_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    setUserPoints(user.total_points || 0);
  };

  // Sign out handle
  const handleLogout = () => {
    localStorage.removeItem('habit_mountain_token');
    setToken(null);
    setCurrentUser(null);
    setHabits([]);
    setRoutines([]);
    setUserPoints(0);
  };

  // Automated Routine Completion Handler Check
  useEffect(() => {
    if (!token || habits.length === 0 || routines.length === 0) return;

    let pointsBonus = 0;
    let routinesToUpdate: { id: string; completed: boolean }[] = [];

    routines.forEach((rt) => {
      // Find all habits associated with this routine
      const routineHabits = habits.filter((h) => rt.habitIds.includes(h.id));
      
      // Calculate if they were all fully completed today
      const allDoneToday =
        routineHabits.length > 0 &&
        routineHabits.every((h) => (h.history[dateToday] || 0) >= h.target);
      
      const wasDoneEarlierToday = rt.completedHistory[dateToday] || false;

      if (allDoneToday && !wasDoneEarlierToday) {
        pointsBonus += rt.points;
        routinesToUpdate.push({ id: rt.id, completed: true });
      }
    });

    if (routinesToUpdate.length > 0) {
      // Execute database syncs for routine completion status
      const syncRoutinesCompletions = async () => {
        try {
          const nextPoints = userPoints + pointsBonus;
          setUserPoints(nextPoints);

          // Update user points in database
          await api.syncJourney({ total_points: nextPoints });

          // Update routine logger rows
          for (const item of routinesToUpdate) {
            await api.setRoutineStatus(item.id, dateToday, true);
          }

          // Reload fresh data to keep structures integrated perfectly
          const updatedRoutines = await api.getRoutines();
          setRoutines(updatedRoutines);

          // Trigger clean congrats banner feedback
          setTimeout(() => {
            alert(`⚡ SUMMIT CHAIN MASTERED!\nYou completed all tasks for routine and gained +${pointsBonus} bonus points!`);
          }, 100);

        } catch (err) {
          console.error('Error synchronizing routine chains:', err);
        }
      };

      syncRoutinesCompletions();
    }
  }, [habits, routines, token]);

  // Handler: Log count/timer progress against a specific habit
  const handleLogHabit = async (id: string, value: number) => {
    try {
      const targetHabit = habits.find((h) => h.id === id);
      if (!targetHabit) return;

      const curToday = targetHabit.history[dateToday] || 0;
      const newToday = curToday + value;

      const wasCompleted = curToday >= targetHabit.target;
      const nowCompleted = newToday >= targetHabit.target;

      const isRoutineHabit = routines.some((r) => r.habitIds.includes(id));
      let ptsAdd = 0;
      if (!isRoutineHabit) {
        if (nowCompleted && !wasCompleted) {
          // Double completions bonus!
          ptsAdd = targetHabit.points + 5;
        } else if (!nowCompleted) {
          // Simple increment points addition
          ptsAdd = Math.min(targetHabit.points, 2);
        }
      }

      const nextPoints = userPoints + ptsAdd;
      
      // Sync to database
      await api.logHabit(id, dateToday, value);
      
      if (ptsAdd > 0) {
        await api.syncJourney({ total_points: nextPoints });
        setUserPoints(nextPoints);
      }

      // Re-fetch all dynamic logs cleanly
      const updatedHabits = await api.getHabits();
      setHabits(updatedHabits);

    } catch (err: any) {
      console.error('Failed to sync logged progression:', err);
      if (err.message && (
        err.message.includes('401') || 
        err.message.includes('403') || 
        err.message.includes('404') || 
        err.message.includes('expired') || 
        err.message.includes('not found') ||
        err.message.includes('profile') ||
        err.message.includes('session')
      )) {
        handleLogout();
      } else {
        alert('Network logging failure: ' + err.message);
      }
    }
  };

  // Handler: Save newly created habit
  const handleCreateHabitSubmit = async (habitData: Partial<Habit>) => {
    try {
      const payload: Partial<Habit> = {
        name: habitData.name || 'Untitled Habit',
        category: habitData.category || 'Fitness',
        points: habitData.points || 10,
        type: habitData.type || 'Count',
        target: habitData.target || 1,
        unit: habitData.type === 'Timer' ? 'min' : habitData.unit || 'reps',
        repeat: habitData.repeat || 'Daily',
        timeOfDay: habitData.timeOfDay,
        timeBlock: habitData.timeBlock || 'Anytime',
        enableFocusTimer: habitData.enableFocusTimer || false,
        routineId: habitData.routineId
      };

      await api.createHabit(payload);
      
      // Reload lists
      const nextHabits = await api.getHabits();
      setHabits(nextHabits);

      // If linked to routine, update local arrays representation too
      if (habitData.routineId) {
        const nextRoutines = await api.getRoutines();
        setRoutines(nextRoutines);
      }

      setIsHabitModalOpen(false);
      setTab('today');
    } catch (err: any) {
      alert('Error creating habit index: ' + err.message);
    }
  };

  // Handler: Save newly created routine and auto-create corresponding template habits
  const handleCreateRoutineSubmit = async (rtData: {
    name: string;
    points: number;
    timeBlock: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant';
    repeat: 'Daily' | 'Custom Days' | 'Today Only';
    category?: Category;
    habitNames: string[];
  }) => {
    try {
      const generatedHabitIds: string[] = [];

      // Create each listed habit sequentially in backend SQLite DB
      for (let i = 0; i < rtData.habitNames.length; i++) {
        const name = rtData.habitNames[i];
        const hRes = await api.createHabit({
          name,
          category: rtData.category || 'Fitness',
          points: 10,
          type: 'Count',
          target: 10,
          unit: 'reps',
          repeat: rtData.repeat
        });
        generatedHabitIds.push(hRes.id);
      }

      // Create Routine representing the linked chain
      await api.createRoutine({
        name: rtData.name,
        points: rtData.points,
        timeBlock: rtData.timeBlock,
        repeat: rtData.repeat,
        habitIds: generatedHabitIds
      });

      // Reload fresh database structures
      const nextHabits = await api.getHabits();
      const nextRoutines = await api.getRoutines();
      setHabits(nextHabits);
      setRoutines(nextRoutines);

      setIsRoutineModalOpen(false);
      setTab('today');
    } catch (err: any) {
      alert('Error building full routine chain: ' + err.message);
    }
  };

  // Navigate straight to routine
  const handleNavigateToRoutine = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setTab('habits');
  };

  const handleRefreshData = async () => {
    try {
      const hData = await api.getHabits();
      setHabits(hData);
      const rData = await api.getRoutines();
      setRoutines(rData);
      const profile = await api.getProfile();
      setCurrentUser(profile);
      setUserPoints(profile.total_points || 0);
    } catch (err: any) {
      console.error('Error refreshing applet data:', err);
      if (err.message && (
        err.message.includes('401') || 
        err.message.includes('403') || 
        err.message.includes('404') || 
        err.message.includes('expired') || 
        err.message.includes('not found') ||
        err.message.includes('profile') ||
        err.message.includes('session')
      )) {
        handleLogout();
      }
    }
  };

  // Handler: Delete habit permanently
  const handleDeleteHabit = async (id: string) => {
    if (confirm('Are you sure you want to delete this habit permanently from your dashboard and routines?')) {
      try {
        await api.deleteHabit(id);
        
        // Reload habits and routines
        const nextHabits = await api.getHabits();
        setHabits(nextHabits);
        const nextRoutines = await api.getRoutines();
        setRoutines(nextRoutines);
      } catch (err: any) {
        alert('Failed to delete habit: ' + err.message);
      }
    }
  };

  // Reset database state completely
  const handleResetApp = async () => {
    if (confirm('Are you sure you want to reset all tracked points and database logs to start fresh? This drops your sqlite metrics safely.')) {
      setAppLoading(true);
      try {
        await api.resetAllData();
        await loadAllData();
        setTab('dashboard');
        alert('All database tables successfully wiped & re-seeded to baseline values!');
      } catch (err: any) {
        alert('Failure processing reset: ' + err.message);
      } finally {
        setAppLoading(false);
      }
    }
  };

  // Render Login/Register Overlay if not authenticated
  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Loading buffer
  if (appLoading) {
    return (
      <div className="flex flex-col font-sans items-center justify-center min-h-screen bg-[#06070a] text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Zap className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">
          Assembling Summit Environment...
        </p>
      </div>
    );
  }

  // Compute momentum live score
  const { score: currentLiveMomentumScore } = calculateMomentum(habits);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#1E293B] flex flex-col md:flex-row font-sans">
      
      {/* LEFT SIDEBAR NAVIGATION: Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 h-screen sticky top-0 p-6 z-40 select-none shadow-xl border-r border-slate-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#12B886] p-2.5 rounded-2xl text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6 fill-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">90-Day Challenge</h1>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase mt-1 block">LOCK-IN MODE</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'home' 
                ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HomeIcon className="w-4.5 h-4.5 stroke-[2.5px]" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setTab('today')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'today' 
                ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5 stroke-[2.5px]" />
            <span>Today's Focus</span>
          </button>

          <button
            onClick={() => setTab('progress')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'progress' 
                ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChartIcon className="w-4.5 h-4.5 stroke-[2.5px]" />
            <span>Progress Logs</span>
          </button>

          <button
            onClick={() => setTab('diet')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'diet' 
                ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <AppleIcon className="w-4.5 h-4.5 stroke-[2.5px]" />
            <span>Diet Tracker</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'profile' 
                ? 'bg-[#12B886] text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserIcon className="w-4.5 h-4.5 stroke-[2.5px]" />
            <span>Profile Settings</span>
          </button>
        </nav>

        {/* Desktop Quick Add Button at bottom of Sidebar */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => setIsPlusModalOpen(true)}
            className="w-full bg-[#12B886] hover:bg-[#12B886]/90 text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4.5 h-4.5 stroke-[3px]" />
            <span>New Logger</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT: Scrollable content container */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FC] relative">
        
        {/* Main Screen Render Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="w-full max-w-6xl mx-auto py-2 md:py-6">
            {currentTab === 'home' && (
              <HomeScreen
                habits={habits}
                routines={routines}
                userPoints={userPoints}
                dateToday={dateToday}
                onLogHabit={handleLogHabit}
                setTab={setTab}
                onNavigateToRoutine={handleNavigateToRoutine}
                currentUser={currentUser}
                nutritionToday={nutritionToday}
                nutritionTargets={nutritionTargets}
                onOpenLogFood={() => setIsLogFoodModalOpen(true)}
                onOpenCreateModal={() => setIsPlusModalOpen(true)}
                onRefresh={handleRefreshData}
              />
            )}

            {currentTab === 'today' && (
              <TodayScreen
                habits={habits}
                routines={routines}
                dateToday={dateToday}
                onLogHabit={handleLogHabit}
                userPoints={userPoints}
                currentUser={currentUser}
                nutritionToday={nutritionToday}
                nutritionTargets={nutritionTargets}
                onRefresh={handleRefreshData}
              />
            )}

            {currentTab === 'progress' && (
              <ProgressScreen
                habits={habits}
                routines={routines}
                dateToday={dateToday}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'diet' && (
              <DietScreen
                nutritionToday={nutritionToday}
                nutritionTargets={nutritionTargets}
                loggedFoods={loggedFoods.filter(item => !item.date || item.date === dateToday)}
                onAddFood={handleAddFood}
                onRemoveFood={handleRemoveFood}
                onUpdateTargets={handleUpdateNutritionTargets}
                onClearLogs={handleClearLogs}
                onBack={() => setTab('home')}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileScreen
                currentUser={currentUser}
                userPoints={userPoints}
                habits={habits}
                routines={routines}
                onLogout={handleLogout}
                onReset={handleResetApp}
              />
            )}
          </div>
        </main>

        {/* Floating Bottom Navigation Bar: Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 py-2.5 px-4 flex justify-between items-center z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] select-none animate-fade-in">
          <button
            onClick={() => setTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              currentTab === 'home' ? 'text-[#12B886] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <HomeIcon className="w-5 h-5 stroke-[2.5px]" />
            <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Home</span>
          </button>

          <button
            onClick={() => setTab('today')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              currentTab === 'today' ? 'text-[#12B886] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <CalendarIcon className="w-5 h-5 stroke-[2.5px]" />
            <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Today</span>
          </button>

          {/* Glowing Green Floating "+" Button */}
          <div className="flex-1 flex justify-center relative -top-3.5">
            <button
              onClick={() => setIsPlusModalOpen(true)}
              className="bg-[#12B886] hover:bg-[#12B886]/90 text-white p-3.5 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-emerald-400"
            >
              <PlusIcon className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>

          <button
            onClick={() => setTab('diet')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              currentTab === 'diet' ? 'text-[#12B886] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <AppleIcon className="w-5 h-5 stroke-[2.5px]" />
            <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Diet</span>
          </button>

          <button
            onClick={() => setTab('progress')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              currentTab === 'progress' ? 'text-[#12B886] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChartIcon className="w-5 h-5 stroke-[2.5px]" />
            <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Progress</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              currentTab === 'profile' ? 'text-[#12B886] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <UserIcon className="w-5 h-5 stroke-[2.5px]" />
            <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Profile</span>
          </button>
        </div>

      </div>

      {/* Global Action Modal Sheet */}
      <CreateModal
        isOpen={isPlusModalOpen}
        onClose={() => setIsPlusModalOpen(false)}
        openCreateHabit={() => setIsHabitModalOpen(true)}
        openCreateRoutine={() => setIsRoutineModalOpen(true)}
        onAddNutrition={handleAddNutrition}
        onAddPoints={handleAddPoints}
        onAddCustomGoal={handleAddCustomGoal}
        onOpenLogFood={() => setIsLogFoodModalOpen(true)}
      />

      <LogFoodModal
        isOpen={isLogFoodModalOpen}
        onClose={() => setIsLogFoodModalOpen(false)}
        onAddFood={handleAddFood}
        loggedFoodsHistory={loggedFoods}
      />

      {/* Global Control Modals (Fallback support) */}
      <CreateHabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        routines={routines}
        onCreate={handleCreateHabitSubmit}
      />

      <CreateRoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        onCreate={handleCreateRoutineSubmit}
      />
    </div>
  );
}
