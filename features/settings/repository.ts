import type { ActivityLogEntry } from '../activity/domain';
import type { AppSettings } from './domain';
export interface SettingsRepository { load(): Promise<AppSettings>; save(settings: AppSettings, activity: ActivityLogEntry): Promise<void>; exportBackup(): Promise<string>; importBackup(raw: string, now: string, createId: () => string): Promise<void>; }
