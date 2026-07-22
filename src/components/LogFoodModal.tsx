import React, { useState } from 'react';
import { X, PlusCircle, Utensils, Search, Check, Star, Trash2, Plus } from 'lucide-react';
import { LoggedFood } from './DietScreen';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: { name: string; protein: number; carbs: number; fats: number; fiber: number; calories: number; mealType?: MealType }) => void;
  loggedFoodsHistory: LoggedFood[];
}

export const MEAL_TYPES: { type: MealType; label: string; icon: string; bg: string; text: string; border: string }[] = [
  { type: 'Breakfast', label: 'Breakfast', icon: '🌅', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { type: 'Lunch', label: 'Lunch', icon: '☀️', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { type: 'Dinner', label: 'Dinner', icon: '🌙', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { type: 'Snack', label: 'Snack', icon: '🥨', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
];

export const getAutoMealType = (): MealType => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11.5) return 'Breakfast';
  if (h >= 11.5 && h < 16.5) return 'Lunch';
  if (h >= 16.5 && h < 21.5) return 'Dinner';
  return 'Snack';
};

const DEFAULT_FAVORITES = [
  { id: 'fav-1', name: 'Oatmeal & Protein Shake', protein: 30, carbs: 45, fats: 6, fiber: 5, calories: 350, mealType: 'Breakfast' as MealType, emoji: '🥣' },
  { id: 'fav-2', name: 'Eggs & Whole Wheat Toast', protein: 24, carbs: 28, fats: 14, fiber: 3, calories: 330, mealType: 'Breakfast' as MealType, emoji: '🍳' },
  { id: 'fav-3', name: 'Grilled Chicken & Rice', protein: 42, carbs: 50, fats: 8, fiber: 4, calories: 440, mealType: 'Lunch' as MealType, emoji: '🥗' },
  { id: 'fav-4', name: 'Turkey Wrap & Salad', protein: 35, carbs: 38, fats: 10, fiber: 5, calories: 380, mealType: 'Lunch' as MealType, emoji: '🌯' },
  { id: 'fav-5', name: 'Salmon & Roasted Veggies', protein: 38, carbs: 20, fats: 18, fiber: 6, calories: 410, mealType: 'Dinner' as MealType, emoji: '🥩' },
  { id: 'fav-6', name: 'Greek Yogurt & Berries', protein: 20, carbs: 18, fats: 2, fiber: 3, calories: 170, mealType: 'Snack' as MealType, emoji: '🫐' },
];

export default function LogFoodModal({
  isOpen,
  onClose,
  onAddFood,
}: LogFoodModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category filter for favorites tab (All, Breakfast, Lunch, Dinner, Snack)
  const [favCategoryFilter, setFavCategoryFilter] = useState<'All' | MealType>('All');

  // Favorites state
  const [favorites, setFavorites] = useState<{ id: string; name: string; protein: number; carbs: number; fats: number; fiber: number; calories: number; emoji?: string; mealType?: MealType }[]>(() => {
    try {
      const saved = localStorage.getItem('90day_favorite_foods');
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch (e) {
      return DEFAULT_FAVORITES;
    }
  });

  // Toggle inline favorite creator
  const [showAddFavForm, setShowAddFavForm] = useState(false);

  // Favorites form state
  const [favName, setFavName] = useState('');
  const [favProtein, setFavProtein] = useState('25');
  const [favCarbs, setFavCarbs] = useState('30');
  const [favFats, setFavFats] = useState('8');
  const [favFiber, setFavFiber] = useState('2');
  const [favCalories, setFavCalories] = useState('290');
  const [favMealType, setFavMealType] = useState<MealType>(() => getAutoMealType());

  // Custom manual entry state
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('20');
  const [calories, setCalories] = useState('200');
  const [saveToFavFromCustom, setSaveToFavFromCustom] = useState(false);

  // Visual feedback indicator
  const [loggedIndicator, setLoggedIndicator] = useState<{ name: string; mealType: MealType } | null>(null);

  if (!isOpen) return null;

  const handleEstimateFavCalories = () => {
    const p = parseFloat(favProtein) || 0;
    const c = parseFloat(favCarbs) || 0;
    const f = parseFloat(favFats) || 0;
    const calculated = (p * 4) + (c * 4) + (f * 9);
    setFavCalories(String(Math.round(calculated)));
  };

  const handleQuickLog = (food: { name: string; protein: number; carbs?: number; fats?: number; fiber?: number; calories: number; mealType?: MealType }) => {
    const assignedMeal: MealType = food.mealType || getAutoMealType();
    onAddFood({
      name: food.name,
      protein: food.protein,
      carbs: food.carbs || 0,
      fats: food.fats || 0,
      fiber: food.fiber || 0,
      calories: food.calories,
      mealType: assignedMeal,
    });
    
    setLoggedIndicator({ name: food.name, mealType: assignedMeal });
    setTimeout(() => {
      setLoggedIndicator(null);
      onClose();
    }, 800);
  };

  const handleAddFavoriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!favName.trim()) return;

    const newFav = {
      id: Math.random().toString(36).substring(2, 9),
      name: favName.trim(),
      protein: Math.max(0, parseFloat(favProtein) || 0),
      carbs: Math.max(0, parseFloat(favCarbs) || 0),
      fats: Math.max(0, parseFloat(favFats) || 0),
      fiber: Math.max(0, parseFloat(favFiber) || 0),
      calories: Math.max(0, parseFloat(favCalories) || 0),
      mealType: favMealType,
      emoji: favMealType === 'Breakfast' ? '🌅' : favMealType === 'Lunch' ? '☀️' : favMealType === 'Dinner' ? '🌙' : '🥨'
    };

    const updated = [newFav, ...favorites];
    setFavorites(updated);
    localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));

    setFavName('');
    setShowAddFavForm(false);
  };

  const handleDeleteFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const autoMeal = getAutoMealType();

    const customFood = {
      name: name.trim(),
      protein: Math.max(0, parseFloat(protein) || 0),
      carbs: 0,
      fats: 0,
      fiber: 0,
      calories: Math.max(0, parseFloat(calories) || 0),
      mealType: autoMeal,
    };

    onAddFood(customFood);

    if (saveToFavFromCustom) {
      const newFav = {
        id: Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        protein: customFood.protein,
        carbs: 0,
        fats: 0,
        fiber: 0,
        calories: customFood.calories,
        mealType: autoMeal,
        emoji: '⭐'
      };
      const updated = [newFav, ...favorites];
      setFavorites(updated);
      localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));
    }

    setName('');
    setSaveToFavFromCustom(false);

    setLoggedIndicator({ name: name.trim(), mealType: autoMeal });
    setTimeout(() => {
      setLoggedIndicator(null);
      onClose();
    }, 800);
  };

  // Group favorites by meal type
  const mealCategoriesToDisplay: MealType[] = favCategoryFilter === 'All' 
    ? ['Breakfast', 'Lunch', 'Dinner', 'Snack'] 
    : [favCategoryFilter];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 select-none animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative border border-slate-100 flex flex-col gap-4 max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 sm:p-3 rounded-2xl text-emerald-600 border border-emerald-500/20">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-none">Log Food Item</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Quick log favorite meal slots or add custom food entry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-gray-150 transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Visual success indicator */}
        {loggedIndicator && (
          <div className="absolute inset-x-0 top-1/3 mx-auto max-w-[280px] bg-emerald-600 text-white py-3.5 px-6 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl border border-emerald-500 z-50 text-center animate-bounce">
            <Check className="w-6 h-6 stroke-[3px]" />
            <span className="text-xs font-black uppercase tracking-wider">Logged Successfully!</span>
            <span className="text-[10px] opacity-90 truncate max-w-full font-bold">{loggedIndicator.name} ({loggedIndicator.mealType})</span>
          </div>
        )}

        {/* Dynamic Navigation Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'quick' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⭐ Favorites & Quick Log
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'custom' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Custom Entry
          </button>
        </div>

        {/* Quick Log Tab Content */}
        {activeTab === 'quick' && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            
            {/* Search Bar + Add Favorite button */}
            <div className="space-y-2 shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search favorites..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[38px]"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAddFavForm(!showAddFavForm)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 rounded-xl border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {showAddFavForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Favorite</span>
                </button>
              </div>

              {/* Category filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFavCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer shrink-0 border ${
                      favCategoryFilter === cat
                        ? 'bg-slate-900 text-white border-slate-900 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'All' ? '✨ All Meals' : cat === 'Breakfast' ? '🌅 Breakfast' : cat === 'Lunch' ? '☀️ Lunch' : cat === 'Dinner' ? '🌙 Dinner' : '🥨 Snack'}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Add Favorite Form */}
            {showAddFavForm && (
              <form onSubmit={handleAddFavoriteSubmit} className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-2.5 shrink-0 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Create Custom Favorite Food</span>
                  <button 
                    type="button" 
                    onClick={() => setShowAddFavForm(false)} 
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input 
                      type="text" 
                      placeholder="Food Name (e.g. Protein Oatmeal)" 
                      value={favName}
                      onChange={e => setFavName(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={favMealType}
                      onChange={e => setFavMealType(e.target.value as MealType)}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="Breakfast">🌅 Breakfast</option>
                      <option value="Lunch">☀️ Lunch</option>
                      <option value="Dinner">🌙 Dinner</option>
                      <option value="Snack">🥨 Snack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Protein</label>
                    <input 
                      type="number" 
                      value={favProtein}
                      onChange={e => setFavProtein(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 text-center"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Carbs</label>
                    <input 
                      type="number" 
                      value={favCarbs}
                      onChange={e => setFavCarbs(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 text-center"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Fats</label>
                    <input 
                      type="number" 
                      value={favFats}
                      onChange={e => setFavFats(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 text-center"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Fiber</label>
                    <input 
                      type="number" 
                      value={favFiber}
                      onChange={e => setFavFiber(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 text-center"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase">Calories</label>
                      <button
                        type="button"
                        onClick={handleEstimateFavCalories}
                        className="text-[8px] text-emerald-600 hover:underline font-black uppercase"
                      >
                        Auto-Estimate
                      </button>
                    </div>
                    <input 
                      type="number" 
                      value={favCalories}
                      onChange={e => setFavCalories(e.target.value)}
                      className="w-full bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900"
                      min="0"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer self-end shadow-md shadow-emerald-600/10"
                  >
                    Save Favorite
                  </button>
                </div>
              </form>
            )}

            {/* Categorized Meal Section Favorites List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[380px]">
              {mealCategoriesToDisplay.map((mealType) => {
                const mealMeta = MEAL_TYPES.find(m => m.type === mealType) || MEAL_TYPES[0];
                const sectionItems = favorites.filter(food => {
                  const itemMeal = food.mealType || 'Breakfast';
                  const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
                  return itemMeal === mealType && matchesSearch;
                });

                if (favCategoryFilter === 'All' && sectionItems.length === 0 && searchQuery.trim() !== '') {
                  return null;
                }

                return (
                  <div key={mealType} className="space-y-2">
                    {/* Meal Section Header */}
                    <div className="flex items-center justify-between bg-slate-100/80 py-1.5 px-3 rounded-xl border border-slate-200/60 sticky top-0 z-10 backdrop-blur-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{mealMeta.icon}</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{mealMeta.label}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{sectionItems.length} items</span>
                    </div>

                    {/* Items inside this meal section */}
                    <div className="space-y-1.5 pl-1">
                      {sectionItems.map((food) => (
                        <div
                          key={food.id}
                          onClick={() => handleQuickLog(food)}
                          className="w-full bg-slate-50 hover:bg-emerald-50/75 border border-slate-150 hover:border-emerald-200 p-2.5 rounded-2xl transition flex items-center justify-between cursor-pointer group min-h-[48px]"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{food.emoji || mealMeta.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700">{food.name}</p>
                              <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                                <span className="text-emerald-600">P: {food.protein}g</span>
                                <span>•</span>
                                <span className="text-amber-600">{food.calories} kcal</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              onClick={(e) => handleDeleteFavorite(food.id, e)}
                              className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 p-1.5 rounded-lg border border-slate-200 hover:border-red-100 transition flex items-center justify-center cursor-pointer"
                              title="Remove Favorite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-[10px] bg-emerald-600/10 text-emerald-700 font-black px-2.5 py-1 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                              + LOG ({mealType})
                            </span>
                          </div>
                        </div>
                      ))}

                      {sectionItems.length === 0 && (
                        <div className="py-3 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                          <p className="text-[10px] text-slate-400 font-medium">No {mealType.toLowerCase()} favorites yet. Click Add Favorite to create one!</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom manual food entry form */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5 flex-1 overflow-y-auto max-h-[45vh] sm:max-h-[400px] pr-1">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Food / Drink Name</label>
              <input 
                type="text" 
                placeholder="e.g. Chicken Breast, Protein Shake" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[38px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Calories (kcal)</label>
                <input 
                  type="number" 
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
            </div>

            {/* Checkbox to save to favorites */}
            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="saveToFav"
                checked={saveToFavFromCustom}
                onChange={e => setSaveToFavFromCustom(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="saveToFav" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                ⭐ Save this food to my personal favorites
              </label>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-600/15 mt-2.5 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Item</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
