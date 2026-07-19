import React from 'react';
import { X, Zap, Check, Pencil, Dumbbell, BookOpen, Apple, Target, Brain, Sparkles, AlertCircle, Trash2, Plus } from 'lucide-react';
import { Habit, Routine } from '../types';
import { motion } from 'motion/react';
import { api } from '../api';

interface RoutineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine;
  habits: Habit[];
  selectedDate: string;
  onLogHabit: (habitId: string, value: number) => void;
  onMarkRoutineDone: (routine: Routine) => void;
  onEditRoutine?: (routineId: string) => void;
  onRefresh?: () => Promise<void> | void;
}

// Category helper mapped to dark theme styling
const getCategoryMetaForPopup = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('fit') || cat.includes('gym') || cat.includes('workout') || cat.includes('run') || cat.includes('sport') || cat.includes('jump')) {
    return {
      lucideIcon: Dumbbell,
      accentColor: '#10B981', // emerald
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
      label: 'Fitness',
    };
  }
  if (cat.includes('read') || cat.includes('book') || cat.includes('study') || cat.includes('academic') || cat.includes('learn')) {
    return {
      lucideIcon: BookOpen,
      accentColor: '#3B82F6', // blue
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-400',
      label: 'Reading',
    };
  }
  if (cat.includes('diet') || cat.includes('nutri') || cat.includes('food') || cat.includes('protein') || cat.includes('eat') || cat.includes('salad')) {
    return {
      lucideIcon: Apple,
      accentColor: '#F59E0B', // amber
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-400',
      label: 'Diet',
    };
  }
  if (cat.includes('skill') || cat.includes('target') || cat.includes('focus') || cat.includes('goal')) {
    return {
      lucideIcon: Target,
      accentColor: '#8B5CF6', // purple
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      textColor: 'text-purple-400',
      label: 'Skill',
    };
  }
  if (cat.includes('mindset') || cat.includes('meditat') || cat.includes('calm') || cat.includes('zen') || cat.includes('spirit') || cat.includes('affirm') || cat.includes('mind')) {
    return {
      lucideIcon: Brain,
      accentColor: '#EC4899', // pink
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      textColor: 'text-pink-400',
      label: 'Mindset',
    };
  }
  return {
    lucideIcon: Sparkles,
    accentColor: '#64748B', // slate
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    textColor: 'text-slate-400',
    label: 'Custom',
  };
};

