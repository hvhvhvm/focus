import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase Auth UID or generated UID
  email: text('email').notNull(),
  passwordHash: text('password_hash'), // For email/password accounts
  totalPoints: integer('total_points').default(0),
  lockedInDays: integer('locked_in_days').default(0),
  consecutiveLockedInStreak: integer('consecutive_locked_in_streak').default(0),
  journeyStartDate: text('journey_start_date'), // YYYY-MM-DD
  challengeDays: integer('challenge_days').default(90), // default to 90
  isChallengeStarted: boolean('is_challenge_started').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  points: integer('points').default(10).notNull(),
  type: text('type').notNull(), // 'Count' | 'Timer'
  target: integer('target').default(1).notNull(),
  unit: text('unit').notNull(),
  repeat: text('repeat').notNull(), // 'Daily' | 'Custom Days' | 'Today Only'
  repeatDays: text('repeat_days'), // Comma-separated or JSON
  timeOfDay: text('time_of_day'),
  timeBlock: text('time_block'), // 'Anytime' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'
  enableFocusTimer: integer('enable_focus_timer').default(0),
  routineId: text('routine_id'),
  createdAt: text('created_at').notNull(),
});

export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  value: integer('value').notNull(),
  pointsEarned: integer('points_earned').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routines = pgTable('routines', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  points: integer('points').default(10).notNull(),
  timeBlock: text('time_block').notNull(), // 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant'
  repeat: text('repeat').notNull(), // 'Daily' | 'Custom Days' | 'Today Only'
  repeatDays: text('repeat_days'), // Comma-separated or JSON
  habitIds: text('habit_ids'), // Comma-separated or JSON list of habit IDs
  createdAt: timestamp('created_at').defaultNow(),
});

export const routineLogs = pgTable('routine_logs', {
  id: serial('id').primaryKey(),
  routineId: text('routine_id').references(() => routines.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  completed: boolean('completed').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
