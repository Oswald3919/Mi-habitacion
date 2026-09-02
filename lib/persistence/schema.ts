import type { ActivityLogEntry } from '../../features/activity/domain';
import type {
  RoomDayRecord,
  RoomItemId,
  RoomStatus,
  RoomStatusHistoryEntry,
  RoomZoneId,
} from '../../features/room/domain';

export const LOCAL_DATABASE_VERSION = 1 as const;
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
  schema_version: typeof LOCAL_DATABASE_VERSION;
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

export type LocalDatabase = LocalDatabaseV1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
