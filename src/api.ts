import { Habit, Routine, UserStats } from './types';

const getApiBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

export async function fetchWithAuth(url: string, options: RequestInit = {}, includeAuth = true) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (includeAuth) {
    const token = localStorage.getItem('habit_mountain_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${url}`, config);
  const text = await response.text();

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = JSON.parse(text);
    } catch (e) {
      // Ignored: fallback to status text
    }
    throw new Error(errData.error || `HTTP Error ${response.status}: ${response.statusText}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Non-JSON API Response Body:", text);
    throw new Error("Invalid API response format (HTML was returned instead of JSON). The endpoint may not be registered, or the request was intercepted.");
  }
}

export const api = {
  // Authentication & Profile
  async login(emailStr: string, passwordStr: string) {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailStr, password: passwordStr }),
    }, false);
  },

  async register(emailStr: string, passwordStr: string) {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: emailStr, password: passwordStr }),
    }, false);
  },

  async getProfile() {
    return fetchWithAuth('/user/me', { method: 'GET' });
  },

  async syncJourney(stats: {
    journey_start_date?: string | null;
    total_points?: number;
    locked_in_days?: number;
    consecutive_locked_in_streak?: number;
  }) {
    return fetchWithAuth('/user/sync-journey', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
  },

  async resetAllData() {
    return fetchWithAuth('/user/reset', { method: 'POST' });
  },

  // Habits
  async getHabits(): Promise<Habit[]> {
    return fetchWithAuth('/habits', { method: 'GET' });
  },

  async createHabit(habitData: Partial<Habit>): Promise<Habit> {
    return fetchWithAuth('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  async logHabit(habitId: string, date: string, value: number) {
    return fetchWithAuth(`/habits/${habitId}/log`, {
      method: 'POST',
      body: JSON.stringify({ date, value }),
    });
  },

  async logHabitAbsolute(habitId: string, date: string, value: number) {
    return fetchWithAuth(`/habits/${habitId}/log-absolute`, {
      method: 'POST',
      body: JSON.stringify({ date, value }),
    });
  },

  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    return fetchWithAuth(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  },

  async deleteHabit(habitId: string) {
    return fetchWithAuth(`/habits/${habitId}`, { method: 'DELETE' });
  },

  // Routines
  async getRoutines(): Promise<Routine[]> {
    return fetchWithAuth('/routines', { method: 'GET' });
  },

  async createRoutine(rtData: {
    name: string;
    points: number;
    timeBlock: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant';
    repeat: 'Daily' | 'Custom Days' | 'Today Only';
    habitIds: string[];
  }): Promise<Routine> {
    return fetchWithAuth('/routines', {
      method: 'POST',
      body: JSON.stringify(rtData),
    });
  },

  async setRoutineStatus(routineId: string, date: string, completed: boolean) {
    return fetchWithAuth(`/routines/${routineId}/status`, {
      method: 'POST',
      body: JSON.stringify({ date, completed }),
    });
  },

  async updateRoutine(routineId: string, rtData: {
    name?: string;
    points?: number;
    timeBlock?: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant';
    repeat?: 'Daily' | 'Custom Days' | 'Today Only';
    habitIds?: string[];
  }): Promise<Routine> {
    return fetchWithAuth(`/routines/${routineId}`, {
      method: 'PUT',
      body: JSON.stringify(rtData),
    });
  },

  async deleteRoutine(routineId: string) {
    return fetchWithAuth(`/routines/${routineId}`, { method: 'DELETE' });
  },
};
