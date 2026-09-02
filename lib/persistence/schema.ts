import type { ActivityLogEntry } from '../../features/activity/domain';
import type { Task } from '../../features/tasks/domain';
import type { FinanceAccount, FinanceSavingGoal, FinanceTransaction, RecurringPayment } from '../../features/finance/domain';
import type { Project } from '../../features/projects/domain';
import type { Goal } from '../../features/goals/domain';
import type {
  RoomDayRecord,
  RoomItemId,
  RoomStatus,
  RoomStatusHistoryEntry,
  RoomZoneId,
} from '../../features/room/domain';

export const LOCAL_DATABASE_VERSION = 3 as const;
export const LOCAL_DATABASE_KEY = 'mi-habitacion:database';
export const LEGACY_DATABASE_KEYS = [
  'mi-habitacion:v3',
  'mi-habitacion:v2',
] as const;
export const LOCAL_PROFILE_ID = '00000000-0000-4000-8000-000000000001';

export type StoredRoomZone = {
  id: RoomZoneId;
  profile_id: string;
  name: string;
  status: RoomStatus | null;
  updated_at: number | null;
  position: number;
};

export type StoredRoomItem = {
  id: RoomItemId;
  profile_id: string;
  room_zone_id: RoomZoneId;
  name: string;
  status: RoomStatus;
  updated_at: number | null;
  position: number;
};

export type StoredRoomDailySnapshot = RoomDayRecord & {
  id: string;
  profile_id: string;
};

export type LocalDatabaseV1 = {
  schema_version: 1;
  profile_id: string;
  current_date: string;
  room_zones: StoredRoomZone[];
  room_items: StoredRoomItem[];
  room_status_history: RoomStatusHistoryEntry[];
  room_daily_snapshots: StoredRoomDailySnapshot[];
  activity_log: ActivityLogEntry[];
  settings: {
    room_notifications: boolean;
  };
};

export type LocalDatabaseV2 = Omit<LocalDatabaseV1, 'schema_version'> & {
  schema_version: 2;
  tasks: Task[];
};

export type LocalDatabaseV3 = Omit<LocalDatabaseV2, 'schema_version'> & {
  schema_version: typeof LOCAL_DATABASE_VERSION;
  finance_accounts: FinanceAccount[];
  finance_transactions: FinanceTransaction[];
  recurring_payments: RecurringPayment[];
  finance_saving_goals: FinanceSavingGoal[];
  projects: Project[];
  goals: Goal[];
};

export type LocalDatabase = LocalDatabaseV3;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
