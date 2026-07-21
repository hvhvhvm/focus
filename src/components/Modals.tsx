import React, { useState } from 'react';
import { X, Zap, Clock, Sparkles, Clipboard, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Category, Habit, HabitType, Routine } from '../types';
import { motion } from 'motion/react';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (habitData: Partial<Habit>) => void;
  routines: Routine[];
}

export function CreateHabitModal({ isOpen, onClose, onCreate, routines }: CreateHabitModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Fitness');
  const [points, setPoints] = useState(10);
  const [type, setType] = useState<HabitType>('Count');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('reps');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');
  const [timeBlock, setTimeBlock] = useState<'Anytime' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Anytime');
  const [enableFocusTimer, setEnableFocusTimer] = useState(false);
  const [routineId, setRoutineId] = useState('');

  const categories: { id: Category; label: string; icon: string; activeClass: string }[] = [
    { id: 'Fitness', label: 'Fitness', icon: '🏃', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/5' },
    { id: 'Nutrition', label: 'Nutrition', icon: '🥗', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/5' },
    { id: 'Career', label: 'Career', icon: '💻', activeClass: 'border-sky-500 bg-sky-500/10 text-sky-400 ring-2 ring-sky-500/5' },
    { id: 'Recovery', label: 'Recovery', icon: '😴', activeClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/5' },
    { id: 'Mind', label: 'Mind', icon: '🧠', activeClass: 'border-amber-500 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/5' },
  ];

  const timeBlocks = [
    { id: 'Anytime' as const, label: 'Anytime', icon: '🔄', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/5' },
    { id: 'Morning' as const, label: 'Morning', icon: '☀️', activeClass: 'border-[#FDAF17] bg-[#FDAF17]/10 text-[#FDAF17] ring-2 ring-[#FDAF17]/5' },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: '🌤️', activeClass: 'border-[#12B886] bg-[#12B886]/10 text-[#12B886] ring-2 ring-[#12B886]/5' },
    { id: 'Evening' as const, label: 'Evening', icon: '🌇', activeClass: 'border-[#F06A33] bg-[#F06A33]/10 text-[#F06A33] ring-2 ring-[#F06A33]/5' },
    { id: 'Night' as const, label: 'Night', icon: '🌙', activeClass: 'border-[#7952B3] bg-[#7952B3]/10 text-[#B197FC] ring-2 ring-[#7952B3]/5' },
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name,
      category,
      points,
      type,
      target: Number(target),
      unit: type === 'Timer' ? 'min' : unit || 'reps',
      repeat,
      timeBlock,
      enableFocusTimer,
      routineId: routineId || undefined,
    });
    
    // Reset properties to default state
    setName('');
    setCategory('Fitness');
    setPoints(10);
    setType('Count');
    setTarget(1);
    setUnit('reps');
    setRepeat('Daily');
    setTimeBlock('Anytime');
    setEnableFocusTimer(false);
    setRoutineId('');
  };

  const pointPresets = [5, 10, 15, 25, 50];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: '50%' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#0C0E14] border-t sm:border border-[#232734] rounded-t-[24px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden text-left font-sans"
      >
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#1A1E29] relative z-10 shrink-0">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#12B886] uppercase">
              HABIT CONSTRUCTOR
            </span>
            <h3 className="text-lg font-extrabold text-white font-sans mt-0.5 flex items-center">
              <Sparkles className="w-4 h-4 text-[#12B886] mr-2 animate-pulse" />
              Create New Habit
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#1A1D27] border border-transparent hover:border-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Habit Title */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                HABIT TITLE
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pull ups, Sleep early, Read 1 chapter"
                required
                className="w-full bg-[#13151D] border border-[#252A39] focus:border-[#12B886] focus:ring-1 focus:ring-[#12B886]/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans shadow-inner"
              />
            </div>

            {/* Category Focus */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1.5">
                CATEGORY FOCUS
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {categories.map((cat) => {
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                        isActive
                          ? cat.activeClass
                          : 'border-[#1C1F2B] bg-[#12141A]/60 text-gray-400 hover:text-gray-200 hover:bg-[#1A1D27]'
                      }`}
                    >
                      <span className="text-lg mb-0.5">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Type & Frequency */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                  ACTION TYPE
                </label>
                <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setType('Count');
                      setUnit('reps');
                    }}
                    className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                      type === 'Count'
                        ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Count
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('Timer');
                      setUnit('min');
                    }}
                    className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                      type === 'Timer'
                        ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Timer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                  FREQUENCY
                </label>
                <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                  {(['Daily', 'Today Only'] as const).map((opt) => {
                    const isSel = repeat === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRepeat(opt)}
                        className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                          isSel
                            ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Points & presets bar */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                AWARD POINTS
              </label>
              <div className="bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center text-white font-extrabold text-xs font-sans shrink-0">
                  <Zap className="w-4 h-4 text-[#FCC419] mr-1.5 fill-[#FCC419]" />
                  <span>{points} pts</span>
                </div>
                
                <div className="flex gap-1 max-w-xs justify-end flex-1">
                  {pointPresets.map((val) => {
                    const isSel = points === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPoints(val)}
                        className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg border transition cursor-pointer ${
                          isSel
                            ? 'bg-[#FCC419]/10 text-[#FCC419] border-[#FCC419]/30'
                            : 'bg-[#1A1D27]/80 hover:bg-gray-800 text-gray-400 border-[#242939]'
                        }`}
                      >
                        +{val}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Specifications */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                  TARGET OBJECTIVE
                </label>
                <div className="flex items-center space-x-1 bg-[#13151D] border border-[#252A39] rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setTarget(Math.max(1, target - 1))}
                    className="w-6 h-6 rounded-lg bg-[#242A38] border border-[#3E4962] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={target}
                    onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent border-0 text-center text-white focus:outline-none focus:ring-0 font-bold font-mono text-xs p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setTarget(target + 1)}
                    className="w-6 h-6 rounded-lg bg-[#242A38] border border-[#3E4962] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                  MEASUREMENT UNIT
                </label>
                <input
                  type="text"
                  disabled={type === 'Timer'}
                  value={type === 'Timer' ? 'min' : unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="reps, times, pages, km"
                  className={`w-full bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-2 text-center text-xs text-white focus:outline-none focus:border-[#12B886] font-mono ${type === 'Timer' ? 'opacity-40 select-none' : ''}`}
                />
              </div>
            </div>

            {/* Time Block Selection */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-500" />
                TIME BLOCK (OPTIONAL)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {timeBlocks.map((blk) => {
                  const isActive = timeBlock === blk.id;
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => setTimeBlock(blk.id)}
                      className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isActive
                          ? blk.activeClass
                          : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-400 hover:bg-[#1A1D27] hover:text-white'
                      }`}
                    >
                      <span className="text-base mb-0.5">{blk.icon}</span>
                      <span className="text-[9px] font-bold font-sans select-none">{blk.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link Routine */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1 flex items-center">
                <Clipboard className="w-3 h-3 mr-1 text-gray-500" />
                LINK ROUTINE (OPTIONAL)
              </label>
              <select
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value)}
                className="w-full bg-[#13151D] border border-[#252A39] focus:border-[#12B886] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-sans"
              >
                <option value="">None (Independent)</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Pomodoro slider box */}
            <div className="bg-[#13151D] border border-[#252A39] p-3 rounded-xl flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="focusTimerCheck"
                checked={enableFocusTimer}
                onChange={(e) => setEnableFocusTimer(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 text-[#12B886] border border-gray-750 rounded bg-[#13151D] focus:ring-[#12B886]"
              />
              <div>
                <label htmlFor="focusTimerCheck" className="text-xs font-bold text-white select-none cursor-pointer font-sans block flex items-center">
                  Enable Focus Clock (Pomodoro Mode)
                </label>
                <p className="text-[9px] text-gray-500 font-sans mt-0.5 leading-tight">
                  Adds interactive stopwatch/clock tools directly inside the habit card listing.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 md:p-5 border-t border-[#1A1E29] bg-[#0C0E14] flex space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#151722] hover:bg-[#1E2131] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-[11px] font-extrabold text-[#0B0F19] py-2.5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
            >
              Construct Habit
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (routineData: any) => void;
}

export function CreateRoutineModal({ isOpen, onClose, onCreate }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [awardPoints, setAwardPoints] = useState(25);
  const [timeBlock, setTimeBlock] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant'>('Morning');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');
  const [category, setCategory] = useState<Category>('Fitness');
  const [habitLines, setHabitLines] = useState<string[]>(['']);

  const categories: { id: Category; label: string; icon: string; activeClass: string }[] = [
    { id: 'Fitness', label: 'Fitness', icon: '🏃', activeClass: 'border-purple-500 bg-purple-500/10 text-purple-400 ring-2 ring-purple-500/5' },
    { id: 'Nutrition', label: 'Nutrition', icon: '🥗', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/5' },
    { id: 'Career', label: 'Career', icon: '💻', activeClass: 'border-sky-500 bg-sky-500/10 text-sky-400 ring-2 ring-sky-500/5' },
    { id: 'Recovery', label: 'Recovery', icon: '😴', activeClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/5' },
    { id: 'Mind', label: 'Mind', icon: '🧠', activeClass: 'border-amber-500 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/5' },
  ];

  const timeBlocks = [
    { id: 'Morning' as const, label: 'Morning', icon: '☀️', activeClass: 'border-[#FDAF17] bg-[#FDAF17]/10 text-white shadow-md ring-2 ring-[#FDAF17]/5' },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: '🌤️', activeClass: 'border-[#12B886] bg-[#12B886]/10 text-white shadow-md ring-2 ring-[#12B886]/5' },
    { id: 'Evening' as const, label: 'Evening', icon: '🌇', activeClass: 'border-[#F06A33] bg-[#F06A33]/10 text-white shadow-md ring-2 ring-[#F06A33]/5' },
    { id: 'Night' as const, label: 'Night', icon: '🌙', activeClass: 'border-[#7952B3] bg-[#7952B3]/10 text-[#B197FC] shadow-md ring-2 ring-[#7952B3]/5' },
    { id: 'Constant' as const, label: 'Constant', icon: '🔄', activeClass: 'border-purple-500 bg-purple-500/10 text-white shadow-md ring-2 ring-purple-500/5' },
  ];

  if (!isOpen) return null;

  const handleAddHabitLine = () => {
    setHabitLines([...habitLines, '']);
  };

  const handleHabitLineChange = (idx: number, value: string) => {
    const updated = [...habitLines];
    updated[idx] = value;
    setHabitLines(updated);
  };

  const handleRemoveHabitLine = (idx: number) => {
    setHabitLines(habitLines.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validNames = habitLines.filter(line => line.trim() !== '');

    onCreate({
      name,
      points: Number(awardPoints),
      timeBlock,
      repeat,
      category,
      habitNames: validNames,
    });

    // Reset modals variables
    setName('');
    setAwardPoints(25);
    setTimeBlock('Morning');
    setRepeat('Daily');
    setCategory('Fitness');
    setHabitLines(['']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: '50%' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#0C0E14] border-t sm:border border-[#232734] rounded-t-[24px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden text-left font-sans"
      >
        
        {/* Subtle top decoration light */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full blur-2xl pointer-events-none" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#1A1E29] shrink-0 relative z-10">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#B197FC] uppercase">
              ROUTINE ARCHITECT
            </span>
            <h3 className="text-lg font-extrabold text-white font-sans mt-0.5 flex items-center">
              <Clipboard className="w-4 h-4 text-purple-400 mr-2" />
              Build New Routine
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#1A1D27] border border-transparent hover:border-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Main Title Input */}
            <div className="flex items-center space-x-2.5">
              <div className="bg-[#B197FC]/10 text-[#B197FC] p-2.5 rounded-xl border border-[#B197FC]/20 shrink-0">
                <Plus className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Routine Name (e.g. Morning Focus, Evening Wind-Down)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#13151D] border border-[#252A39] focus:border-[#B197FC] focus:ring-1 focus:ring-[#B197FC]/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans shadow-inner"
                />
              </div>
            </div>

            {/* Points Bonus layout with input merged nicely */}
            <div className="bg-[#13151D] border border-[#252A39] rounded-xl p-3">
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                ROUTINE COMPLETION BONUS POINTS
              </label>
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1.5 bg-[#1C1F2B] border border-gray-850 px-2 py-1 rounded-lg shrink-0">
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(Math.max(5, Number(e.target.value)))}
                    className="w-10 bg-transparent border-0 text-center text-xs font-black text-[#FCC419] focus:outline-none focus:ring-0 font-mono p-0"
                  />
                  <span className="text-[10px] text-gray-500">PT</span>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">
                  Awarded as bonus when you clear all routine tasks today.
                </span>
              </div>
            </div>

            {/* Assigned Time Block */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                ASSIGNED TIME BLOCK
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {timeBlocks.map((blk) => {
                  const isActive = timeBlock === blk.id;
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => setTimeBlock(blk.id)}
                      className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isActive
                          ? blk.activeClass
                          : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-450 hover:bg-[#1A1D27] hover:text-white'
                      }`}
                    >
                      <span className="text-base mb-0.5">{blk.icon}</span>
                      <span className="text-[9px] font-bold font-sans select-none">{blk.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Routine Step Category */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                ROUTINE STEP CATEGORY
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {categories.map((cat) => {
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                        isActive
                          ? cat.activeClass
                          : 'border-[#1C1F2B] bg-[#12141A]/60 text-gray-400 hover:text-gray-200 hover:bg-[#1A1D27]'
                      }`}
                    >
                      <span className="text-lg mb-0.5">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Repeat Schedule */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                REPEAT SCHEDULE
              </label>
              <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                {(['Daily', 'Custom Days', 'Today Only'] as const).map((opt) => {
                  const isSel = repeat === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRepeat(opt)}
                      className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                        isSel
                          ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Habit StepsDraft Timeline */}
            <div>
              <label className="block text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                INCLUDE HABIT STEPS ({habitLines.filter(h => h.trim() !== '').length} DRAFT)
              </label>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 select-none">
                {habitLines.map((line, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#181C26] border border-gray-800 text-purple-400 text-[10px] font-mono font-black flex items-center justify-center rounded-lg shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Meditate for 10 min, Gym progression"
                      value={line}
                      onChange={(e) => handleHabitLineChange(index, e.target.value)}
                      className="flex-1 bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans shadow-inner"
                    />
                    {habitLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHabitLine(index)}
                        className="text-gray-500 hover:text-red-400 hover:bg-gray-800 transition text-[10px] font-bold font-mono px-2 py-1 rounded cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddHabitLine}
                className="mt-2 w-full flex items-center justify-center py-2 border border-dashed border-purple-500/15 hover:border-purple-500/30 rounded-xl text-[10px] font-bold text-purple-400 hover:bg-[#1A1C28]/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add custom steps to timeline</span>
              </button>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 md:p-5 border-t border-[#1A1E29] bg-[#0C0E14] flex space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#151722]/85 hover:bg-[#1E2131] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-450 hover:to-indigo-450 text-[11px] font-extrabold text-white py-2.5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
            >
              Build Routine ({habitLines.filter(h => h.trim() !== '').length})
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── EDIT HABIT MODAL ──────────────────────────────────────────────────────────
interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  onSave: (habitId: string, data: Partial<Habit>) => void;
}

export function EditHabitModal({ isOpen, onClose, habit, onSave }: EditHabitModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Fitness');
  const [points, setPoints] = useState(10);
  const [type, setType] = useState<HabitType>('Count');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('reps');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');
  const [timeBlock, setTimeBlock] = useState<'Anytime' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Anytime');
  const [enableFocusTimer, setEnableFocusTimer] = useState(false);

  React.useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setPoints(habit.points);
      setType(habit.type);
      setTarget(habit.target);
      setUnit(habit.unit);
      setRepeat(habit.repeat);
      setTimeBlock((habit.timeBlock as any) || 'Anytime');
      setEnableFocusTimer(habit.enableFocusTimer);
    }
  }, [habit]);

  const categories: { id: Category; label: string; icon: string; activeClass: string }[] = [
    { id: 'Fitness', label: 'Fitness', icon: '🏃', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/5' },
    { id: 'Nutrition', label: 'Nutrition', icon: '🥗', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/5' },
    { id: 'Career', label: 'Career', icon: '💻', activeClass: 'border-sky-500 bg-sky-500/10 text-sky-400 ring-2 ring-sky-500/5' },
    { id: 'Recovery', label: 'Recovery', icon: '😴', activeClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/5' },
    { id: 'Mind', label: 'Mind', icon: '🧠', activeClass: 'border-amber-500 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/5' },
  ];

  const timeBlocks = [
    { id: 'Anytime' as const, label: 'Anytime', icon: '🔄', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/5' },
    { id: 'Morning' as const, label: 'Morning', icon: '☀️', activeClass: 'border-[#FDAF17] bg-[#FDAF17]/10 text-[#FDAF17] ring-2 ring-[#FDAF17]/5' },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: '🌤️', activeClass: 'border-[#12B886] bg-[#12B886]/10 text-[#12B886] ring-2 ring-[#12B886]/5' },
    { id: 'Evening' as const, label: 'Evening', icon: '🌇', activeClass: 'border-[#F06A33] bg-[#F06A33]/10 text-[#F06A33] ring-2 ring-[#F06A33]/5' },
    { id: 'Night' as const, label: 'Night', icon: '🌙', activeClass: 'border-[#7952B3] bg-[#7952B3]/10 text-[#B197FC] ring-2 ring-[#7952B3]/5' },
  ];

  const pointPresets = [5, 10, 15, 25, 50];

  if (!isOpen || !habit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(habit.id, { name, category, points, type, target: Number(target), unit: type === 'Timer' ? 'min' : unit || 'reps', repeat, timeBlock, enableFocusTimer });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: '50%' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#0C0E14] border-t sm:border border-[#232734] rounded-t-[24px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden text-left font-sans"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#1A1E29] relative z-10 shrink-0">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">HABIT EDITOR</span>
            <h3 className="text-lg font-extrabold text-white font-sans mt-0.5 flex items-center">
              <Sparkles className="w-4 h-4 text-blue-400 mr-2" />Edit Habit
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#1A1D27] border border-transparent hover:border-gray-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">HABIT TITLE</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#13151D] border border-[#252A39] focus:border-blue-400 focus:ring-1 focus:ring-blue-400/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1.5">CATEGORY</label>
              <div className="grid grid-cols-3 gap-1.5">
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-150 ${category === cat.id ? cat.activeClass : 'border-[#1C1F2B] bg-[#12141A]/60 text-gray-400 hover:text-gray-200 hover:bg-[#1A1D27]'}`}>
                    <span className="text-lg mb-0.5">{cat.icon}</span><span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">ACTION TYPE</label>
                <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                  {(['Count', 'Timer'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => { setType(t); if (t === 'Timer') setUnit('min'); else setUnit('reps'); }} className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${type === t ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm' : 'text-gray-400 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">FREQUENCY</label>
                <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                  {(['Daily', 'Today Only'] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => setRepeat(opt)} className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${repeat === opt ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm' : 'text-gray-400 hover:text-white'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">AWARD POINTS</label>
              <div className="bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center text-white font-extrabold text-xs shrink-0">
                  <Zap className="w-4 h-4 text-[#FCC419] mr-1.5 fill-[#FCC419]" /><span>{points} pts</span>
                </div>
                <div className="flex gap-1">
                  {pointPresets.map((val) => (
                    <button key={val} type="button" onClick={() => setPoints(val)} className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg border transition cursor-pointer ${points === val ? 'bg-[#FCC419]/10 text-[#FCC419] border-[#FCC419]/30' : 'bg-[#1A1D27]/80 text-gray-400 border-[#242939] hover:bg-gray-800'}`}>+{val}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">TARGET</label>
                <div className="flex items-center space-x-1 bg-[#13151D] border border-[#252A39] rounded-xl px-2 py-1">
                  <button type="button" onClick={() => setTarget(Math.max(1, target - 1))} className="w-6 h-6 rounded-lg bg-[#242A38] border border-[#3E4962] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition">-</button>
                  <input type="number" min="1" value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} className="w-full bg-transparent border-0 text-center text-white focus:outline-none focus:ring-0 font-bold font-mono text-xs p-0" />
                  <button type="button" onClick={() => setTarget(target + 1)} className="w-6 h-6 rounded-lg bg-[#242A38] border border-[#3E4962] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">UNIT</label>
                <input type="text" disabled={type === 'Timer'} value={type === 'Timer' ? 'min' : unit} onChange={(e) => setUnit(e.target.value)} placeholder="reps, times, pages" className={`w-full bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-2 text-center text-xs text-white focus:outline-none focus:border-blue-400 font-mono ${type === 'Timer' ? 'opacity-40' : ''}`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-500" />TIME BLOCK
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {timeBlocks.map((blk) => (
                  <button key={blk.id} type="button" onClick={() => setTimeBlock(blk.id)} className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border transition-all duration-150 cursor-pointer ${timeBlock === blk.id ? blk.activeClass : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-400 hover:bg-[#1A1D27] hover:text-white'}`}>
                    <span className="text-base mb-0.5">{blk.icon}</span>
                    <span className="text-[9px] font-bold">{blk.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#13151D] border border-[#252A39] p-3 rounded-xl flex items-start space-x-2.5">
              <input type="checkbox" id="editFocusTimerCheck" checked={enableFocusTimer} onChange={(e) => setEnableFocusTimer(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-blue-400 border border-gray-750 rounded bg-[#13151D] focus:ring-blue-400" />
              <div>
                <label htmlFor="editFocusTimerCheck" className="text-xs font-bold text-white select-none cursor-pointer block">Enable Focus Clock (Pomodoro Mode)</label>
                <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">Adds interactive stopwatch/clock tools directly inside the habit card.</p>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-5 border-t border-[#1A1E29] bg-[#0C0E14] flex space-x-2.5 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 bg-[#151722] hover:bg-[#1E2131] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-[11px] font-extrabold text-white py-2.5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider">Save Changes</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── EDIT ROUTINE MODAL ─────────────────────────────────────────────────────────
interface EditRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine | null;
  onSave: (routineId: string, data: { name: string; points: number; timeBlock: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant'; repeat: 'Daily' | 'Custom Days' | 'Today Only' }) => void;
}

export function EditRoutineModal({ isOpen, onClose, routine, onSave }: EditRoutineModalProps) {
  const [name, setName] = useState('');
  const [points, setPoints] = useState(25);
  const [timeBlock, setTimeBlock] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant'>('Morning');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');

  React.useEffect(() => {
    if (routine) {
      setName(routine.name);
      setPoints(routine.points);
      setTimeBlock(routine.timeBlock);
      setRepeat(routine.repeat);
    }
  }, [routine]);

  const timeBlocks = [
    { id: 'Morning' as const, label: 'Morning', icon: '☀️', activeClass: 'border-[#FDAF17] bg-[#FDAF17]/10 text-white shadow-md ring-2 ring-[#FDAF17]/5' },
    { id: 'Afternoon' as const, label: 'Afternoon', icon: '🌤️', activeClass: 'border-[#12B886] bg-[#12B886]/10 text-white shadow-md ring-2 ring-[#12B886]/5' },
    { id: 'Evening' as const, label: 'Evening', icon: '🌇', activeClass: 'border-[#F06A33] bg-[#F06A33]/10 text-white shadow-md ring-2 ring-[#F06A33]/5' },
    { id: 'Night' as const, label: 'Night', icon: '🌙', activeClass: 'border-[#7952B3] bg-[#7952B3]/10 text-[#B197FC] shadow-md ring-2 ring-[#7952B3]/5' },
    { id: 'Constant' as const, label: 'Anytime', icon: '🔄', activeClass: 'border-purple-500 bg-purple-500/10 text-white shadow-md ring-2 ring-purple-500/5' },
  ];

  if (!isOpen || !routine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(routine.id, { name, points, timeBlock, repeat });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: '50%' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#0C0E14] border-t sm:border border-[#232734] rounded-t-[24px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden text-left font-sans"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#1A1E29] relative z-10 shrink-0">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-purple-400 uppercase">ROUTINE EDITOR</span>
            <h3 className="text-lg font-extrabold text-white font-sans mt-0.5 flex items-center">
              <Clipboard className="w-4 h-4 text-purple-400 mr-2" />Edit Routine
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#1A1D27] border border-transparent hover:border-gray-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">ROUTINE NAME</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#13151D] border border-[#252A39] focus:border-purple-400 focus:ring-1 focus:ring-purple-400/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans" />
            </div>
            <div className="bg-[#13151D] border border-[#252A39] rounded-xl p-3">
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">COMPLETION BONUS POINTS</label>
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1.5 bg-[#1C1F2B] border border-gray-850 px-2 py-1 rounded-lg shrink-0">
                  <input type="number" min="5" max="500" value={points} onChange={(e) => setPoints(Math.max(5, Number(e.target.value)))} className="w-10 bg-transparent border-0 text-center text-xs font-black text-[#FCC419] focus:outline-none focus:ring-0 font-mono p-0" />
                  <span className="text-[10px] text-gray-500">PT</span>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">Awarded when you clear all routine tasks today.</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">ASSIGNED TIME BLOCK</label>
              <div className="grid grid-cols-5 gap-1.5">
                {timeBlocks.map((blk) => (
                  <button key={blk.id} type="button" onClick={() => setTimeBlock(blk.id)} className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border transition-all duration-150 cursor-pointer ${timeBlock === blk.id ? blk.activeClass : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-450 hover:bg-[#1A1D27] hover:text-white'}`}>
                    <span className="text-base mb-0.5">{blk.icon}</span>
                    <span className="text-[9px] font-bold select-none">{blk.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">REPEAT SCHEDULE</label>
              <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
                {(['Daily', 'Custom Days', 'Today Only'] as const).map((opt) => (
                  <button key={opt} type="button" onClick={() => setRepeat(opt)} className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${repeat === opt ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm' : 'text-gray-400 hover:text-white'}`}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 md:p-5 border-t border-[#1A1E29] bg-[#0C0E14] flex space-x-2.5 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 bg-[#151722]/85 hover:bg-[#1E2131] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-[11px] font-extrabold text-white py-2.5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider">Save Routine</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
