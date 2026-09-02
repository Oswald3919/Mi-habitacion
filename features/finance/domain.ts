export type FinanceTransactionType = 'income' | 'expense' | 'saving';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export type FinanceAccount = {
  id: string;
  profile_id: string;
  name: string;
  opening_balance: number;
  created_at: string;
  updated_at: string;
};

export type FinanceTransaction = {
  id: string;
  profile_id: string;
  amount: number;
  type: FinanceTransactionType;
  category: string;
  account_id: string;
  date: string;
  payment_method: PaymentMethod;
  note: string | null;
  project_id: string | null;
  subject_enrollment_id: string | null;
  saving_goal_id: string | null;
  recurring_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RecurringPayment = {
  id: string;
  profile_id: string;
  name: string;
  amount: number;
  category: string;
  account_id: string;
  payment_method: PaymentMethod;
  next_due_date: string;
  note: string | null;
  active: boolean;
  last_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceSavingGoal = {
  id: string;
  profile_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type NewFinanceTransactionInput = Omit<FinanceTransaction, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'recurring_payment_id'> & { recurring_payment_id?: string | null };
export type NewRecurringPaymentInput = Pick<RecurringPayment, 'name' | 'amount' | 'category' | 'account_id' | 'payment_method' | 'next_due_date' | 'note'>;
export type NewSavingGoalInput = Pick<FinanceSavingGoal, 'name' | 'target_amount' | 'target_date'>;

export const FINANCE_TRANSACTION_LABEL: Record<FinanceTransactionType, string> = { income: 'Ingreso', expense: 'Gasto', saving: 'Ahorro' };
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro' };
export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[];

export function calculateAccountBalance(account: FinanceAccount, transactions: FinanceTransaction[]): number {
  return transactions.filter((entry) => entry.account_id === account.id).reduce((balance, entry) => balance + (entry.type === 'income' ? entry.amount : -entry.amount), account.opening_balance);
}

export function calculateAvailableBalance(accounts: FinanceAccount[], transactions: FinanceTransaction[]): number {
  return accounts.reduce((total, account) => total + calculateAccountBalance(account, transactions), 0);
}

export function calculateSavingProgress(goalId: string, transactions: FinanceTransaction[]): number {
  return transactions.filter((entry) => entry.type === 'saving' && entry.saving_goal_id === goalId).reduce((total, entry) => total + entry.amount, 0);
}

export function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FinanceTransaction>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.amount === 'number' && item.amount > 0 && (item.type === 'income' || item.type === 'expense' || item.type === 'saving') && typeof item.account_id === 'string' && typeof item.date === 'string' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}

export function isFinanceAccount(value: unknown): value is FinanceAccount {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FinanceAccount>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && typeof item.opening_balance === 'number' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}

export function isRecurringPayment(value: unknown): value is RecurringPayment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<RecurringPayment>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && typeof item.amount === 'number' && typeof item.next_due_date === 'string' && typeof item.active === 'boolean';
}

export function isFinanceSavingGoal(value: unknown): value is FinanceSavingGoal {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FinanceSavingGoal>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && typeof item.target_amount === 'number' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}
