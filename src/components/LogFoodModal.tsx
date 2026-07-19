import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, AlertCircle, Utensils, Search, Check, Star, Trash2, Heart, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { LoggedFood } from './DietScreen';

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: { name: string; protein: number; carbs: number; fats: number; fiber: number; calories: number }) => void;
  loggedFoodsHistory: LoggedFood[];
}

export default function LogFoodModal({
  isOpen,
  onClose,
  onAddFood,
  loggedFoodsHistory,
}: LogFoodModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom favorites state (replaces POPULAR_FOODS to allow completely user-defined favorites)
  const [favorites, setFavorites] = useState<{ id: string; name: string; protein: number; carbs: number; fats: number; fiber: number; calories: number; emoji?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('90day_favorite_foods');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for toggling inline favorite creator
  const [showAddFavForm, setShowAddFavForm] = useState(false);

  // Favorites form state
  const [favName, setFavName] = useState('');
  const [favProtein, setFavProtein] = useState('25');
  const [favCarbs, setFavCarbs] = useState('30');
  const [favFats, setFavFats] = useState('8');
  const [favFiber, setFavFiber] = useState('2');
  const [favCalories, setFavCalories] = useState('290');

  // Custom manual entry state
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('20');
  const [carbs, setCarbs] = useState('30');
  const [fats, setFats] = useState('8');
  const [fiber, setFiber] = useState('2');
  const [calories, setCalories] = useState('270');
  const [saveToFavFromCustom, setSaveToFavFromCustom] = useState(false);

  // Success indicator state
  const [loggedIndicator, setLoggedIndicator] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEstimateCalories = () => {
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fats) || 0;
    const calculated = (p * 4) + (c * 4) + (f * 9);
    setCalories(String(Math.round(calculated)));
  };

  const handleEstimateFavCalories = () => {
    const p = parseFloat(favProtein) || 0;
    const c = parseFloat(favCarbs) || 0;
    const f = parseFloat(favFats) || 0;
    const calculated = (p * 4) + (c * 4) + (f * 9);
    setFavCalories(String(Math.round(calculated)));
  };

  const handleQuickLog = (food: { name: string; protein: number; carbs: number; fats: number; fiber: number; calories: number }) => {
    onAddFood({
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      fiber: food.fiber,
      calories: food.calories,
    });
    
    // Show quick visual success indicator
    setLoggedIndicator(food.name);
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
      emoji: '⭐'
    };

    const updated = [newFav, ...favorites];
    setFavorites(updated);
    localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));

    // Reset fav form
    setFavName('');
    setShowAddFavForm(false);
  };

  const handleDeleteFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent logging when clicking delete
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customFood = {
      name: name.trim(),
      protein: Math.max(0, parseFloat(protein) || 0),
      carbs: Math.max(0, parseFloat(carbs) || 0),
      fats: Math.max(0, parseFloat(fats) || 0),
      fiber: Math.max(0, parseFloat(fiber) || 0),
      calories: Math.max(0, parseFloat(calories) || 0),
    };

    onAddFood(customFood);

    // Also save to favorites if toggled
    if (saveToFavFromCustom) {
      const newFav = {
        id: Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        protein: customFood.protein,
        carbs: customFood.carbs,
        fats: customFood.fats,
        fiber: customFood.fiber,
        calories: customFood.calories,
        emoji: '⭐'
      };
      const updated = [newFav, ...favorites];
      setFavorites(updated);
      localStorage.setItem('90day_favorite_foods', JSON.stringify(updated));
    }

    setName('');
    setSaveToFavFromCustom(false);

    // Quick indicator
    setLoggedIndicator(name.trim());
    setTimeout(() => {
      setLoggedIndicator(null);
      onClose();
    }, 800);
  };

  // Filter personal favorites
  const filteredFavorites = favorites.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 select-none animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-2xl relative border border-slate-100 flex flex-col gap-3.5 sm:gap-4 max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/10 p-2 sm:p-2.5 rounded-xl text-emerald-600 border border-emerald-500/20">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-none">Log Food Item</h2>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium mt-1">Slam your targets with easy tracking</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-50 hover:bg-slate-100 p-1.5 sm:p-2 rounded-full border border-gray-150 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Visual success indicator */}
        {loggedIndicator && (
          <div className="absolute inset-x-0 top-1/3 mx-auto max-w-[240px] bg-emerald-600 text-white py-3 px-5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl border border-emerald-500 z-50 text-center animate-bounce">
            <Check className="w-6 h-6 stroke-[3px]" />
            <span className="text-xs font-black uppercase tracking-wider">Logged Successfully!</span>
            <span className="text-[10px] opacity-90 truncate max-w-full font-bold">{loggedIndicator}</span>
          </div>
        )}

        {/* Dynamic Navigation Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[36px] ${
              activeTab === 'quick' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⭐ Favorites & Quick Log
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[36px] ${
              activeTab === 'custom' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Custom Entry
          </button>
        </div>

        {/* Quick Log Tab Content */}
        {activeTab === 'quick' && (
          <div className="flex-1 flex flex-col gap-3 sm:gap-3.5 overflow-hidden">
            
            {/* Search and Add Favorite Button */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[38px]"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
              </div>
              
              <button
                type="button"
                onClick={() => setShowAddFavForm(!showAddFavForm)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 rounded-xl border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {showAddFavForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Favorite</span>
              </button>
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

                <div>
                  <input 
                    type="text" 
                    placeholder="Food Name (e.g., Protein Oatmeal)" 
                    value={favName}
                    onChange={e => setFavName(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900"
                    required
                  />
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

            {/* Main Favorites List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[350px]">
              {filteredFavorites.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleQuickLog(food)}
                  className="w-full bg-slate-50 hover:bg-emerald-50/75 border border-slate-150 hover:border-emerald-200 p-2 sm:p-2.5 rounded-2xl transition flex items-center justify-between cursor-pointer group min-h-[44px]"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    <span className="text-sm sm:text-base shrink-0">⭐</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700">{food.name}</p>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                        <span className="text-emerald-600">P: {food.protein}g</span>
                        <span>•</span>
                        <span>C: {food.carbs}g</span>
                        <span>•</span>
                        <span>F: {food.fats}g</span>
                        {food.fiber > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600">Fi: {food.fiber}g</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-slate-700 block">{food.calories}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">kcal</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteFavorite(food.id, e)}
                      className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 p-1.5 rounded-lg border border-slate-200 hover:border-red-100 transition flex items-center justify-center cursor-pointer"
                      title="Remove Favorite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[10px] bg-emerald-600/10 text-emerald-700 font-black px-2 py-1 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                      + LOG
                    </span>
                  </div>
                </div>
              ))}

              {filteredFavorites.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-250 text-slate-400 text-xs flex flex-col items-center justify-center gap-2.5 px-4">
                  <Star className="w-7 h-7 text-amber-400 fill-amber-400 animate-pulse" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-700 text-xs">No Favorites Added Yet</p>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[240px] mx-auto">
                      All preset foods have been removed. Click <strong className="text-emerald-600 font-bold">Add Favorite</strong> above to create your own high-speed logs!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom manual food entry form */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto max-h-[45vh] sm:max-h-[400px] pr-1">
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1">Food / Drink Name</label>
              <input 
                type="text" 
                placeholder="e.g. Eggs and Avocado Toast" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[38px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1">Carbs (g)</label>
                <input 
                  type="number" 
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1">Fats (g)</label>
                <input 
                  type="number" 
                  value={fats}
                  onChange={e => setFats(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block mb-1">Fiber (g)</label>
                <input 
                  type="number" 
                  value={fiber}
                  onChange={e => setFiber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[36px]"
                  min="0"
                  step="any"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase block">Calories (kcal)</label>
                <button
                  type="button"
                  onClick={handleEstimateCalories}
                  className="text-[9px] text-emerald-600 hover:text-emerald-750 font-black uppercase tracking-wider underline cursor-pointer"
                >
                  Estimate (4-4-9)
                </button>
              </div>
              <input 
                type="number" 
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 min-h-[38px]"
                min="0"
                step="any"
                required
              />
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 sm:py-3 rounded-xl transition shadow-md shadow-emerald-600/15 mt-2.5 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Custom Food Item</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
