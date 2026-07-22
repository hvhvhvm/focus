export interface DietPreferences {
  showCalories: boolean;
  showProtein: boolean;
  showWater: boolean;
  showMeals: boolean;
  showCarbs: boolean;
  showFats: boolean;
  showFiber: boolean;
  waterGoalMl: number; // e.g. 3000 ml
  mealsGoal: number; // e.g. 4 meals
}

const STORAGE_KEY = '90day_diet_preferences';
const WATER_LOG_KEY = '90day_water_log';

export const DEFAULT_DIET_PREFERENCES: DietPreferences = {
  showCalories: true,
  showProtein: true,
  showWater: true,
  showMeals: true,
  showCarbs: false,
  showFats: false,
  showFiber: false,
  waterGoalMl: 3000,
  mealsGoal: 4,
};

export function getDietPreferences(): DietPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DIET_PREFERENCES;
    return { ...DEFAULT_DIET_PREFERENCES, ...JSON.parse(stored) };
  } catch (e) {
    return DEFAULT_DIET_PREFERENCES;
  }
}

export function saveDietPreferences(prefs: DietPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save diet preferences:', e);
  }
}

// Water log per date helper (ml)
export function getWaterIntakeForDate(dateStr: string): number {
  try {
    const logs = JSON.parse(localStorage.getItem(WATER_LOG_KEY) || '{}');
    return logs[dateStr] || 0;
  } catch (e) {
    return 0;
  }
}

export function addWaterIntakeForDate(dateStr: string, amountMl: number): number {
  try {
    const logs = JSON.parse(localStorage.getItem(WATER_LOG_KEY) || '{}');
    const current = logs[dateStr] || 0;
    const updated = Math.max(0, current + amountMl);
    logs[dateStr] = updated;
    localStorage.setItem(WATER_LOG_KEY, JSON.stringify(logs));
    return updated;
  } catch (e) {
    console.error('Failed to update water intake:', e);
    return 0;
  }
}

export function resetWaterIntakeForDate(dateStr: string): number {
  try {
    const logs = JSON.parse(localStorage.getItem(WATER_LOG_KEY) || '{}');
    logs[dateStr] = 0;
    localStorage.setItem(WATER_LOG_KEY, JSON.stringify(logs));
    return 0;
  } catch (e) {
    console.error('Failed to reset water intake:', e);
    return 0;
  }
}

