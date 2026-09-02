import { describe, expect, it } from 'vitest';
import { createLocalSettingsRepository } from '../lib/persistence/local-settings-repository';
import { migrateLegacyPayload } from '../lib/persistence/migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from '../lib/persistence/schema';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('local backup', () => {
  it('does not overwrite data when an import is invalid', async () => {
    const storage = new MemoryStorage();
    const database = migrateLegacyPayload({ date: '2026-09-02' }, '2026-09-02');
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    const before = storage.getItem(LOCAL_DATABASE_KEY);
    const repository = createLocalSettingsRepository({ storage, currentDate: () => '2026-09-02' });
    await expect(repository.importBackup('{invalid', '2026-09-02T12:00:00.000Z', () => 'id-1')).rejects.toThrow('JSON válido');
    expect(storage.getItem(LOCAL_DATABASE_KEY)).toBe(before);
  });

  it('exports and safely imports a compatible complete database', async () => {
    const storage = new MemoryStorage();
    const database = migrateLegacyPayload({ date: '2026-09-02' }, '2026-09-02');
    database.settings.profile_name = 'Armando BIS';
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    const repository = createLocalSettingsRepository({ storage, currentDate: () => '2026-09-02' });
    const backup = await repository.exportBackup();
    database.settings.profile_name = 'Otro';
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    await repository.importBackup(backup, '2026-09-02T12:00:00.000Z', () => 'import-1');
    const restored = JSON.parse(storage.getItem(LOCAL_DATABASE_KEY) ?? '{}');
    expect(restored.settings.profile_name).toBe('Armando BIS');
    expect(restored.activity_log.at(-1).action).toBe('data.imported');
  });
});
