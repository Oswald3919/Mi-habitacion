import {
  DEFAULT_ROOM_STATE,
  deriveRoomView,
  isRoomStatus,
  ROOM_ITEM_IDS,
  ROOM_ZONE_IDS,
  type RoomDayRecord,
  type RoomEntityId,
  type RoomItemId,
  type RoomState,
  type RoomUpdated,
  type RoomZoneId,
} from '../../features/room/domain';
import { isTask } from '../../features/tasks/domain';
import {
  LEGACY_DATABASE_KEYS,
  LOCAL_DATABASE_KEY,
  LOCAL_DATABASE_VERSION,
  LOCAL_PROFILE_ID,
  type LocalDatabase,
  type StorageLike,
  type StoredRoomDailySnapshot,
  type StoredRoomItem,
  type StoredRoomZone,
  type LocalDatabaseV1,
} from './schema';

const ZONE_NAMES: Record<RoomZoneId, string> = {
  bed: 'Cama',
  desk: 'Escritorio',
  tv: 'Zona de TV',
  closet: 'Clóset',
};

const ITEM_DEFINITIONS: Record<
  RoomItemId,
  { name: string; zoneId: RoomZoneId }
> = {
  tvUnit: { name: 'Mueble de TV', zoneId: 'tv' },
  shoeShelf: { name: 'Estantería / mueble de zapatos', zoneId: 'tv' },
  dresser: { name: 'Cómoda', zoneId: 'closet' },
  hanging: { name: 'Ropa colgada', zoneId: 'closet' },
  laundry: { name: 'Ropa sucia', zoneId: 'closet' },
  cubbies: { name: 'Cubículos', zoneId: 'closet' },
};

type LegacyPayload = {
  date?: unknown;
  state?: unknown;
  updated?: unknown;
  history?: unknown;
  notifications?: unknown;
};

function migrateV1ToV2(database: LocalDatabaseV1): LocalDatabase {
  return { ...database, schema_version: LOCAL_DATABASE_VERSION, tasks: [] };
}

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeState(value: unknown): RoomState {
  const state = { ...DEFAULT_ROOM_STATE };
  if (!isRecord(value)) return state;

  for (const entityId of Object.keys(state) as RoomEntityId[]) {
    if (isRoomStatus(value[entityId])) state[entityId] = value[entityId];
  }

  return state;
}

function sanitizeUpdated(value: unknown): RoomUpdated {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([entityId, timestamp]) =>
        entityId in DEFAULT_ROOM_STATE &&
        typeof timestamp === 'number' &&
        Number.isFinite(timestamp) &&
        timestamp >= 0,
    ),
  ) as RoomUpdated;
}

function sanitizeDayRecord(value: unknown): RoomDayRecord | null {
  if (!isRecord(value) || !isDateKey(value.date) || !isRecord(value.zones)) {
    return null;
  }

  const zoneValues = value.zones;
  const zones = Object.fromEntries(
    ROOM_ZONE_IDS.map((zoneId) => [zoneId, zoneValues[zoneId]]),
  );
  if (Object.values(zones).some((status) => !isRoomStatus(status))) return null;
  if (!isRoomStatus(value.status)) return null;

  return {
    date: value.date,
    status: value.status,
    zones: zones as Record<RoomZoneId, RoomState[RoomZoneId]>,
  };
}

function sanitizeHistory(value: unknown): RoomDayRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(sanitizeDayRecord)
    .filter((record): record is RoomDayRecord => record !== null)
    .slice(-365);
}

function buildZoneRows(
  state: RoomState,
  updated: RoomUpdated,
): StoredRoomZone[] {
  const view = deriveRoomView(state);
  return ROOM_ZONE_IDS.map((zoneId, position) => ({
    id: zoneId,
    profile_id: LOCAL_PROFILE_ID,
    name: ZONE_NAMES[zoneId],
    status: zoneId === 'tv' || zoneId === 'closet' ? null : view[zoneId],
    updated_at: updated[zoneId] ?? null,
    position,
  }));
}

function buildItemRows(
  state: RoomState,
  updated: RoomUpdated,
): StoredRoomItem[] {
  return ROOM_ITEM_IDS.map((itemId, position) => ({
    id: itemId,
    profile_id: LOCAL_PROFILE_ID,
    room_zone_id: ITEM_DEFINITIONS[itemId].zoneId,
    name: ITEM_DEFINITIONS[itemId].name,
    status: state[itemId],
    updated_at: updated[itemId] ?? null,
    position,
  }));
}

function buildDailySnapshots(history: RoomDayRecord[]): StoredRoomDailySnapshot[] {
  return history.map((record) => ({
    ...record,
    id: `room-day:${record.date}`,
    profile_id: LOCAL_PROFILE_ID,
  }));
}

export function migrateLegacyPayload(
  payload: LegacyPayload | null,
  currentDate: string,
): LocalDatabase {
  const state = sanitizeState(payload?.state);
  const updated = sanitizeUpdated(payload?.updated);
  const history = sanitizeHistory(payload?.history);

  return {
    schema_version: LOCAL_DATABASE_VERSION,
    profile_id: LOCAL_PROFILE_ID,
    current_date: isDateKey(payload?.date) ? payload.date : currentDate,
    room_zones: buildZoneRows(state, updated),
    room_items: buildItemRows(state, updated),
    room_status_history: [],
    room_daily_snapshots: buildDailySnapshots(history),
    activity_log: [],
    settings: {
      room_notifications: Boolean(payload?.notifications),
    },
    tasks: [],
  };
}

function hasCommonDatabaseShape(value: Record<string, unknown>): boolean {
  return (
    typeof value.profile_id === 'string' &&
    isDateKey(value.current_date) &&
    Array.isArray(value.room_zones) &&
    Array.isArray(value.room_items) &&
    Array.isArray(value.room_status_history) &&
    Array.isArray(value.room_daily_snapshots) &&
    Array.isArray(value.activity_log) &&
    isRecord(value.settings) &&
    typeof value.settings.room_notifications === 'boolean'
  );
}

export function isLocalDatabaseV1(value: unknown): value is LocalDatabaseV1 {
  if (!isRecord(value) || value.schema_version !== 1) {
    return false;
  }
  return hasCommonDatabaseShape(value);
}

export function isLocalDatabase(value: unknown): value is LocalDatabase {
  if (!isRecord(value) || value.schema_version !== LOCAL_DATABASE_VERSION) {
    return false;
  }
  return hasCommonDatabaseShape(value) && Array.isArray(value.tasks) && value.tasks.every(isTask);
}

export function migrateCurrentDatabase(value: unknown): LocalDatabase | null {
  if (isLocalDatabase(value)) return value;
  if (isLocalDatabaseV1(value)) return migrateV1ToV2(value);
  return null;
}

export function loadOrMigrateDatabase(
  storage: StorageLike,
  currentDate: string,
): LocalDatabase {
  const current = parseJson(storage.getItem(LOCAL_DATABASE_KEY));
  const migratedCurrent = migrateCurrentDatabase(current);
  if (migratedCurrent) {
    if (migratedCurrent !== current) {
      storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(migratedCurrent));
    }
    return migratedCurrent;
  }

  let legacyPayload: LegacyPayload | null = null;
  for (const key of LEGACY_DATABASE_KEYS) {
    const candidate = parseJson(storage.getItem(key));
    if (isRecord(candidate) && isRecord(candidate.state)) {
      legacyPayload = candidate;
      break;
    }
  }

  const migrated = migrateLegacyPayload(legacyPayload, currentDate);
  storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(migrated));
  return migrated;
}
