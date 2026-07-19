import { Habit, Routine, Category } from '../types';

export type PillarName = Category;

export const PILLAR_NAMES: PillarName[] = ['Fitness', 'Nutrition', 'Career', 'Recovery', 'Mind'];

export const PILLAR_META: Record<PillarName, {
  label: PillarName;
  accent: string;
  soft: string;
  border: string;
  text: string;
  ring: string;
  gradient: string;
  intent: string;
}> = {
  Fitness: {
    label: 'Fitness',
    accent: '#10B981',
    soft: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-500',
    ring: 'shadow-emerald-500/15',
    gradient: 'from-emerald-500 to-teal-500',
    intent: 'Train the body',
  },
  Nutrition: {
    label: 'Nutrition',
    accent: '#F59E0B',
    soft: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    text: 'text-amber-500',
    ring: 'shadow-amber-500/15',
    gradient: 'from-amber-500 to-orange-500',
    intent: 'Hit diet targets',
  },
  Career: {
    label: 'Career',
    accent: '#3B82F6',
    soft: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    text: 'text-blue-500',
    ring: 'shadow-blue-500/15',
    gradient: 'from-blue-500 to-cyan-500',
    intent: 'Build skills',
  },
  Recovery: {
    label: 'Recovery',
    accent: '#8B5CF6',
    soft: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-500',
    ring: 'shadow-violet-500/15',
    gradient: 'from-violet-500 to-indigo-500',
    intent: 'Protect energy',
  },
  Mind: {
    label: 'Mind',
    accent: '#EC4899',
    soft: 'bg-pink-500/10',
    border: 'border-pink-500/25',
    text: 'text-pink-500',
    ring: 'shadow-pink-500/15',
    gradient: 'from-pink-500 to-rose-500',
    intent: 'Sharpen focus',
  },
};

export function mapCategoryToPillar(category: string): PillarName {
  const cat = category.toLowerCase();
  if (cat === 'fitness') return 'Fitness';
  if (cat === 'nutrition' || cat.includes('diet') || cat.includes('food') || cat.includes('protein')) return 'Nutrition';
  if (cat === 'career') return 'Career';
  if (cat === 'recovery') return 'Recovery';
  if (cat === 'mind') return 'Mind';

  if (cat.includes('fit') || cat.includes('gym') || cat.includes('workout') || cat.includes('run') || cat.includes('sport')) return 'Fitness';
  if (cat.includes('nutri') || cat.includes('eat') || cat.includes('meal')) return 'Nutrition';
  if (cat.includes('career') || cat.includes('study') || cat.includes('productiv') || cat.includes('work') || cat.includes('coding') || cat.includes('read') || cat.includes('book') || cat.includes('learn')) return 'Career';
  if (cat.includes('recov') || cat.includes('sleep') || cat.includes('health') || cat.includes('rest') || cat.includes('social') || cat.includes('relax')) return 'Recovery';
  return 'Mind';
}

export function getRoutinePillar(routine: Routine, habits: Habit[]): PillarName {
  const routineHabits = habits.filter((h) => routine.habitIds.includes(h.id));
  if (routineHabits.length === 0) return 'Fitness';

  const counts: Record<PillarName, number> = {
    Fitness: 0,
    Nutrition: 0,
    Career: 0,
    Recovery: 0,
    Mind: 0,
  };

  routineHabits.forEach((h) => {
    counts[mapCategoryToPillar(h.category)] += 1;
  });

  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as PillarName) || 'Fitness';
}

export function isRoutineComplete(routine: Routine, habits: Habit[], date: string): boolean {
  const routineHabits = habits.filter((h) => routine.habitIds.includes(h.id));
  return routineHabits.length > 0 && routineHabits.every((h) => (h.history[date] || 0) >= h.target);
}

export function getPillarProgress(
  pillar: PillarName,
  habits: Habit[],
  routines: Routine[],
  date: string,
  routineHabitIds: Set<string>
) {
  const standaloneHabits = habits.filter(
    (h) => !routineHabitIds.has(h.id) && mapCategoryToPillar(h.category) === pillar
  );
  const pillarRoutines = routines.filter((r) => getRoutinePillar(r, habits) === pillar);

  const completedHabits = standaloneHabits.filter((h) => (h.history[date] || 0) >= h.target).length;
  const completedRoutines = pillarRoutines.filter((r) => isRoutineComplete(r, habits, date)).length;

  const total = standaloneHabits.length + pillarRoutines.length;
  const completed = completedHabits + completedRoutines;

  return {
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    ratio: `${completed}/${total}`,
    standaloneHabits,
    pillarRoutines,
    completed,
    total,
  };
}

