import React, { useState, useEffect } from 'react';
import { 
  X, 
  Dumbbell, 
  Apple, 
  Briefcase, 
  Moon, 
  Brain, 
  Check, 
  Plus, 
  Trophy, 
  Sparkles, 
  Target, 
  Calendar, 
  Flame, 
  NotebookPen, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  Clock, 
  ArrowUpRight,
  Droplet,
  Play,
  Pause,
  RotateCcw,
  Star,
  Activity,
  Heart
} from 'lucide-react';
import { Category, Habit, Routine, PillarGoal, PillarNote, LoggedFood } from '../types';
import { PILLAR_META } from '../lib/pillars';
import { getWaterIntakeForDate, addWaterIntakeForDate } from '../lib/dietPreferences';

interface PillarDetailModalProps {
  isOpen: boolean;
  pillar: Category | null;
  onClose: () => void;
  habits: Habit[];
  routines: Routine[];
  pillarGoals: PillarGoal[];
  dateToday: string;
  onLogHabit: (id: string, value: number) => Promise<void>;
  onBatchLogHabits?: (updates: { id: string; value: number }[]) => Promise<void>;
  onOpenCreateModal?: () => void;
  nutritionToday?: { protein: number; carbs: number; fats: number; fiber: number; calories: number };
  nutritionTargets?: { protein: number; carbs: number; fats: number; fiber: number; calories: number };
  todaysFoodLog?: LoggedFood[];
  onRemoveFood?: (id: string) => void;
  onOpenLogFood?: () => void;
}

