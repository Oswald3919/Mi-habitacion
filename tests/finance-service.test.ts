import { describe, expect, it } from 'vitest';
import { calculateAccountBalance, calculateAvailableBalance, calculateSavingProgress, type FinanceAccount } from '../features/finance/domain';
import { preparePaymentCreate, preparePaymentMark, prepareSavingGoalCreate, prepareTransactionCreate, prepareTransactionDelete, prepareTransactionUpdate } from '../features/finance/service';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';

const ids = () => { let value = 0; return () => `id-${++value}`; };
const now = '2026-09-02T12:00:00.000Z';

describe('finance service', () => {
  it('creates and updates one transaction with meaningful activity', () => {
    const created = prepareTransactionCreate(LOCAL_PROFILE_ID, { amount: 250, type: 'expense', category: 'Comida', account_id: 'cash', date: '2026-09-02', payment_method: 'cash', note: '  Cena  ', project_id: 'project-1', subject_enrollment_id: null, saving_goal_id: null }, now, ids());
    expect(created.value).toMatchObject({ amount: 250, note: 'Cena', project_id: 'project-1' });
    expect(created.activity.action).toBe('finance.transaction_created');
    const updated = prepareTransactionUpdate(LOCAL_PROFILE_ID, created.value, { ...created.value, amount: 200 }, now, ids());
    expect(updated.value.id).toBe(created.value.id);
    expect(updated.activity.action).toBe('finance.transaction_updated');
    expect(prepareTransactionDelete(LOCAL_PROFILE_ID, updated.value, now, ids()).action).toBe('finance.transaction_deleted');
  });

  it('calculates balances and saving progress instead of storing them', () => {
    const account: FinanceAccount = { id: 'cash', profile_id: LOCAL_PROFILE_ID, name: 'Efectivo', opening_balance: 1000, created_at: now, updated_at: now };
    const make = (type: 'income' | 'expense' | 'saving', amount: number, saving_goal_id: string | null = null) => prepareTransactionCreate(LOCAL_PROFILE_ID, { amount, type, category: 'General', account_id: 'cash', date: '2026-09-02', payment_method: 'cash', note: null, project_id: null, subject_enrollment_id: null, saving_goal_id }, now, ids()).value;
    const transactions = [make('income', 500), make('expense', 200), make('saving', 100, 'goal-1')];
    expect(calculateAccountBalance(account, transactions)).toBe(1200);
    expect(calculateAvailableBalance([account], transactions)).toBe(1200);
    expect(calculateSavingProgress('goal-1', transactions)).toBe(100);
  });

  it('marks a recurring payment with a real expense and one payment activity', () => {
    const payment = preparePaymentCreate(LOCAL_PROFILE_ID, { name: 'Internet', amount: 500, category: 'Servicios', account_id: 'card', payment_method: 'card', next_due_date: '2026-09-05', note: null }, now, ids());
    const mutation = preparePaymentMark(LOCAL_PROFILE_ID, payment, now, ids());
    expect(mutation.transaction).toMatchObject({ type: 'expense', recurring_payment_id: payment.id, amount: 500 });
    expect(mutation.payment.next_due_date).toBe('2026-10-05');
    expect(mutation.activity.action).toBe('finance.payment_marked');
    const monthEnd = preparePaymentCreate(LOCAL_PROFILE_ID, { name: 'Renta', amount: 500, category: 'Casa', account_id: 'card', payment_method: 'card', next_due_date: '2027-01-31', note: null }, now, ids());
    expect(preparePaymentMark(LOCAL_PROFILE_ID, monthEnd, now, ids()).payment.next_due_date).toBe('2027-02-28');
  });

  it('records saving goal changes as saving activity', () => {
    const mutation = prepareSavingGoalCreate(LOCAL_PROFILE_ID, { name: 'Laptop', target_amount: 20000, target_date: null }, now, ids());
    expect(mutation.activity.action).toBe('finance.saving_updated');
  });
});
