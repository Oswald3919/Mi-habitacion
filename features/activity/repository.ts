import type { ActivityLogEntry } from './domain';
export interface ActivityRepository { list(): Promise<ActivityLogEntry[]>; }
