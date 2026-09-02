import type { ActivityLogEntry } from '../activity/domain';
import type { FinanceTransaction } from '../finance/domain';
import type { Task } from '../tasks/domain';
import type { Project } from './domain';

export interface ProjectRepository {
  list(): Promise<Project[]>;
  save(project: Project, activity: ActivityLogEntry): Promise<void>;
  related(projectId: string): Promise<{ tasks: Task[]; transactions: FinanceTransaction[]; activity: ActivityLogEntry[] }>;
}
