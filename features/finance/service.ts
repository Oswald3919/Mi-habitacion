import type { ActivityLogEntry } from '../activity/domain';
import type { FinanceAccount, FinanceSavingGoal, FinanceTransaction, NewFinanceTransactionInput, NewRecurringPaymentInput, NewSavingGoalInput, RecurringPayment } from './domain';

type IdFactory = () => string;
type Mutation<T> = { value: T; activity: ActivityLogEntry };

const clean = (value: string | null | undefined) => value?.trim() || null;
const activity = (id: string, profileId: string, action: ActivityLogEntry['action'], entityType: ActivityLogEntry['entity_type'], entityId: string, occurredAt: string, metadata: Record<string, unknown>): ActivityLogEntry => ({ id, profile_id: profileId, action, entity_type: entityType, entity_id: entityId, occurred_at: Date.parse(occurredAt), metadata });

export function prepareAccountCreate(profileId: string, name: string, openingBalance: number, now: string, createId: IdFactory): FinanceAccount {
  const normalized = name.trim();
  if (!normalized) throw new Error('El nombre de la cuenta es obligatorio');
  if (!Number.isFinite(openingBalance)) throw new Error('El saldo inicial no es válido');
  return { id: createId(), profile_id: profileId, name: normalized, opening_balance: openingBalance, created_at: now, updated_at: now };
}

export function prepareTransactionCreate(profileId: string, input: NewFinanceTransactionInput, now: string, createId: IdFactory): Mutation<FinanceTransaction> {
  if (!(input.amount > 0)) throw new Error('El monto debe ser mayor que cero');
  if (!input.account_id) throw new Error('Selecciona una cuenta');
  const value: FinanceTransaction = { ...input, id: createId(), profile_id: profileId, amount: Number(input.amount), category: input.category.trim() || 'General', note: clean(input.note), project_id: input.project_id || null, subject_enrollment_id: input.subject_enrollment_id || null, saving_goal_id: input.saving_goal_id || null, recurring_payment_id: input.recurring_payment_id || null, created_at: now, updated_at: now };
  return { value, activity: activity(createId(), profileId, 'finance.transaction_created', 'finance_transaction', value.id, now, { amount: value.amount, type: value.type, account_id: value.account_id }) };
}

export function prepareTransactionUpdate(profileId: string, transaction: FinanceTransaction, input: NewFinanceTransactionInput, now: string, createId: IdFactory): Mutation<FinanceTransaction> {
  if (!(input.amount > 0)) throw new Error('El monto debe ser mayor que cero');
  const value: FinanceTransaction = { ...transaction, ...input, amount: Number(input.amount), category: input.category.trim() || 'General', note: clean(input.note), project_id: input.project_id || null, subject_enrollment_id: input.subject_enrollment_id || null, saving_goal_id: input.saving_goal_id || null, recurring_payment_id: input.recurring_payment_id || null, updated_at: now };
  return { value, activity: activity(createId(), profileId, 'finance.transaction_updated', 'finance_transaction', value.id, now, { amount: value.amount, type: value.type }) };
}

export function prepareTransactionDelete(profileId: string, transaction: FinanceTransaction, now: string, createId: IdFactory): ActivityLogEntry {
  return activity(createId(), profileId, 'finance.transaction_deleted', 'finance_transaction', transaction.id, now, { amount: transaction.amount, type: transaction.type });
}

export function preparePaymentCreate(profileId: string, input: NewRecurringPaymentInput, now: string, createId: IdFactory): RecurringPayment {
  if (!input.name.trim() || !(input.amount > 0) || !input.account_id || !input.next_due_date) throw new Error('Completa los datos del pago');
  return { id: createId(), profile_id: profileId, name: input.name.trim(), amount: Number(input.amount), category: input.category.trim() || 'Pagos', account_id: input.account_id, payment_method: input.payment_method, next_due_date: input.next_due_date, note: clean(input.note), active: true, last_paid_at: null, created_at: now, updated_at: now };
}

function nextMonth(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const targetYear = month === 12 ? year + 1 : year;
  const targetMonth = month === 12 ? 1 : month + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

export function preparePaymentMark(profileId: string, payment: RecurringPayment, now: string, createId: IdFactory): { payment: RecurringPayment; transaction: FinanceTransaction; activity: ActivityLogEntry } {
  const transactionId = createId();
  const updated: RecurringPayment = { ...payment, last_paid_at: now, next_due_date: nextMonth(payment.next_due_date), updated_at: now };
  const transaction: FinanceTransaction = { id: transactionId, profile_id: profileId, amount: payment.amount, type: 'expense', category: payment.category, account_id: payment.account_id, date: now.slice(0, 10), payment_method: payment.payment_method, note: payment.note, project_id: null, subject_enrollment_id: null, saving_goal_id: null, recurring_payment_id: payment.id, created_at: now, updated_at: now };
  return { payment: updated, transaction, activity: activity(createId(), profileId, 'finance.payment_marked', 'recurring_payment', payment.id, now, { transaction_id: transactionId, amount: payment.amount }) };
}

export function prepareSavingGoalCreate(profileId: string, input: NewSavingGoalInput, now: string, createId: IdFactory, existing?: FinanceSavingGoal): Mutation<FinanceSavingGoal> {
  if (!input.name.trim() || !(input.target_amount > 0)) throw new Error('Completa la meta de ahorro');
  const value: FinanceSavingGoal = existing ? { ...existing, ...input, name: input.name.trim(), target_amount: Number(input.target_amount), target_date: input.target_date || null, updated_at: now } : { id: createId(), profile_id: profileId, name: input.name.trim(), target_amount: Number(input.target_amount), target_date: input.target_date || null, created_at: now, updated_at: now };
  return { value, activity: activity(createId(), profileId, 'finance.saving_updated', 'saving_goal', value.id, now, { target_amount: value.target_amount }) };
}
