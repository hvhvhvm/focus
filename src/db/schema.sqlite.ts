import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  totalPoints: integer('total_points').default(0),
  lockedInDays: integer('locked_in_days').default(0),
  consecutiveLockedInStreak: integer('consecutive_locked_in_streak').default(0),
  journeyStartDate: text('journey_start_date'),
  challengeDays: integer('challenge_days').default(90),
  isChallengeStarted: integer('is_challenge_started', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  points: integer('points').default(10).notNull(),
  type: text('type').notNull(),
  target: integer('target').default(1).notNull(),
  unit: text('unit').notNull(),
  repeat: text('repeat').notNull(),
  repeatDays: text('repeat_days'),
  timeOfDay: text('time_of_day'),
  timeBlock: text('time_block'),
  enableFocusTimer: integer('enable_focus_timer').default(0),
  routineId: text('routine_id'),
  createdAt: text('created_at').notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  value: integer('value').notNull(),
  pointsEarned: integer('points_earned').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  points: integer('points').default(10).notNull(),
  timeBlock: text('time_block').notNull(),
  repeat: text('repeat').notNull(),
  repeatDays: text('repeat_days'),
  habitIds: text('habit_ids'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const routineLogs = sqliteTable('routine_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: text('routine_id').references(() => routines.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});
