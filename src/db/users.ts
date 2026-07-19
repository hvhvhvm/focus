import { db } from './index.ts';
import { users, habits } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // 1. Check if user already exists
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }

    // 2. Otherwise, create a new user with 90-day challenge started, start date today, and zero points!
    const todayStr = new Date().toISOString().split('T')[0];
    
    const [newUser] = await db.insert(users)
      .values({
        uid,
        email,
        totalPoints: 0,
        lockedInDays: 0,
        consecutiveLockedInStreak: 0,
        journeyStartDate: todayStr,
        challengeDays: 90,
        isChallengeStarted: true,
      })
      .returning();

    // 3. Seed initial 3 high-quality habits with zero completions so they start fresh
    const initialSeedHabits = [
      { id: `fit-gym-${uid}`, name: "Power Workout", category: "Fitness", points: 30, type: "Count", target: 1, unit: "workout", repeat: "Daily", enableFocusTimer: 0 },
      { id: `read-book-${uid}`, name: "Technical Reading", category: "Reading", points: 15, type: "Timer", target: 30, unit: "min", repeat: "Daily", enableFocusTimer: 1 },
      { id: `mind-med-${uid}`, name: "Mindfulness Breathing", category: "Mindset", points: 10, type: "Timer", target: 10, unit: "min", repeat: "Daily", enableFocusTimer: 1 }
    ];

    for (const h of initialSeedHabits) {
      await db.insert(habits).values({
        id: h.id,
        userId: uid,
        name: h.name,
        category: h.category,
        points: h.points,
        type: h.type,
        target: h.target,
        unit: h.unit,
        repeat: h.repeat,
        enableFocusTimer: h.enableFocusTimer,
        createdAt: todayStr,
      });
    }

    return newUser;
  } catch (error) {
    console.error("Database query failed in getOrCreateUser:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
