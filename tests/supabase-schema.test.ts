import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(new URL('../supabase/migrations/202609020001_initial_v1.sql', import.meta.url), 'utf8');
const personalTables = ['profiles','projects','goals','room_zones','room_items','subject_enrollments','finance_accounts','finance_saving_goals','recurring_payments','finance_transactions','tasks','ideas','room_status_history','room_daily_snapshots','activity_log','user_settings','local_migrations'];

describe('schema Supabase', () => {
  it('activa RLS y políticas de ownership para todas las tablas personales', () => {
    for (const table of personalTables) expect(sql).toContain(`'${table}'`);
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('(select auth.uid()) = user_id');
    expect(sql).toContain('(select auth.uid()) = id');
  });

  it('no contiene credenciales privilegiadas', () => {
    expect(sql.toLowerCase()).not.toContain('service_role');
  });
});
