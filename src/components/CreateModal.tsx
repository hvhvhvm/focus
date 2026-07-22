import React, { useEffect, useState } from 'react';
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
import { Category, NutritionTargets, PillarGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getDietPreferences, saveDietPreferences } from '../lib/dietPreferences';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  openCreateHabit: () => void;
  openCreateRoutine: () => void;
  onAddNutrition: (macros: { protein: number; carbs: number; fats: number; fiber: number; calories: number }) => void;
  onAddPoints: (points: number) => void;
  onAddCustomGoal?: (goal: Omit<PillarGoal, 'id' | 'createdAt'>) => void;
  nutritionTargets: NutritionTargets;
  onUpdateNutritionTargets: (targets: NutritionTargets) => void;
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
  nutritionTargets,
  onUpdateNutritionTargets,
  onOpenLogFood,
}: CreateModalProps) {
  const [activeSubModal, setActiveSubModal] = useState<'none' | 'meal' | 'workout' | 'journal' | 'goal' | 'dietTargets'>('none');

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
  const [goalPillar, setGoalPillar] = useState<Category>('Fitness');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDesc, setGoalDesc] = useState('');

  const [targetProtein, setTargetProtein] = useState(String(nutritionTargets.protein));
  const [targetCarbs, setTargetCarbs] = useState(String(nutritionTargets.carbs));
  const [targetFats, setTargetFats] = useState(String(nutritionTargets.fats));
  const [targetFiber, setTargetFiber] = useState(String(nutritionTargets.fiber));
  const [targetCalories, setTargetCalories] = useState(String(nutritionTargets.calories));
  const [targetWater, setTargetWater] = useState(String((getDietPreferences().waterGoalMl || 3000) / 1000));

  useEffect(() => {
    setTargetProtein(String(nutritionTargets.protein));
    setTargetCarbs(String(nutritionTargets.carbs));
    setTargetFats(String(nutritionTargets.fats));
    setTargetFiber(String(nutritionTargets.fiber));
    setTargetCalories(String(nutritionTargets.calories));
    setTargetWater(String((getDietPreferences().waterGoalMl || 3000) / 1000));
  }, [nutritionTargets, isOpen]);

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
        title: goalTitle.trim(),
        pillar: goalPillar,
        target: goalTarget.trim() || undefined,
        desc: goalDesc.trim() || `90-day challenge goal in the ${goalPillar} pillar.`,
      });
    }
    setGoalTitle('');
    setGoalTarget('');
    setGoalDesc('');
    setActiveSubModal('none');
    onClose();
  };

  const handleDietTargetsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNutritionTargets({
      protein: Math.max(0, Number(targetProtein) || 0),
      carbs: Math.max(0, Number(targetCarbs) || 0),
      fats: Math.max(0, Number(targetFats) || 0),
      fiber: Math.max(0, Number(targetFiber) || 0),
      calories: Math.max(0, Number(targetCalories) || 0),
    });
    setActiveSubModal('none');
    onClose();
  };
  const actionCards = [
    { id: 'habit', title: 'Habit', desc: 'Track one daily action', emoji: 'H', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', onClick: () => { openCreateHabit(); onClose(); } },
    { id: 'routine', title: 'Routine', desc: 'Stack habits together', emoji: 'R', color: 'bg-blue-50 text-blue-600 border-blue-100', onClick: () => { openCreateRoutine(); onClose(); } },
    { id: 'goal', title: 'Pillar Goal', desc: 'Add a 90-day target', emoji: 'G', color: 'bg-violet-50 text-violet-600 border-violet-100', onClick: () => setActiveSubModal('goal') },
    { id: 'dietTargets', title: 'Diet Targets', desc: 'Edit macros and calories', emoji: 'D', color: 'bg-amber-50 text-amber-600 border-amber-100', onClick: () => setActiveSubModal('dietTargets') },
    { id: 'meal', title: 'Food Log', desc: 'Log a meal with macros', emoji: 'F', color: 'bg-orange-50 text-orange-600 border-orange-100', onClick: () => { onClose(); onOpenLogFood(); } },
    { id: 'journal', title: 'Journal', desc: 'Capture a reflection', emoji: 'J', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', onClick: () => setActiveSubModal('journal') },
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
                {activeSubModal === 'meal' && 'Log Meal & Macros'}
                {activeSubModal === 'workout' && 'Record Workout'}
                {activeSubModal === 'journal' && 'Day Reflection Journal'}
                {activeSubModal === 'goal' && 'Set Pillar Goal'}
                {activeSubModal === 'dietTargets' && 'Edit Diet Targets'}
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
                  <input type="text" placeholder="e.g. Cut to 72kg, finish React project" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Measurable Target</label>
                  <input type="text" placeholder="e.g. 5 workouts/week, 150g protein/day" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Pillar</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['Fitness', 'Nutrition', 'Career', 'Recovery', 'Mind'] as Category[]).map((pillar) => (
                      <button
                        key={pillar}
                        type="button"
                        onClick={() => setGoalPillar(pillar)}
                        className={`py-2 rounded-xl border text-[9px] font-black transition cursor-pointer ${
                          goalPillar === pillar
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-slate-50 text-gray-500 border-gray-150 hover:border-gray-300'
                        }`}
                      >
                        {pillar.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Why it matters</label>
                  <textarea rows={3} placeholder="Short reason or success rule..." value={goalDesc} onChange={e => setGoalDesc(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md mt-2 cursor-pointer">
                  Pin Goal To Pillar
                </button>
              </form>
            )}

            {activeSubModal === 'dietTargets' && (
              <form onSubmit={handleDietTargetsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Protein', value: targetProtein, setValue: setTargetProtein, unit: 'g' },
                    { label: 'Carbs', value: targetCarbs, setValue: setTargetCarbs, unit: 'g' },
                    { label: 'Fats', value: targetFats, setValue: setTargetFats, unit: 'g' },
                    { label: 'Fiber', value: targetFiber, setValue: setTargetFiber, unit: 'g' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">{field.label} ({field.unit})</label>
                      <input type="number" min="0" value={field.value} onChange={e => field.setValue(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-450 uppercase block mb-1">Calories (kcal)</label>
                  <input type="number" min="0" value={targetCalories} onChange={e => setTargetCalories(e.target.value)} className="w-full bg-slate-50 border border-gray-150 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-amber-500/10 mt-2 cursor-pointer">
                  Save Diet Targets
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