export default function PillarDetailModal({
  isOpen,
  pillar,
  onClose,
  habits,
  routines,
  pillarGoals,
  dateToday,
  onLogHabit,
  onBatchLogHabits,
  onOpenCreateModal,
  nutritionToday,
  nutritionTargets,
  todaysFoodLog = [],
  onRemoveFood,
  onOpenLogFood,
}: PillarDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'habits' | 'goals' | 'notes'>('habits');
  
  // Per-pillar notes state
  const [pillarNotes, setPillarNotes] = useState<PillarNote[]>(() => {
    try {
      const saved = localStorage.getItem('90day_pillar_notes');
      return saved ? JSON.parse(saved) : [
        { id: 'note-fit-1', pillar: 'Fitness', title: 'Chest & Triceps PR', content: 'Bench Press: 80kg x 6 reps | Incline Dumbbell: 28kg x 8', date: dateToday, createdAt: dateToday },
        { id: 'note-career-1', pillar: 'Career', title: 'React Performance Optimization', content: 'Implemented stale-while-revalidate caching & batch queries in backend.', date: dateToday, createdAt: dateToday },
      ];
    } catch (e) {
      return [];
    }
  });

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Specialized Tool State: Fitness (PR Log)
  const [prExercise, setPrExercise] = useState('');
  const [prWeight, setPrWeight] = useState('');
  const [prReps, setPrReps] = useState('');

  // Specialized Tool State: Career (Focus Timer)
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Specialized Tool State: Recovery (Sleep Tracker)
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepRating, setSleepRating] = useState(4);

  // Specialized Tool State: Mind (Gratitude Journal)
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');

  // Hydration state
  const [waterMl, setWaterMl] = useState(() => getWaterIntakeForDate(dateToday));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen || !pillar) return null;

  const pillarMeta = PILLAR_META[pillar] || PILLAR_META.Fitness;

  // Category to pillar mapper
  const mapCategoryToPillar = (category: string): Category => {
    const c = category.toLowerCase();
    if (c.includes('fit') || c.includes('workout') || c.includes('health') || c.includes('exercise')) return 'Fitness';
    if (c.includes('diet') || c.includes('nutr') || c.includes('food') || c.includes('water')) return 'Nutrition';
    if (c.includes('work') || c.includes('career') || c.includes('code') || c.includes('read') || c.includes('study') || c.includes('skill')) return 'Career';
    if (c.includes('sleep') || c.includes('recover') || c.includes('rest')) return 'Recovery';
    return 'Mind';
  };

  // Filter habits for this pillar
  const pillarHabits = habits.filter(h => mapCategoryToPillar(h.category) === pillar);
  
  // Filter routines for this pillar
  const getRoutineCategory = (routine: Routine): Category => {
    const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
    if (rHabits.length === 0) return 'Fitness';
    const counts: Record<Category, number> = { Fitness: 0, Nutrition: 0, Career: 0, Recovery: 0, Mind: 0 };
    rHabits.forEach(h => {
      counts[mapCategoryToPillar(h.category)]++;
    });
    let topCategory: Category = 'Fitness';
    let topCount = -1;
    (Object.keys(counts) as Category[]).forEach(cat => {
      if (counts[cat] > topCount) {
        topCount = counts[cat];
        topCategory = cat;
      }
    });
    return topCategory;
  };

  const pillarRoutines = routines.filter(r => getRoutineCategory(r) === pillar);
  const activePillarGoals = pillarGoals.filter(g => g.pillar === pillar);
  const currentPillarNotes = pillarNotes.filter(n => n.pillar === pillar);

  // Compute pillar completion stats
  const habitsDone = pillarHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
  const totalHabits = pillarHabits.length;
  const routinesDone = pillarRoutines.filter(r => r.completedHistory[dateToday]).length;
  const totalRoutines = pillarRoutines.length;

  const totalItems = totalHabits + totalRoutines;
  const completedItems = habitsDone + routinesDone;
  const pillarScorePercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Icon chooser
  const getPillarIcon = () => {
    if (pillar === 'Fitness') return Dumbbell;
    if (pillar === 'Nutrition') return Apple;
    if (pillar === 'Career') return Briefcase;
    if (pillar === 'Recovery') return Moon;
    return Brain;
  };

  const IconComp = getPillarIcon();

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote: PillarNote = {
      id: `note-${Date.now()}`,
      pillar: pillar,
      title: noteTitle.trim() || `${pillar} Note`,
      content: noteContent.trim(),
      date: dateToday,
      createdAt: dateToday,
    };

    const updated = [newNote, ...pillarNotes];
    setPillarNotes(updated);
    localStorage.setItem('90day_pillar_notes', JSON.stringify(updated));

    setNoteTitle('');
    setNoteContent('');
  };

  const handleSavePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prExercise.trim() || !prWeight || !prReps) return;

    const newNote: PillarNote = {
      id: `pr-${Date.now()}`,
      pillar: 'Fitness',
      title: `🏋️ PR Log: ${prExercise}`,
      content: `Weight: ${prWeight} kg | Reps: ${prReps} reps | Logged on ${dateToday}`,
      date: dateToday,
      createdAt: dateToday,
    };

    const updated = [newNote, ...pillarNotes];
    setPillarNotes(updated);
    localStorage.setItem('90day_pillar_notes', JSON.stringify(updated));

    setPrExercise('');
    setPrWeight('');
    setPrReps('');
  };

  const handleSaveSleepLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newNote: PillarNote = {
      id: `sleep-${Date.now()}`,
      pillar: 'Recovery',
      title: `🌙 Sleep Log: ${sleepHours} hrs`,
      content: `Sleep Duration: ${sleepHours} hours | Quality Rating: ${'⭐'.repeat(sleepRating)} (${sleepRating}/5)`,
      date: dateToday,
      createdAt: dateToday,
    };

    const updated = [newNote, ...pillarNotes];
    setPillarNotes(updated);
    localStorage.setItem('90day_pillar_notes', JSON.stringify(updated));
  };

  const handleSaveGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitude1 && !gratitude2 && !gratitude3) return;

    const content = [gratitude1, gratitude2, gratitude3].filter(Boolean).map((g, i) => `${i + 1}. ${g}`).join('\n');
    const newNote: PillarNote = {
      id: `gratitude-${Date.now()}`,
      pillar: 'Mind',
      title: '🧘 Daily Gratitude & Reflection',
      content,
      date: dateToday,
      createdAt: dateToday,
    };

    const updated = [newNote, ...pillarNotes];
    setPillarNotes(updated);
    localStorage.setItem('90day_pillar_notes', JSON.stringify(updated));

    setGratitude1('');
    setGratitude2('');
    setGratitude3('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = pillarNotes.filter(n => n.id !== id);
    setPillarNotes(updated);
    localStorage.setItem('90day_pillar_notes', JSON.stringify(updated));
  };

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

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-5 select-none animate-fade-in">
      <div className="bg-[#0D111A] rounded-3xl w-full max-w-3xl border border-slate-800/80 shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden text-white relative">
        
        {/* Header Hero Banner */}
        <div className={`p-5 sm:p-7 relative overflow-hidden bg-gradient-to-r ${pillarMeta.bgGradient} border-b border-slate-800 shrink-0`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl shrink-0">
                <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{pillar} Pillar Command</h2>
                  <span className="text-[10px] bg-white/15 text-white border border-white/20 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    90-Day Lock-In
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium mt-1">{pillarMeta.subtitle}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="bg-black/20 hover:bg-black/40 text-white/80 hover:text-white p-2 rounded-full border border-white/10 transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-5 relative z-10">
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="text-xs text-white/70 font-semibold block uppercase tracking-wider text-[9px]">Score Today</span>
              <span className="text-lg sm:text-xl font-black text-white">{pillarScorePercent}%</span>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="text-xs text-white/70 font-semibold block uppercase tracking-wider text-[9px]">Habits & Routines</span>
              <span className="text-lg sm:text-xl font-black text-white">{completedItems}/{totalItems}</span>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
              <span className="text-xs text-white/70 font-semibold block uppercase tracking-wider text-[9px]">Active Goals</span>
              <span className="text-lg sm:text-xl font-black text-white">{activePillarGoals.length}</span>
            </div>

            <div className="hidden sm:flex bg-black/25 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 flex-col items-center justify-center text-center">
              <span className="text-xs text-white/70 font-semibold block uppercase tracking-wider text-[9px]">Notes Saved</span>
              <span className="text-lg sm:text-xl font-black text-white">{currentPillarNotes.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex bg-[#121724] border-b border-slate-800 p-1.5 shrink-0 select-none">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'habits' 
                ? 'bg-slate-800 text-white shadow-md font-black border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Habits & Routines ({totalItems})</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'goals' 
                ? 'bg-slate-800 text-white shadow-md font-black border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span>90-Day Goals ({activePillarGoals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'notes' 
                ? 'bg-slate-800 text-white shadow-md font-black border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <NotebookPen className="w-4 h-4 text-purple-400" />
            <span>Notes & Specialized Tool</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: HABITS & ROUTINES */}
          {activeTab === 'habits' && (
            <div className="space-y-5">
              
              {/* Routines Section */}
              {pillarRoutines.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>⚡ Mapped Routines ({pillarRoutines.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pillarRoutines.map((routine) => {
                      const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
                      const doneCount = rHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
                      const total = rHabits.length;
                      const isComplete = routine.completedHistory[dateToday] || (total > 0 && doneCount === total);
                      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

                      return (
                        <div
                          key={routine.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isComplete 
                              ? 'bg-emerald-950/20 border-emerald-500/40' 
                              : 'bg-[#121622] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-extrabold text-white">{routine.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {routine.timeBlock} Block · {doneCount}/{total} habits done
                              </p>
                            </div>
                            <span className="text-xs font-black font-mono text-emerald-400">{pct}%</span>
                          </div>

                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleMarkRoutineDone(routine)}
                            disabled={isComplete}
                            className={`w-full py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isComplete
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3px]" />
                            <span>{isComplete ? 'Routine Mastered Today!' : 'Complete Full Routine'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standalone Habits Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>🎯 Standalone Habits ({pillarHabits.length})</span>
                  </h3>
                  {onOpenCreateModal && (
                    <button
                      type="button"
                      onClick={onOpenCreateModal}
                      className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Habit</span>
                    </button>
                  )}
                </div>

                {pillarHabits.length === 0 ? (
                  <div className="text-center py-8 bg-[#121622] rounded-2xl border border-dashed border-slate-800 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">No habits assigned to the {pillar} pillar yet.</p>
                    {onOpenCreateModal && (
                      <button
                        onClick={onOpenCreateModal}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First {pillar} Habit</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pillarHabits.map((habit) => {
                      const val = habit.history[dateToday] || 0;
                      const isCompleted = val >= habit.target;
                      const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;

                      return (
                        <div
                          key={habit.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-[#121622] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => onLogHabit(habit.id, isCompleted ? -habit.target : habit.target - val)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center border transition shrink-0 cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                                  : 'border-slate-700 hover:border-emerald-500 text-transparent bg-slate-900'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3px]" />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {habit.name}
                                </h4>
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">
                                  +{habit.points} pts
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                  {val}/{habit.target} {habit.unit} ({pct}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onLogHabit(habit.id, 1)}
                            className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-black px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer shrink-0 active:scale-95"
                          >
                            +1 {habit.unit}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 90-DAY GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  🎯 90-Day Challenge Targets for {pillar}
                </h3>
                {onOpenCreateModal && (
                  <button
                    onClick={onOpenCreateModal}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Set Goal</span>
                  </button>
                )}
              </div>

              {activePillarGoals.length === 0 ? (
                <div className="text-center py-10 bg-[#121622] rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <Target className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No 90-day targets pinned to the {pillar} pillar yet.</p>
                  {onOpenCreateModal && (
                    <button
                      onClick={onOpenCreateModal}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create {pillar} Goal</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePillarGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-[#121622] border border-slate-800 p-4 rounded-2xl space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/20 text-amber-400 font-black px-2 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-wider">
                          Goal
                        </span>
                        <h4 className="text-sm font-extrabold text-white truncate">{goal.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2">{goal.desc}</p>
                      {goal.target && (
                        <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                          <span>Target:</span>
                          <span>{goal.target}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES & SPECIALIZED TOOLS */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              
              {/* 🏋️ SPECIALIZED TOOL: FITNESS (Workout & PR Log) */}
              {pillar === 'Fitness' && (
                <form onSubmit={handleSavePR} className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-extrabold text-white">Workout & PR Tracker</h4>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Personal Record Log
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Exercise (e.g. Bench Press)"
                      value={prExercise}
                      onChange={e => setPrExercise(e.target.value)}
                      className="bg-slate-900 border border-slate-750 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      value={prWeight}
                      onChange={e => setPrWeight(e.target.value)}
                      className="bg-slate-900 border border-slate-750 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={prReps}
                      onChange={e => setPrReps(e.target.value)}
                      className="bg-slate-900 border border-slate-750 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Log PR Achievement</span>
                  </button>
                </form>
              )}

              {/* 🥗 SPECIALIZED TOOL: NUTRITION (Diet & Macro Logger + Water) */}
              {pillar === 'Nutrition' && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Apple className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-extrabold text-white">Diet & Macro Command</h4>
                    </div>
                    {onOpenLogFood && (
                      <button
                        type="button"
                        onClick={onOpenLogFood}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log Food Item</span>
                      </button>
                    )}
                  </div>

                  {nutritionToday && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-amber-400 uppercase block">Calories</span>
                        <span className="text-white text-sm">{nutritionToday.calories} kcal</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-emerald-400 uppercase block">Protein</span>
                        <span className="text-white text-sm">{nutritionToday.protein}g</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-blue-400 uppercase block">Carbs</span>
                        <span className="text-white text-sm">{nutritionToday.carbs}g</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-rose-400 uppercase block">Fats</span>
                        <span className="text-white text-sm">{nutritionToday.fats}g</span>
                      </div>
                    </div>
                  )}

                  {/* Water Quick Tracker */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Water Intake Today:</span>
                      <span className="text-xs font-mono text-blue-400 font-black">{(waterMl / 1000).toFixed(1)}L / 3.0L</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = addWaterIntakeForDate(dateToday, 250);
                        setWaterMl(updated);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      +250ml Glass
                    </button>
                  </div>
                </div>
              )}

              {/* 💼 SPECIALIZED TOOL: CAREER (Deep Work Focus Timer) */}
              {pillar === 'Career' && (
                <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                      <h4 className="text-sm font-extrabold text-white">Deep Work Focus Timer</h4>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Pomodoro Mode
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-blue-400">
                      {formatTimer(timerSeconds)}
                    </span>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          isTimerRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Session'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimerSeconds(1500);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🌙 SPECIALIZED TOOL: RECOVERY (Sleep & Wind-down Tracker) */}
              {pillar === 'Recovery' && (
                <form onSubmit={handleSaveSleepLog} className="bg-violet-950/20 border border-violet-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-violet-400" />
                      <h4 className="text-sm font-extrabold text-white">Sleep & Recovery Tracker</h4>
                    </div>
                    <span className="text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Night Wind-down
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Hours Slept</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="7.5"
                        value={sleepHours}
                        onChange={e => setSleepHours(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-violet-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sleep Quality (1-5)</label>
                      <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSleepRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= sleepRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Moon className="w-4 h-4" />
                    <span>Log Sleep Session</span>
                  </button>
                </form>
              )}

              {/* 🧘 SPECIALIZED TOOL: MINDSET (Daily Gratitude & Reflection Journal) */}
              {pillar === 'Mind' && (
                <form onSubmit={handleSaveGratitude} className="bg-pink-950/20 border border-pink-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-pink-400" />
                      <h4 className="text-sm font-extrabold text-white">Daily Gratitude & Reflection</h4>
                    </div>
                    <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Mind Journal
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="1. What are you grateful for today?"
                      value={gratitude1}
                      onChange={e => setGratitude1(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-pink-400"
                    />
                    <input
                      type="text"
                      placeholder="2. What made today memorable?"
                      value={gratitude2}
                      onChange={e => setGratitude2(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-pink-400"
                    />
                    <input
                      type="text"
                      placeholder="3. How can you improve tomorrow?"
                      value={gratitude3}
                      onChange={e => setGratitude3(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer shadow-md shadow-pink-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Save Daily Mind Journal</span>
                  </button>
                </form>
              )}

              {/* Standard Custom Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="bg-[#121622] border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <NotebookPen className="w-4 h-4 text-purple-400" />
                    <span>General {pillar} Note</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Note Title"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                  <textarea
                    placeholder={`Write thoughts, reflections or notes for the ${pillar} pillar...`}
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-purple-600/20 flex items-center gap-1.5 ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Saved {pillar} Notes ({currentPillarNotes.length})
                </h3>

                {currentPillarNotes.length === 0 ? (
                  <div className="text-center py-6 bg-[#121622]/60 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs italic">
                    No notes saved for {pillar} yet. Add a note or specialized entry above!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentPillarNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-[#121622] border border-slate-800 p-4 rounded-2xl space-y-1.5 relative group"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-extrabold text-white">{note.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-mono font-bold">{note.date}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Done Action */}
        <div className="p-3.5 bg-[#101420] border-t border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-400">
              {pillar} Pillar Active · {completedItems}/{totalItems} Completed Today
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
}
