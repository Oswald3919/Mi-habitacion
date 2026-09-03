import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { migrateLegacyPayload } from '../lib/persistence/migrations';
import { __testables, uploadDatabaseToSupabase } from '../lib/persistence/local-to-supabase';

function fakeClient(done = false) {
  const writes: Array<{ table: string; rows: unknown }> = [];
  const client = { from(table: string) { return {
    upsert: async (rows: unknown) => { writes.push({ table, rows }); return { data: null, error: null }; },
    select: (_columns?: string, options?: { count?: string; head?: boolean }) => { const result = { data: [], error: null, count: options?.count ? 0 : null }; return { eq: () => ({ maybeSingle: async () => ({ data: done ? { migration_key: 'v1-local-database' } : null, error: null }) }), then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve) }; },
  }; } } as unknown as SupabaseClient;
  return { client, writes };
}

describe('migración local a Supabase', () => {
  it('reemplaza profile_id por el usuario autenticado', () => {
    expect(__testables.omitProfile({ id: 'x', profile_id: 'local', title: 'Tarea' }, 'user-1')).toEqual({ id: 'x', user_id: 'user-1', title: 'Tarea' });
  });

  it('es idempotente cuando la migración ya está registrada', async () => {
    const { client, writes } = fakeClient(true);
    await uploadDatabaseToSupabase(client, '00000000-0000-4000-8000-000000000099', migrateLegacyPayload(null, '2026-09-02'));
    expect(writes).toEqual([]);
  });

  it('sube relaciones con ownership y marca éxito al final', async () => {
    const { client, writes } = fakeClient(); const userId = '00000000-0000-4000-8000-000000000099';
    await uploadDatabaseToSupabase(client, userId, migrateLegacyPayload(null, '2026-09-02'));
    const zones = writes.find((item) => item.table === 'room_zones')?.rows as Array<{ user_id: string }>;
    expect(zones.every((row) => row.user_id === userId)).toBe(true);
    expect(writes.at(-1)?.table).toBe('local_migrations');
  });
});
