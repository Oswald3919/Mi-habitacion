import type { ActivityRepository } from '../../features/activity/repository';
import { loadOrMigrateDatabase } from './migrations';
import type { StorageLike } from './schema';
type Options = { storage?: StorageLike; currentDate?: () => string };
const browserStorage = (): StorageLike => window.localStorage;
export function createLocalActivityRepository(options: Options = {}): ActivityRepository { return { async list() { const storage = options.storage ?? browserStorage(); const today = (options.currentDate ?? (() => new Date().toLocaleDateString('en-CA')))(); return [...loadOrMigrateDatabase(storage, today).activity_log].sort((a, b) => b.occurred_at - a.occurred_at); } }; }
