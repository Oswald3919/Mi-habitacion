import type { ActivityLogEntry } from '../activity/domain';
import type {
  RoomDayRecord,
  RoomSession,
  RoomStatusHistoryEntry,
} from './domain';

export type RoomMutation = {
  session: RoomSession;
  statusHistory: RoomStatusHistoryEntry[];
  activity: ActivityLogEntry[];
};

export interface RoomRepository {
  loadSession(): Promise<RoomSession>;
  loadDailyHistory(): Promise<RoomDayRecord[]>;
  commit(mutation: RoomMutation): Promise<void>;
  saveNotificationPreference(enabled: boolean): Promise<void>;
}
