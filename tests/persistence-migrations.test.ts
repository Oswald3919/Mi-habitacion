import { describe, expect, it } from 'vitest';
import { createLocalRoomRepository, getStoredRoomState } from '../lib/persistence/local-repositories';
import {
  loadOrMigrateDatabase,
  migrateCurrentDatabase,
  migrateLegacyPayload,
} from '../lib/persistence/migrations';
import {
  LOCAL_DATABASE_KEY,
  LOCAL_DATABASE_VERSION,
  LOCAL_PROFILE_ID,
  type StorageLike,
} from '../lib/persistence/schema';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('local persistence migrations', () => {
  it('migrates V3 without modifying the legacy backup', () => {
    const storage = new MemoryStorage();
    const legacy = JSON.stringify({
      version: 4,
      date: '2026-09-01',
      state: { bed: 'ok', desk: 'attention', cubbies: 'review' },
      updated: { bed: 100, cubbies: 200 },
      history: [
        {
          date: '2026-08-31',
          status: 'ok',
          zones: { bed: 'ok', desk: 'ok', tv: 'ok', closet: 'ok' },
        },
      ],
      notifications: true,
    });
    storage.setItem('mi-habitacion:v3', legacy);

    const database = loadOrMigrateDatabase(storage, '2026-09-02');
    const stored = getStoredRoomState(database);

    expect(database.schema_version).toBe(LOCAL_DATABASE_VERSION);
    expect(database.current_date).toBe('2026-09-01');
    expect(stored.state).toMatchObject({
      bed: 'ok',
      desk: 'attention',
      cubbies: 'review',
    });
    expect(stored.updated).toMatchObject({ bed: 100, cubbies: 200 });
    expect(database.room_daily_snapshots).toHaveLength(1);
    expect(database.room_status_history).toEqual([]);
    expect(database.activity_log).toEqual([]);
    expect(database.settings.room_notifications).toBe(true);
    expect(storage.getItem('mi-habitacion:v3')).toBe(legacy);
    expect(storage.getItem(LOCAL_DATABASE_KEY)).not.toBeNull();
  });

  it('is idempotent once a current database exists', () => {
    const storage = new MemoryStorage();
    const first = loadOrMigrateDatabase(storage, '2026-09-02');
    first.settings.room_notifications = true;
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(first));
    storage.setItem(
      'mi-habitacion:v3',
      JSON.stringify({ state: { bed: 'ok' } }),
    );

    const second = loadOrMigrateDatabase(storage, '2026-09-03');

    expect(second.settings.room_notifications).toBe(true);
    expect(second.current_date).toBe('2026-09-02');
  });

  it('upgrades the phase 1 database to v4 without touching room collections', () => {
    const v1 = migrateLegacyPayload({ date: '2026-09-02', state: { bed: 'ok' } }, '2026-09-02');
    const v1Payload = { ...v1, schema_version: 1 as const };
    const upgraded = migrateCurrentDatabase(v1Payload);
    expect(upgraded?.schema_version).toBe(LOCAL_DATABASE_VERSION);
    expect(upgraded?.tasks).toEqual([]);
    expect(upgraded?.room_items).toEqual(v1.room_items);
    expect(upgraded?.room_daily_snapshots).toEqual(v1.room_daily_snapshots);
  });

  it('upgrades the tasks database to v4 with protected tasks and seeded BIS catalog', () => {
    const current = migrateLegacyPayload({ date: '2026-09-02' }, '2026-09-02');
    const task = { id: 'task-1', profile_id: LOCAL_PROFILE_ID, title: 'Dato protegido', status: 'pending' as const, due_date: null, due_time: null, priority: 'normal' as const, area: 'Personal', notes: null, related_label: null, project_id: null, goal_id: null, subject_enrollment_id: null, room_item_id: null, created_at: '2026-09-02T12:00:00.000Z', updated_at: '2026-09-02T12:00:00.000Z' };
    const v2 = { ...current, schema_version: 2 as const, tasks: [task] };
    const upgraded = migrateCurrentDatabase(v2);
    expect(upgraded?.schema_version).toBe(4);
    expect(upgraded?.tasks).toEqual([task]);
    expect(upgraded?.finance_accounts).toEqual([]);
    expect(upgraded?.finance_transactions).toEqual([]);
    expect(upgraded?.recurring_payments).toEqual([]);
    expect(upgraded?.finance_saving_goals).toEqual([]);
    expect(upgraded?.projects).toEqual([]);
    expect(upgraded?.goals).toEqual([]);
    expect(upgraded?.school_modules).toHaveLength(6);
    expect(upgraded?.school_subjects.some((subject) => subject.name === 'Cultura Digital I')).toBe(true);
    expect(upgraded?.subject_enrollments).toEqual([]);
    expect(upgraded?.ideas).toEqual([]);
  });

  it('sanitizes partial legacy data and fills safe defaults', () => {
    const database = migrateLegacyPayload(
      {
        date: 'not-a-date',
        state: { bed: 'invalid', desk: 'ok' },
        updated: { bed: -1, desk: 300, unknown: 400 },
        history: [{ invalid: true }],
      },
      '2026-09-02',
    );
    const stored = getStoredRoomState(database);

    expect(database.current_date).toBe('2026-09-02');
    expect(stored.state.bed).toBe('attention');
    expect(stored.state.desk).toBe('ok');
    expect(stored.updated).toEqual({ desk: 300 });
    expect(database.room_daily_snapshots).toEqual([]);
  });

  it('records a real automatic bed change without logging a technical activity', async () => {
    const storage = new MemoryStorage();
    const database = migrateLegacyPayload(
      {
        date: '2026-09-01',
        state: { bed: 'ok' },
      },
      '2026-09-02',
    );
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    const repository = createLocalRoomRepository({
      storage,
      currentDate: () => '2026-09-02',
      now: () => 1000,
      createId: () => 'history-1',
    });

    const loaded = await repository.loadSession();
    const persisted = JSON.parse(storage.getItem(LOCAL_DATABASE_KEY) ?? '{}');

    expect(loaded.state.bed).toBe('attention');
    expect(loaded.history).toHaveLength(1);
    expect(persisted.room_status_history).toEqual([
      expect.objectContaining({
        entity_type: 'zone',
        entity_id: 'bed',
        previous_status: 'ok',
        status: 'attention',
        source: 'day_rollover',
      }),
    ]);
    expect(persisted.activity_log).toEqual([]);
  });
});
