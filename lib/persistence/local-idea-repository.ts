import type { IdeaRepository } from '../../features/ideas/repository';
import { loadOrMigrateDatabase } from './migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from './schema';
type Options = { storage?: StorageLike; currentDate?: () => string };
const browserStorage = (): StorageLike => window.localStorage;
const today = () => new Date().toLocaleDateString('en-CA');
export function createLocalIdeaRepository(options: Options = {}): IdeaRepository { const storage = () => options.storage ?? browserStorage(); const load = () => loadOrMigrateDatabase(storage(), (options.currentDate ?? today)()); return { async list() { return [...load().ideas].sort((a, b) => b.updated_at.localeCompare(a.updated_at)); }, async save(idea, activity) { const db = load(); const index = db.ideas.findIndex((item) => item.id === idea.id); if (index < 0) db.ideas.push(idea); else db.ideas[index] = idea; db.activity_log.push(activity); storage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(db)); } }; }
