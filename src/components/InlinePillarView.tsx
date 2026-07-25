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
  Heart,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { Category, Habit, Routine, PillarGoal, PillarNote, LoggedFood } from '../types';
import { PILLAR_META } from '../lib/pillars';
import { getWaterIntakeForDate, addWaterIntakeForDate } from '../lib/dietPreferences';

interface InlinePillarViewProps {
  pillar: Category;
  onClose: () => void;
  onSelectPillar?: (pillar: Category) => void;
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

export default function InlinePillarView({
  pillar,
  onClose,
  onSelectPillar,
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
}: InlinePillarViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'habits' | 'goals' | 'notes'>('all');
  
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
  const [isAddingNote, setIsAddingNote] = useState(false);

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

  // Compute pillar completion stats & points earned today
  const habitsDone = pillarHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
  const totalHabits = pillarHabits.length;
  const routinesDone = pillarRoutines.filter(r => r.completedHistory[dateToday]).length;
  const totalRoutines = pillarRoutines.length;

  const totalItems = totalHabits + totalRoutines;
  const completedItems = habitsDone + routinesDone;
  const pillarScorePercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Estimated Momentum points earned from this pillar today
  const pointsEarnedToday = pillarHabits.reduce((acc, h) => {
    const val = h.history[dateToday] || 0;
    return acc + (val >= h.target ? h.points : 0);
  }, 0);

  // Icon chooser
  const getPillarIcon = (catName: Category) => {
    if (catName === 'Fitness') return Dumbbell;
    if (catName === 'Nutrition') return Apple;
    if (catName === 'Career') return Briefcase;
    if (catName === 'Recovery') return Moon;
    return Brain;
  };

  const IconComp = getPillarIcon(pillar);

  // Pillar Quick Switch list
  const allPillars: Category[] = ['Fitness', 'Nutrition', 'Career', 'Recovery', 'Mind'];

  // Note templates per pillar
  const noteTemplates: Record<Category, string[]> = {
    Fitness: ['🏋️ Workout Log', '🏆 New PR Achieved', '💪 Form Note'],
    Nutrition: ['🥗 Meal Prep Log', '⚡ Macro Check-in', '💧 Hydration Target'],
    Career: ['💼 Deep Work', '🚀 Project Note', '📖 Study Goal'],
    Recovery: ['🌙 Wind-down', '🧘 Stretch Log', '💤 Sleep Hygiene'],
    Mind: ['🧘 Meditation', '❤️ Gratitude', '🧠 Focus Note'],
  };

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
    setIsAddingNote(false);
  };

  const handleApplyTemplate = (tpl: string) => {
    setNoteTitle(tpl);
    setIsAddingNote(true);
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

  // Section 1: Habits & Routines
  const renderHabitsSection = () => (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>{pillar} Habits ({totalItems})</span>
        </h3>
        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Add Habit</span>
          </button>
        )}
      </div>

