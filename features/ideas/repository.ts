import type { ActivityLogEntry } from '../activity/domain';
import type { Idea } from './domain';
export interface IdeaRepository { list(): Promise<Idea[]>; save(idea: Idea, activity: ActivityLogEntry): Promise<void>; }
