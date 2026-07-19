import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Layers, 
  Target, 
  Dumbbell, 
  Apple, 
  BookOpen, 
  Sparkles,
  Flame,
  Plus
} from 'lucide-react';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  openCreateHabit: () => void;
  openCreateRoutine: () => void;
  onAddNutrition: (macros: { protein: number; carbs: number; fats: number; fiber: number; calories: number }) => void;
  onAddPoints: (points: number) => void;
  onAddCustomGoal?: (goal: { title: string; desc: string }) => void;
  onOpenLogFood: () => void;
}

export default function CreateModal({
  isOpen,
  onClose,
  openCreateHabit,
  openCreateRoutine,
  onAddNutrition,
  onAddPoints,
  onAddCustomGoal,
  onOpenLogFood,
}: CreateModalProps) {
  const [activeSubModal, setActiveSubModal] = useState<'none' | 'meal' | 'workout' | 'journal' | 'goal'>('none');

  // Meal Log State
  const [mealProtein, setMealProtein] = useState('30');
  const [mealCarbs, setMealCarbs] = useState('40');
  const [mealFats, setMealFats] = useState('12');
  const [mealFiber, setMealFiber] = useState('5');
  const [mealCalories, setMealCalories] = useState('450');

  // Workout Log State
  const [workoutType, setWorkoutType] = useState('Weightlifting');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutCalories, setWorkoutCalories] = useState('320');

  // Journal Log State
  const [journalText, setJournalText] = useState('');

  // Goal Log State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalPillar, setGoalPillar] = useState('Fitness');

  if (!isOpen) return null;

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNutrition({
      protein: parseFloat(mealProtein) || 0,
      carbs: parseFloat(mealCarbs) || 0,
      fats: parseFloat(mealFats) || 0,
      fiber: parseFloat(mealFiber) || 0,
      calories: parseFloat(mealCalories) || 0,
    });
    alert(`🥦 MEAL LOGGED SUCCESSFULLY!\nYour nutritional values for today have been updated. +10 Mission Points!`);
    onAddPoints(10);
    setActiveSubModal('none');
    onClose();
  };

  const handleWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`🏋️ WORKOUT LOGGED SUCCESSFULLY!\nYou completed a ${workoutDuration}-min ${workoutType} session and burned ${workoutCalories} kcal. +30 Mission Points!`);
    onAddPoints(30);
    setActiveSubModal('none');
    onClose();
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim()) return;
    alert(`📝 REFLECTION JOURNAL RECORDED!\nYour thoughts have been logged for Day 17. Keep reflecting! +15 Mission Points!`);
    onAddPoints(15);
    setJournalText('');
    setActiveSubModal('none');
    onClose();
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    if (onAddCustomGoal) {
      onAddCustomGoal({
        title: goalTitle,
        desc: `Target 90-day challenge goal in ${goalPillar} pillar.`
      });
    }
    alert(`🎯 NEW CHALLENGE TARGET SET!\n"${goalTitle}" is now live in your 90-day active mission board.`);
    setGoalTitle('');
    setActiveSubModal('none');
    onClose();
  };

  const actionCards = [
    { id: 'habit', title: 'Habit', desc: 'Track a daily habit or action', emoji: '✅', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', onClick: () => { openCreateHabit(); onClose(); } },
    { id: 'routine', title: 'Routine', desc: 'Group habits into a routine', emoji: '📦', color: 'bg-blue-50 text-blue-600 border-blue-100', onClick: () => { openCreateRoutine(); onClose(); } },
    { id: 'goal', title: 'Goal', desc: 'Set a goal you want to achieve', emoji: '🎯', color: 'bg-purple-50 text-purple-600 border-purple-100', onClick: () => setActiveSubModal('goal') },
    { id: 'workout', title: 'Workout', desc: 'Log a workout or activity', emoji: '🏋️', color: 'bg-rose-50 text-rose-600 border-rose-100', onClick: () => setActiveSubModal('workout') },
    { id: 'meal', title: 'Meal', desc: 'Log a meal and track nutrition', emoji: '🍴', color: 'bg-amber-50 text-amber-600 border-amber-100', onClick: () => { onClose(); onOpenLogFood(); } },
    { id: 'journal', title: 'Journal', desc: 'Write your thoughts and reflect', emoji: '📘', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', onClick: () => setActiveSubModal('journal') },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 select-none p-0 sm:p-4">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md p-5 pb-7 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl relative animate-slide-up max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        
        {/* Handle bar on top for native sheet look */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto sm:hidden shrink-0" />

        {activeSubModal === 'none' ? (
          // Main grid menu (Screenshot 3)
          <>
            <div className="flex justify-between items-center mt-2">
              <div>
                <h2 className="text-xl font-black text-[#0F172A] tracking-tight">Create</h2>
                <p className="text-gray-450 text-xs font-semibold">Add something to your mission</p>
              </div>
              <button 
                onClick={onClose}
                className="bg-slate-50 p-2 rounded-full border border-gray-150 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {actionCards.map((card) => (
                <button
                  key={card.id}
                  onClick={card.onClick}
                  className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-300 shadow-xs flex flex-col items-start text-left transition-all duration-350 cursor-pointer group hover:scale-[1.02]"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${card.color}`}>
                    {card.emoji}
                  </div>
                  <h3 className="text-xs font-extrabold text-[#0F172A] mt-3 group-hover:text-emerald-600 transition">
                    {card.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-medium">
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          // Sub-modals for logger activities
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-[#0F172A] tracking-tight uppercase">
                {activeSubModal === 'meal' && '🍴 Log Meal & Macros'}
                {activeSubModal === 'workout' && '🏋️ Record Workout'}
                {activeSubModal === 'journal' && '📘 Day Reflection Journal'}
                {activeSubModal === 'goal' && '🎯 Set New Active Target'}
              </h3>
              <button 
                onClick={() => setActiveSubModal('none')}
                className="text-xs font-bold text-gray-450 hover:text-gray-700 transition"
              >
                &lt; Back
              </button>
            </div>

            {activeSubModal === 'meal' && (
              <form onSubmit={handleMealSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Protein (g)</label>
                    <input type="number" value={mealProtein} onChange={e => setMealProtein(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Carbs (g)</label>
                    <input type="number" value={mealCarbs} onChange={e => setMealCarbs(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Fats (g)</label>
                    <input type="number" value={mealFats} onChange={e => setMealFats(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Fiber (g)</label>
                    <input type="number" value={mealFiber} onChange={e => setMealFiber(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Calories (kcal)</label>
                  <input type="number" value={mealCalories} onChange={e => setMealCalories(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-500/10 mt-2 cursor-pointer">
                  Save Meal Logs
                </button>
              </form>
            )}

            {activeSubModal === 'workout' && (
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Workout Type</label>
                  <select value={workoutType} onChange={e => setWorkoutType(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500">
                    <option value="Weightlifting">🏋️ Weightlifting / Strength</option>
                    <option value="Running">🏃 Running / Cardio</option>
                    <option value="HIIT">🔥 HIIT / Circuit Training</option>
                    <option value="Yoga">🧘 Yoga / Stretching</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Duration (mins)</label>
                    <input type="number" value={workoutDuration} onChange={e => setWorkoutDuration(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Kcal Burned</label>
                    <input type="number" value={workoutCalories} onChange={e => setWorkoutCalories(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-500/10 mt-2 cursor-pointer">
                  Log Workout Session
                </button>
              </form>
            )}

            {activeSubModal === 'journal' && (
              <form onSubmit={handleJournalSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Reflection thoughts</label>
                  <textarea rows={4} placeholder="Write your thoughts, micro-wins, or gratitude..." value={journalText} onChange={e => setJournalText(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500" required />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-500/10 mt-2 cursor-pointer">
                  Submit Reflection
                </button>
              </form>
            )}

            {activeSubModal === 'goal' && (
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Goal Title</label>
                  <input type="text" placeholder="e.g. Run 5K in under 25 mins" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Select Pillar</label>
                  <select value={goalPillar} onChange={e => setGoalPillar(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500">
                    <option value="Fitness">🏋️ Fitness</option>
                    <option value="Nutrition">🥗 Nutrition</option>
                    <option value="Career">💻 Career</option>
                    <option value="Recovery">😴 Recovery</option>
                    <option value="Mind">🧠 Mind</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-500/10 mt-2 cursor-pointer">
                  Activate Challenge Target
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
