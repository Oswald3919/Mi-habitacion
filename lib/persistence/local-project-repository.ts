import type { ProjectRepository } from '../../features/projects/repository';
import { loadOrMigrateDatabase } from './migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from './schema';

type Options = { storage?: StorageLike; currentDate?: () => string };
const browserStorage = (): StorageLike => window.localStorage;
const today = () => new Date().toLocaleDateString('en-CA');
export function createLocalProjectRepository(options: Options = {}): ProjectRepository {
  const storage = () => options.storage ?? browserStorage();
  const load = () => loadOrMigrateDatabase(storage(), (options.currentDate ?? today)());
  return {
    async list() { return [...load().projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)); },
    async save(project, activity) { const db = load(); const index = db.projects.findIndex((item) => item.id === project.id); if (index < 0) db.projects.push(project); else db.projects[index] = project; db.activity_log.push(activity); storage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(db)); },
    async related(projectId) { const db = load(); return { tasks: db.tasks.filter((item) => item.project_id === projectId), transactions: db.finance_transactions.filter((item) => item.project_id === projectId), activity: db.activity_log.filter((item) => item.entity_type === 'project' && item.entity_id === projectId).sort((a, b) => b.occurred_at - a.occurred_at) }; },
  };
}
