import React, { useState } from 'react';
import { 
  Apple, 
  Trash2, 
  Edit3, 
  Scale, 
  Utensils, 
  RotateCcw,
  PlusCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export interface LoggedFood {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  calories: number;
  timestamp: string;
  date?: string;
}

export interface DietScreenProps {
  nutritionToday: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  };
  nutritionTargets: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    calories: number;
  };
  loggedFoods: LoggedFood[];
  onAddFood: (food: Omit<LoggedFood, 'id' | 'timestamp'>) => void;
  onRemoveFood: (id: string) => void;
  onUpdateTargets: (targets: { protein: number; carbs: number; fats: number; fiber: number; calories: number }) => void;
  onClearLogs: () => void;
  onBack?: () => void;
}

export default function DietScreen({
  nutritionToday,
  nutritionTargets,
  loggedFoods,
  onAddFood,
  onRemoveFood,
  onUpdateTargets,
  onClearLogs,
  onBack,
}: DietScreenProps) {
  // Goal editing state
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editProtein, setEditProtein] = useState(String(nutritionTargets.protein));
  const [editCarbs, setEditCarbs] = useState(String(nutritionTargets.carbs));
  const [editFats, setEditFats] = useState(String(nutritionTargets.fats));
  const [editFiber, setEditFiber] = useState(String(nutritionTargets.fiber));
  const [editCalories, setEditCalories] = useState(String(nutritionTargets.calories));

  // Custom food log state
  const [customName, setCustomName] = useState('');
  const [customProtein, setCustomProtein] = useState('20');
  const [customCarbs, setCustomCarbs] = useState('15');
  const [customFats, setCustomFats] = useState('5');
  const [customFiber, setCustomFiber] = useState('2');
  const [customCalories, setCustomCalories] = useState('180');

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTargets({
      protein: Math.max(0, parseFloat(editProtein) || 0),
      carbs: Math.max(0, parseFloat(editCarbs) || 0),
      fats: Math.max(0, parseFloat(editFats) || 0),
      fiber: Math.max(0, parseFloat(editFiber) || 0),
      calories: Math.max(0, parseFloat(editCalories) || 0),
    });
    setIsEditingGoals(false);
  };

  const handleLogCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddFood({
      name: customName,
      protein: Math.max(0, parseFloat(customProtein) || 0),
      carbs: Math.max(0, parseFloat(customCarbs) || 0),
      fats: Math.max(0, parseFloat(customFats) || 0),
      fiber: Math.max(0, parseFloat(customFiber) || 0),
      calories: Math.max(0, parseFloat(customCalories) || 0),
    });
    setCustomName('');
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 bg-[#1c2237] hover:bg-[#252c48] text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-[#2b3352]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>BACK TO HOME</span>
          </button>
        )}
      </div>

      {/* Page Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-600 border border-emerald-500/20">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Diet & Nutrition Tracker</h2>
            <p className="text-xs text-gray-500 font-medium">Log your food nutrition, customize daily targets, and hit your protein goals.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditProtein(String(nutritionTargets.protein));
              setEditCarbs(String(nutritionTargets.carbs));
              setEditFats(String(nutritionTargets.fats));
              setEditFiber(String(nutritionTargets.fiber));
              setEditCalories(String(nutritionTargets.calories));
              setIsEditingGoals(true);
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>EDIT GOALS</span>
          </button>
          <button 
            onClick={() => {
              if (confirm('Clear today\'s food log and macros?')) {
                onClearLogs();
              }
            }}
            className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DAY</span>
          </button>
        </div>
      </div>

      {/* Goal Editing Modal / Section */}
      {isEditingGoals && (
        <div className="bg-emerald-50/50 border-2 border-emerald-500/30 rounded-3xl p-6 animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-700">
              <Scale className="w-5 h-5" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Configure Nutrient Goals</h3>
            </div>
            <button 
              onClick={() => setIsEditingGoals(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveGoals} className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Protein Goal (g)</label>
              <input 
                type="number" 
                value={editProtein} 
                onChange={e => setEditProtein(e.target.value)} 
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Carbs Goal (g)</label>
              <input 
                type="number" 
                value={editCarbs} 
                onChange={e => setEditCarbs(e.target.value)} 
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fats Goal (g)</label>
              <input 
                type="number" 
                value={editFats} 
                onChange={e => setEditFats(e.target.value)} 
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fiber Goal (g)</label>
              <input 
                type="number" 
                value={editFiber} 
                onChange={e => setEditFiber(e.target.value)} 
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Calories Goal (kcal)</label>
              <input 
                type="number" 
                value={editCalories} 
                onChange={e => setEditCalories(e.target.value)} 
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div className="col-span-2 sm:col-span-5 flex justify-end">
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Apply Custom Targets
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Stats Panel - Multi-grid macro meters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Protein Target', value: nutritionToday.protein, target: nutritionTargets.protein, unit: 'g', textColor: 'text-emerald-500', barColor: 'bg-emerald-500', glowColor: 'rgba(16,185,129,0.15)', icon: '🍗' },
          { label: 'Carbs Target', value: nutritionToday.carbs, target: nutritionTargets.carbs, unit: 'g', textColor: 'text-blue-500', barColor: 'bg-blue-500', glowColor: 'rgba(59,130,246,0.15)', icon: '🌾' },
          { label: 'Fats Target', value: nutritionToday.fats, target: nutritionTargets.fats, unit: 'g', textColor: 'text-orange-500', barColor: 'bg-orange-500', glowColor: 'rgba(249,115,22,0.15)', icon: '🥑' },
          { label: 'Fiber Target', value: nutritionToday.fiber, target: nutritionTargets.fiber, unit: 'g', textColor: 'text-purple-500', barColor: 'bg-purple-500', glowColor: 'rgba(168,85,247,0.15)', icon: '🥦' },
          { label: 'Calories Burn/Intake', value: nutritionToday.calories, target: nutritionTargets.calories, unit: 'kcal', textColor: 'text-amber-600', barColor: 'bg-amber-500', glowColor: 'rgba(217,119,6,0.15)', icon: '🔥', large: true },
        ].map((macro) => {
          const progressPct = macro.target > 0 ? Math.min(100, Math.round((macro.value / macro.target) * 100)) : 0;
          return (
            <div 
              key={macro.label} 
              className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${macro.large ? 'col-span-2 md:col-span-1' : ''}`}
              style={{ boxShadow: `0 4px 20px -2px ${macro.glowColor}` }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest leading-none">{macro.label}</span>
                <span className="text-sm">{macro.icon}</span>
              </div>
              
              <div className="my-3">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black ${macro.textColor}`}>{macro.value}</span>
                  <span className="text-xs text-slate-400 font-semibold">{macro.unit}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Goal: {macro.target}{macro.unit}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${macro.barColor}`} style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500">
                  <span>{progressPct}%</span>
                  <span>{macro.value >= macro.target ? 'Target Met! 🎉' : `${macro.target - macro.value}${macro.unit} left`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simplified, High-Effectiveness Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Manual Custom Entry Form (5 columns) */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-4.5 h-4.5 text-emerald-500" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Log Custom Food Item</h3>
          </div>

          <form onSubmit={handleLogCustom} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Food / Drink Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Protein shake or Lunch" 
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Protein (g)</label>
                  <input 
                    type="number" 
                    value={customProtein}
                    onChange={e => setCustomProtein(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Carbs (g)</label>
                  <input 
                    type="number" 
                    value={customCarbs}
                    onChange={e => setCustomCarbs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fats (g)</label>
                  <input 
                    type="number" 
                    value={customFats}
                    onChange={e => setCustomFats(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fiber (g)</label>
                  <input 
                    type="number" 
                    value={customFiber}
                    onChange={e => setCustomFiber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Calories (kcal)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={customCalories}
                    onChange={e => setCustomCalories(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 pr-12"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-[9px] font-bold text-gray-400 uppercase">kcal</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const p = parseFloat(customProtein) || 0;
                    const c = parseFloat(customCarbs) || 0;
                    const f = parseFloat(customFats) || 0;
                    const caloriesEst = Math.round((p * 4) + (c * 4) + (f * 9));
                    setCustomCalories(String(caloriesEst));
                  }}
                  className="text-[9px] text-emerald-600 font-bold underline block mt-1.5 hover:text-emerald-700 cursor-pointer"
                >
                  Estimate calories from macros (4-4-9 formula)
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-600/15 mt-5 cursor-pointer"
            >
              🥗 Log Food Item
            </button>
          </form>
        </div>

        {/* Food Log / Activity Journal List (7 columns) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Today's Consumption Log ({loggedFoods.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">Chronological</span>
          </div>

          <div className="flex-1 max-h-[420px] overflow-y-auto pr-1">
            {loggedFoods.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {loggedFoods.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 mt-1 flex-wrap">
                        <span className="text-emerald-600">P: {item.protein}g</span>
                        <span>•</span>
                        <span className="text-blue-500">C: {item.carbs}g</span>
                        <span>•</span>
                        <span className="text-orange-500">F: {item.fats}g</span>
                        {item.fiber > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-500">Fi: {item.fiber}g</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-amber-600 font-bold">{item.calories} kcal</span>
                        <span>•</span>
                        <span className="text-slate-400 font-normal">{item.timestamp}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveFood(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer shrink-0 border border-transparent hover:border-red-100"
                      title="Remove food item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No food items logged today</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Fill out the quick custom food log form on the left to add items and meet your daily nutrition targets.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

