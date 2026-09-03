import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(new URL('../supabase/migrations/202609030001_task_status_and_finance_unlink.sql', import.meta.url), 'utf8').toLowerCase();

describe('follow-up Supabase migration', () => {
  it('preserves enrollments by clearing only the optional transaction reference', () => {
    expect(sql).toContain('on delete set null (finance_transaction_id)');
    expect(sql).not.toContain('on delete cascade');
    expect(sql).toContain('subject_enrollments_finance_transaction_idx');
  });

  it('normalizes legacy task statuses to the canonical values', () => {
    expect(sql).toContain("'done'");
    expect(sql).toContain("'terminada'");
    expect(sql).toContain("check (status in ('pending', 'completed'))");
  });
});