export default function RoutineDetailsModal({
  isOpen,
  onClose,
  routine,
  habits,
  selectedDate,
  onLogHabit,
  onMarkRoutineDone,
  onEditRoutine,
  onRefresh,
}: RoutineDetailsModalProps) {
  if (!isOpen || !routine) return null;

  const [isEditing, setIsEditing] = React.useState(false);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const routineHabits = habits.filter(h => routine.habitIds.includes(h.id));
  const rCompletedCount = routineHabits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
  const rTotalCount = routineHabits.length;
  const isRoutineCompleted = rTotalCount > 0 && rCompletedCount === rTotalCount;
  const routineProgressPercent = rTotalCount > 0 ? Math.round((rCompletedCount / rTotalCount) * 100) : 0;

  // Get primary category metadata of first habit or default
  const firstHabit = routineHabits[0];
  const rMeta = firstHabit ? getCategoryMetaForPopup(firstHabit.category) : getCategoryMetaForPopup('Fitness');
  const IconComponent = rMeta.lucideIcon;

  const handleAddHabitInline = async () => {
    if (!newHabitName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const defaultCategory = (rMeta.label || 'Fitness') as any;
      const defaultPoints = 10;
      
      let mappedTimeBlock: 'Anytime' | 'Morning' | 'Afternoon' | 'Evening' | 'Night' = 'Anytime';
      if (routine.timeBlock === 'Morning') mappedTimeBlock = 'Morning';
      else if (routine.timeBlock === 'Afternoon') mappedTimeBlock = 'Afternoon';
      else if (routine.timeBlock === 'Evening') mappedTimeBlock = 'Evening';
      else if (routine.timeBlock === 'Night') mappedTimeBlock = 'Night';

      const newHabit = await api.createHabit({
        name: newHabitName.trim(),
        category: defaultCategory,
        points: defaultPoints,
        type: 'Count',
        target: 1,
        unit: 'reps',
        repeat: 'Daily',
        timeBlock: mappedTimeBlock,
        routineId: routine.id
      });

      // Update routine's habitIds list
      const nextHabitIds = [...routine.habitIds, newHabit.id];
      await api.updateRoutine(routine.id, { habitIds: nextHabitIds });

      setNewHabitName('');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to add new habit inline to routine:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveHabitInline = async (habitId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const nextHabitIds = routine.habitIds.filter(id => id !== habitId);
      await api.updateRoutine(routine.id, { habitIds: nextHabitIds });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to remove habit from routine:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 select-none cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b0e14] text-[#ecefed] rounded-t-[32px] sm:rounded-3xl w-full max-w-md border-t sm:border border-slate-850 shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden cursor-default"
      >
        {/* Top Handlebar indicator */}
        <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto my-3 shrink-0" />

        {/* Header section (Dark Slate/Black Theme) */}
        <div className="p-4 sm:p-6 pb-4 sm:pb-5 shrink-0 border-b border-slate-900">
          <div className="flex items-start justify-between gap-2">
            {/* Left: Icon, Title, and Meta block */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${rMeta.bgColor} border ${rMeta.borderColor} ${rMeta.textColor} flex items-center justify-center shrink-0 shadow-sm`}>
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight truncate leading-tight">
                  {routine.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                  <span className={rMeta.textColor}>{routine.timeBlock}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 stroke-none" />
                    {routine.points} XP
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">{rMeta.label}</span>
                </p>
              </div>
            </div>

            {/* Right: Close and Edit Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isEditing ? (
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/25 text-amber-400 font-extrabold text-[10px] sm:text-[11px] px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1 transition cursor-pointer min-h-[36px]"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3px]" />
                  <span>Done</span>
                </button>
              ) : (
                onEditRoutine && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-extrabold text-[10px] sm:text-[11px] px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer min-h-[36px]"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )
              )}
              <button 
                onClick={onClose}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-1.5 sm:p-2 rounded-full transition text-slate-400 hover:text-white cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Overall Progress Section (Image 2 style) */}
          <div className="mt-3 sm:mt-5 bg-[#121620] border border-slate-800/85 rounded-2xl p-3 sm:p-4">
            <div className="flex justify-between items-baseline mb-1.5 sm:mb-2">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Overall Progress</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                {rCompletedCount}/{rTotalCount} done
              </span>
            </div>
            
            <div className="w-full bg-slate-950 h-1.5 sm:h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${routineProgressPercent}%` }}
              />
            </div>

            <div className="flex justify-end mt-1">
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-slate-400">
                {routineProgressPercent}%
              </span>
            </div>
          </div>

          {/* Action Row: edit mode banner OR complete all button */}
          {isEditing ? (
            <div className="mt-3 sm:mt-4 bg-[#eab308]/5 border border-[#eab308]/30 text-amber-500 text-[10px] sm:text-xs font-black py-3 px-4 rounded-2xl flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Edit mode — remove habits or add new ones below</span>
            </div>
          ) : (
            <button
              onClick={() => {
                onMarkRoutineDone(routine);
                setTimeout(() => {
                  onClose();
                }, 600);
              }}
              disabled={isRoutineCompleted}
              className="w-full mt-3 sm:mt-4 bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 border border-transparent py-3 text-white font-black text-xs rounded-2xl transition shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 min-h-[42px]"
            >
              {isRoutineCompleted ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Routine Fully Completed!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white stroke-none animate-pulse" />
                  <span>⚡ 1-TAP Complete All</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Steps/Habits Scroll Container (Image 2 style) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-3 bg-[#121620]/30 flex-1 min-h-[120px]">
          {routineHabits.length === 0 && !isEditing ? (
            <div className="text-center py-6 text-slate-500 text-xs italic">
              No habits inside this routine.
            </div>
          ) : (
            <>
              {routineHabits.map((h) => {
                const val = h.history[selectedDate] || 0;
                const isDone = val >= h.target;
                const pct = h.target > 0 ? Math.min(100, Math.round((val / h.target) * 100)) : 0;
                const hMeta = getCategoryMetaForPopup(h.category);
                const StepIcon = hMeta.lucideIcon;

                if (isEditing) {
                  return (
                    <div 
                      key={h.id}
                      className="bg-[#121620] border border-slate-800 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 flex items-center justify-between gap-2 sm:gap-3 min-h-[48px] select-none"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Delete button on the left */}
                        <button
                          onClick={() => handleRemoveHabitInline(h.id)}
                          disabled={isSaving}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-200 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Category icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${hMeta.bgColor} ${hMeta.borderColor} ${hMeta.textColor} shrink-0`}>
                          <StepIcon className="w-4 h-4" />
                        </div>

                        {/* Text detail */}
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-xs font-black truncate text-white leading-snug">
                            {h.name}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 sm:gap-1.5 mt-0.5">
                            <span className={hMeta.textColor}>{hMeta.label}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-500 font-black">
                              <Zap className="w-2 h-2 fill-amber-500 stroke-none" />
                              {h.points || 0} pts
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Normal Mode View
                return (
                  <div 
                    key={h.id}
                    onClick={() => {
                      onLogHabit(h.id, isDone ? -h.target : (h.target - val));
                    }}
                    className="group bg-[#121620] hover:bg-[#151c2a] border border-slate-800 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer min-h-[58px] relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Circle check toggler */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogHabit(h.id, isDone ? -h.target : (h.target - val));
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${
                            isDone 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                              : 'border-slate-750 text-transparent hover:border-emerald-500 hover:text-emerald-500 bg-slate-900/40'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-4 h-4 stroke-[3px]" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-750" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1 text-left">
                          <h4 className={`text-xs font-black truncate leading-snug ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                            {h.name}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 sm:gap-1.5 mt-0.5">
                            <span className={hMeta.textColor}>{hMeta.label}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-500 font-black">
                              <Zap className="w-2.5 h-2.5 fill-amber-500 stroke-none" />
                              {h.points || 0} pts
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right column: Category icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${hMeta.bgColor} ${hMeta.borderColor} ${hMeta.textColor} shrink-0`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Progress tracking line at bottom */}
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[9px] font-mono font-bold text-slate-500">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Edit Mode Addition Card */}
              {isEditing && (
                <div className="border border-dashed border-[#eab308]/40 bg-[#121620]/20 rounded-2xl p-3 sm:p-4 space-y-2 mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddHabitInline}
                      disabled={isSaving || !newHabitName.trim()}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" />
                    </button>
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newHabitName.trim()) {
                            await handleAddHabitInline();
                          }
                        }
                      }}
                      placeholder="New habit name..."
                      className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 flex-1 font-black text-left"
                    />
                  </div>
                  <p className="text-[9px] text-amber-500/80 font-bold text-left pl-11">
                    Press Enter or tap Add — habit saved instantly
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