      {/* Routines */}
      {pillarRoutines.length > 0 && (
        <div className="space-y-2">
          {pillarRoutines.map((routine) => {
            const rHabits = habits.filter(h => routine.habitIds.includes(h.id));
            const doneCount = rHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
            const total = rHabits.length;
            const isComplete = routine.completedHistory[dateToday] || (total > 0 && doneCount === total);
            const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

            return (
              <div
                key={routine.id}
                className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                  isComplete ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-white truncate">{routine.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">
                    {routine.timeBlock} · {doneCount}/{total} habits done
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkRoutineDone(routine)}
                  disabled={isComplete}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    isComplete
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>{isComplete ? 'Done' : 'Complete'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Habits */}
      {pillarHabits.length === 0 && pillarRoutines.length === 0 ? (
        <div className="text-center py-5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
          No habits created for {pillar} yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {pillarHabits.map((habit) => {
            const val = habit.history[dateToday] || 0;
            const isCompleted = val >= habit.target;
            const pct = habit.target > 0 ? Math.min(100, Math.round((val / habit.target) * 100)) : 0;

            return (
              <div
                key={habit.id}
                className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                  isCompleted ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => onLogHabit(habit.id, isCompleted ? -habit.target : habit.target - val)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition shrink-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'border-slate-700 text-transparent bg-slate-950 hover:border-emerald-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                        {habit.name}
                      </h4>
                      <span className="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                        +{habit.points}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold shrink-0">
                        {val}/{habit.target} {habit.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onLogHabit(habit.id, 1)}
                  className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer shrink-0"
                >
                  +1
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Section 2: Goals & Tools
  const renderGoalsAndToolSection = () => (
    <div className="space-y-3">
      {/* 90-Day Goals */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>90-Day Goals ({activePillarGoals.length})</span>
          </h3>
          {onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add Goal</span>
            </button>
          )}
        </div>

        {activePillarGoals.length === 0 ? (
          <div className="text-center py-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
            No 90-day targets added yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {activePillarGoals.map((goal) => (
              <div key={goal.id} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-0.5">
                <h4 className="text-xs font-extrabold text-white truncate">{goal.title}</h4>
                <p className="text-[10px] text-slate-400 font-medium truncate">{goal.target || goal.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specialized Tool */}
      {pillar === 'Fitness' && (
        <form onSubmit={handleSavePR} className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>PR Tracker</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="text"
              placeholder="Exercise"
              value={prExercise}
              onChange={e => setPrExercise(e.target.value)}
              className="bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
              required
            />
            <input
              type="number"
              placeholder="Weight"
              value={prWeight}
              onChange={e => setPrWeight(e.target.value)}
              className="bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
              required
            />
            <input
              type="number"
              placeholder="Reps"
              value={prReps}
              onChange={e => setPrReps(e.target.value)}
              className="bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-1 rounded-lg transition cursor-pointer"
          >
            Save PR
          </button>
        </form>
      )}

      {pillar === 'Nutrition' && (
        <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1">
              <Apple className="w-3.5 h-3.5 text-amber-400" />
              <span>Macro Tracker</span>
            </span>
            {onOpenLogFood && (
              <button
                type="button"
                onClick={onOpenLogFood}
                className="bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded cursor-pointer"
              >
                + Food
              </button>
            )}
          </div>
          {nutritionToday && (
            <div className="grid grid-cols-4 gap-1 text-center font-mono font-bold">
              <div className="bg-slate-950 p-1 rounded border border-slate-800">
                <span className="text-[7px] text-amber-400 block uppercase">Cal</span>
                <span className="text-white text-[11px]">{nutritionToday.calories}</span>
              </div>
              <div className="bg-slate-950 p-1 rounded border border-slate-800">
                <span className="text-[7px] text-emerald-400 block uppercase">Prot</span>
                <span className="text-white text-[11px]">{nutritionToday.protein}g</span>
              </div>
              <div className="bg-slate-950 p-1 rounded border border-slate-800">
                <span className="text-[7px] text-blue-400 block uppercase">Carb</span>
                <span className="text-white text-[11px]">{nutritionToday.carbs}g</span>
              </div>
              <div className="bg-slate-950 p-1 rounded border border-slate-800">
                <span className="text-[7px] text-rose-400 block uppercase">Fat</span>
                <span className="text-white text-[11px]">{nutritionToday.fats}g</span>
              </div>
            </div>
          )}
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-white flex items-center gap-1 font-bold">
              <Droplet className="w-3 h-3 text-blue-400" />
              <span>Water:</span>
              <span className="font-mono text-blue-400 font-black">{(waterMl / 1000).toFixed(1)}L</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const updated = addWaterIntakeForDate(dateToday, 250);
                setWaterMl(updated);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer"
            >
              +250ml
            </button>
          </div>
        </div>
      )}

      {pillar === 'Career' && (
        <div className="bg-blue-950/20 border border-blue-500/30 p-2.5 rounded-xl space-y-2 text-center">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-blue-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Focus Timer</span>
            </span>
            <span className="text-lg font-black font-mono text-blue-400">{formatTimer(timerSeconds)}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                isTimerRunning ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isTimerRunning ? 'Pause' : 'Start Focus (25m)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(1500);
              }}
              className="bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {pillar === 'Recovery' && (
        <form onSubmit={handleSaveSleepLog} className="bg-violet-950/20 border border-violet-500/30 p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-violet-400 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-violet-400" />
              <span>Sleep Tracker</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.5"
              placeholder="Hours (7.5)"
              value={sleepHours}
              onChange={e => setSleepHours(e.target.value)}
              className="bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
              required
            />
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSleepRating(star)}
                  className="p-0.5 text-amber-400 cursor-pointer"
                >
                  <Star className={`w-3.5 h-3.5 ${star <= sleepRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-1 rounded-lg transition cursor-pointer"
          >
            Save Sleep
          </button>
        </form>
      )}

      {pillar === 'Mind' && (
        <form onSubmit={handleSaveGratitude} className="bg-pink-950/20 border border-pink-500/30 p-2.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-pink-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span>Daily Gratitude</span>
            </span>
          </div>
          <input
            type="text"
            placeholder="What are you grateful for today?"
            value={gratitude1}
            onChange={e => setGratitude1(e.target.value)}
            className="w-full bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs py-1 rounded-lg transition cursor-pointer"
          >
            Save Gratitude
          </button>
        </form>
      )}
    </div>
  );

  // Section 3: Notes & Presets
  const renderNotesSection = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <NotebookPen className="w-3.5 h-3.5 text-purple-400" />
          <span>{pillar} Notes ({currentPillarNotes.length})</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>{isAddingNote ? 'Cancel' : 'Note'}</span>
        </button>
      </div>

      {/* 1-Tap Note Presets Bar */}
      <div className="flex flex-wrap gap-1">
        {noteTemplates[pillar].map((tpl) => (
          <button
            key={tpl}
            type="button"
            onClick={() => handleApplyTemplate(tpl)}
            className="bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer"
          >
            {tpl}
          </button>
        ))}
      </div>

      {/* Simple Note Entry Form */}
      {isAddingNote && (
        <form onSubmit={handleAddNoteSubmit} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1.5 animate-fade-in">
          <input
            type="text"
            placeholder="Title"
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-750 px-2.5 py-1 rounded-lg text-xs font-bold text-white focus:outline-none"
          />
          <textarea
            placeholder={`Type note...`}
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-750 p-2 rounded-lg text-xs font-bold text-white focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer ml-auto block"
          >
            Save
          </button>
        </form>
      )}

      {/* List of Saved Notes */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
        {currentPillarNotes.length === 0 ? (
          <div className="text-center py-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-[11px] italic">
            No notes saved yet.
          </div>
        ) : (
          currentPillarNotes.map((note) => (
            <div key={note.id} className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl space-y-0.5 relative group">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-white truncate">{note.title}</h4>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-500 hover:text-red-400 p-0.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-medium whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 animate-fade-in text-white mt-3 w-full">
      
      {/* 1. QUICK PILLAR SWITCHER & COMPACT HEADER BAR */}
      <div className="bg-[#0B0F19] border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Pillar Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider shrink-0">Pillar:</span>
          {allPillars.map((p) => {
            const PIcon = getPillarIcon(p);
            const isSelected = p === pillar;
            const meta = PILLAR_META[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => onSelectPillar && onSelectPillar(p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-md ring-1 ring-emerald-500/40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <PIcon className="w-3.5 h-3.5" style={{ color: meta.accent }} />
                <span>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Close button */}
        <button 
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1"
        >
          <span>Minimize</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. COMPACT DYNAMIC METRICS STRIP */}
      <div className={`px-3.5 py-2.5 bg-gradient-to-r ${pillarMeta.bgGradient} border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <IconComp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-tight">{pillar} Command Center</h2>
            <span className="text-[9px] text-white/70 font-medium">{pillarMeta.subtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-black/30 border border-white/10 px-2 py-0.5 rounded text-white font-bold">
            Score: <span className="text-emerald-400 font-black">{pillarScorePercent}%</span>
          </span>
          <span className="bg-black/30 border border-white/10 px-2 py-0.5 rounded text-white font-bold">
            Done: {completedItems}/{totalItems}
          </span>
          <span className="bg-black/30 border border-white/10 px-2 py-0.5 rounded text-emerald-400 font-black">
            +{pointsEarnedToday} pts
          </span>
        </div>
      </div>

      {/* 3. WIDE 3-COLUMN DASHBOARD GRID */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Column 1: Habits & Routines */}
          <div className="md:col-span-5 border-r-0 md:border-r border-slate-800/60 md:pr-3.5">
            {renderHabitsSection()}
          </div>

          {/* Column 2: Goals & Specialized Tools */}
          <div className="md:col-span-4 border-r-0 md:border-r border-slate-800/60 md:pr-3.5">
            {renderGoalsAndToolSection()}
          </div>

          {/* Column 3: Notes & Presets */}
          <div className="md:col-span-3">
            {renderNotesSection()}
          </div>
        </div>
      </div>

    </div>
  );
}
