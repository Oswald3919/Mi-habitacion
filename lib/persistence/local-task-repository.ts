import { localToday, sortTasks } from '../../features/tasks/domain';
import type { TaskRepository } from '../../features/tasks/repository';
import { loadOrMigrateDatabase } from './migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from './schema';

type TaskRepositoryOptions = { storage?: StorageLike; currentDate?: () => string };

function browserStorage(): StorageLike {
  return window.localStorage;
}

export function createLocalTaskRepository(
  options: TaskRepositoryOptions = {},
): TaskRepository {
  const getStorage = () => options.storage ?? browserStorage();
  const currentDate = options.currentDate ?? localToday;
  return {
    async list() {
      const database = loadOrMigrateDatabase(getStorage(), currentDate());
      return sortTasks(database.tasks);
    },
    async save(task, activity) {
      const storage = getStorage();
      const database = loadOrMigrateDatabase(storage, currentDate());
      const index = database.tasks.findIndex((entry) => entry.id === task.id);
      if (index === -1) database.tasks.push(task);
      else database.tasks[index] = task;
      if (activity) database.activity_log.push(activity);
      storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    },
  };
}
