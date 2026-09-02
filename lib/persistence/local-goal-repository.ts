import type { GoalRepository } from '../../features/goals/repository';
import { loadOrMigrateDatabase } from './migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from './schema';
type Options = { storage?: StorageLike; currentDate?: () => string };
const browserStorage = (): StorageLike => window.localStorage;
const today = () => new Date().toLocaleDateString('en-CA');
export function createLocalGoalRepository(options: Options = {}): GoalRepository { const storage = () => options.storage ?? browserStorage(); const load = () => loadOrMigrateDatabase(storage(), (options.currentDate ?? today)()); return { async list() { return [...load().goals].sort((a, b) => b.updated_at.localeCompare(a.updated_at)); }, async save(goal, activity) { const db = load(); const index = db.goals.findIndex((item) => item.id === goal.id); if (index < 0) db.goals.push(goal); else db.goals[index] = goal; db.activity_log.push(activity); storage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(db)); }, async relatedTasks(goalId) { return load().tasks.filter((item) => item.goal_id === goalId); } }; }
