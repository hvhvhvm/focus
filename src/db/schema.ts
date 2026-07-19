import { usePostgres } from './dialect.ts';
import * as pgSchema from './schema.pg.ts';
import * as sqliteSchema from './schema.sqlite.ts';

const activeSchema = usePostgres ? pgSchema : sqliteSchema;

export const users = activeSchema.users;
export const habits = activeSchema.habits;
export const habitLogs = activeSchema.habitLogs;
export const routines = activeSchema.routines;
export const routineLogs = activeSchema.routineLogs;
