import {
  applyRoomStatus,
  createRoomDayRecord,
  DEFAULT_ROOM_STATE,
  ROOM_ITEM_IDS,
  ROOM_ZONE_IDS,
  type RoomDayRecord,
  type RoomSession,
  type RoomState,
  type RoomUpdated,
} from '../../features/room/domain';
import type {
  RoomMutation,
  RoomRepository,
} from '../../features/room/repository';
import { loadOrMigrateDatabase } from './migrations';
import {
  LOCAL_DATABASE_KEY,
  type LocalDatabase,
  type StorageLike,
} from './schema';

type LocalRepositoryOptions = {
  storage?: StorageLike;
  currentDate?: () => string;
  now?: () => number;
  createId?: () => string;
};

function getBrowserStorage(): StorageLike {
  return window.localStorage;
}

function defaultCurrentDate(): string {
  return new Date().toLocaleDateString('en-CA');
}

function defaultCreateId(): string {
  return globalThis.crypto.randomUUID();
}

function databaseToSession(database: LocalDatabase): RoomSession {
  const state: RoomState = { ...DEFAULT_ROOM_STATE };
  const updated: RoomUpdated = {};

  for (const zone of database.room_zones) {
    if (zone.status) state[zone.id] = zone.status;
    if (zone.updated_at !== null) updated[zone.id] = zone.updated_at;
  }

  for (const item of database.room_items) {
    state[item.id] = item.status;
    if (item.updated_at !== null) updated[item.id] = item.updated_at;
  }

  return {
    date: database.current_date,
    state,
    updated,
    history: database.room_daily_snapshots.map(
      ({ date, status, zones }) => ({ date, status, zones }),
    ),
    notifications: database.settings.room_notifications,
  };
}

function applySessionToDatabase(
  database: LocalDatabase,
  session: RoomSession,
): LocalDatabase {
  return {
    ...database,
    current_date: session.date,
    room_zones: database.room_zones.map((zone) => ({
      ...zone,
      status:
        zone.id === 'tv' || zone.id === 'closet'
          ? null
          : session.state[zone.id],
      updated_at: session.updated[zone.id] ?? null,
    })),
    room_items: database.room_items.map((item) => ({
      ...item,
      status: session.state[item.id],
      updated_at: session.updated[item.id] ?? null,
    })),
    room_daily_snapshots: session.history.map((record) => ({
      ...record,
      id: `room-day:${record.date}`,
      profile_id: database.profile_id,
    })),
    settings: {
      ...database.settings,
      room_notifications: session.notifications,
    },
  };
}

function saveDatabase(storage: StorageLike, database: LocalDatabase): void {
  storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
}

function advanceSessionToDate(
  database: LocalDatabase,
  session: RoomSession,
  currentDate: string,
  changedAt: number,
  createId: () => string,
): { database: LocalDatabase; session: RoomSession } {
  if (session.date === currentDate) return { database, session };

  const previousDay = createRoomDayRecord(session.state, session.date);
  const history = [
    ...session.history.filter((entry) => entry.date !== previousDay.date),
    previousDay,
  ].slice(-365);
  const change = applyRoomStatus(
    session.state,
    session.updated,
    'bed',
    'attention',
    changedAt,
  );
  const nextSession: RoomSession = {
    ...session,
    date: currentDate,
    state: change.state,
    updated: change.updated,
    history,
  };
  const nextDatabase = applySessionToDatabase(database, nextSession);

  nextDatabase.room_status_history.push(
    ...change.changedEntities.map((entry) => ({
      id: createId(),
      profile_id: database.profile_id,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      previous_status: entry.previousStatus,
      status: entry.status,
      changed_at: changedAt,
      source: 'day_rollover' as const,
    })),
  );

  return { database: nextDatabase, session: nextSession };
}

export function createLocalRoomRepository(
  options: LocalRepositoryOptions = {},
): RoomRepository {
  const getStorage = () => options.storage ?? getBrowserStorage();
  const currentDate = options.currentDate ?? defaultCurrentDate;
  const now = options.now ?? Date.now;
  const createId = options.createId ?? defaultCreateId;

  const readDatabase = () =>
    loadOrMigrateDatabase(getStorage(), currentDate());

  return {
    async loadSession() {
      const database = readDatabase();
      const advanced = advanceSessionToDate(
        database,
        databaseToSession(database),
        currentDate(),
        now(),
        createId,
      );
      if (advanced.database !== database) {
        saveDatabase(getStorage(), advanced.database);
      }
      return advanced.session;
    },

    async loadDailyHistory(): Promise<RoomDayRecord[]> {
      return databaseToSession(readDatabase()).history;
    },

    async commit(mutation: RoomMutation) {
      const database = applySessionToDatabase(readDatabase(), mutation.session);
      database.room_status_history.push(...mutation.statusHistory);
      database.activity_log.push(...mutation.activity);
      saveDatabase(getStorage(), database);
    },

    async saveNotificationPreference(enabled: boolean) {
      const database = readDatabase();
      database.settings.room_notifications = enabled;
      saveDatabase(getStorage(), database);
    },
  };
}

export function getStoredRoomState(database: LocalDatabase): {
  state: RoomState;
  updated: RoomUpdated;
} {
  const session = databaseToSession(database);
  return { state: session.state, updated: session.updated };
}

export const EDITABLE_ROOM_ZONE_IDS = ROOM_ZONE_IDS.filter(
  (zoneId) => zoneId === 'bed' || zoneId === 'desk',
);
export const STORED_ROOM_ITEM_IDS = ROOM_ITEM_IDS;
