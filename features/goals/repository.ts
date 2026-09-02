import type { ActivityLogEntry } from '../activity/domain';
import type { Task } from '../tasks/domain';
import type { Goal } from './domain';
export interface GoalRepository { list(): Promise<Goal[]>; save(goal: Goal, activity: ActivityLogEntry): Promise<void>; relatedTasks(goalId: string): Promise<Task[]>; }
