import type { ActivityLogEntry } from '../activity/domain';
import type { Task } from './domain';

export interface TaskRepository {
  list(): Promise<Task[]>;
  save(task: Task, activity: ActivityLogEntry | null): Promise<void>;
}
