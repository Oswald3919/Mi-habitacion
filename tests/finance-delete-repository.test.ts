import { describe, expect, it } from 'vitest';
import { createLocalFinanceRepository } from '../lib/persistence/local-finance-repository';
import { migrateLegacyPayload } from '../lib/persistence/migrations';
import { LOCAL_DATABASE_KEY, LOCAL_PROFILE_ID, type StorageLike } from '../lib/persistence/schema';
import type { ActivityLogEntry } from '../features/activity/domain';

class MemoryStorage implements StorageLike { values = new Map<string, string>(); getItem(key: string) { return this.values.get(key) ?? null; } setItem(key: string, value: string) { this.values.set(key, value); } }

describe('finance transaction deletion', () => {
  it('preserves the school enrollment and only clears its payment reference', async () => {
    const storage = new MemoryStorage();
    const database = migrateLegacyPayload({ date: '2026-09-03' }, '2026-09-03');
    database.subject_enrollments.push({ id: 'enrollment-1', profile_id: LOCAL_PROFILE_ID, subject_id: 'bis-subject-1-1', start_date: '2026-09-05', duration_weeks: 2, final_grade: null, paid_at: '2026-09-03T12:00:00.000Z', finance_transaction_id: 'transaction-1', created_at: '2026-09-03T12:00:00.000Z', updated_at: '2026-09-03T12:00:00.000Z' });
    database.finance_transactions.push({ id: 'transaction-1', profile_id: LOCAL_PROFILE_ID, amount: 772, type: 'expense', category: 'Escuela', account_id: 'account-1', date: '2026-09-03', payment_method: 'card', note: null, project_id: null, subject_enrollment_id: 'enrollment-1', saving_goal_id: null, recurring_payment_id: null, created_at: '2026-09-03T12:00:00.000Z', updated_at: '2026-09-03T12:00:00.000Z' });
    storage.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
    const activity: ActivityLogEntry = { id: 'activity-1', profile_id: LOCAL_PROFILE_ID, action: 'finance.transaction_deleted', entity_type: 'finance_transaction', entity_id: 'transaction-1', occurred_at: Date.now(), metadata: {} };
    await createLocalFinanceRepository({ storage }).deleteTransaction('transaction-1', activity);
    const saved = JSON.parse(storage.getItem(LOCAL_DATABASE_KEY) ?? '{}');
    expect(saved.finance_transactions).toEqual([]);
    expect(saved.subject_enrollments).toHaveLength(1);
    expect(saved.subject_enrollments[0]).toMatchObject({ id: 'enrollment-1', finance_transaction_id: null, paid_at: '2026-09-03T12:00:00.000Z' });
  });
});
