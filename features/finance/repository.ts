import type { ActivityLogEntry } from '../activity/domain';
import type { FinanceAccount, FinanceSavingGoal, FinanceTransaction, RecurringPayment } from './domain';

export type FinanceSnapshot = {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  payments: RecurringPayment[];
  savingGoals: FinanceSavingGoal[];
};

export interface FinanceRepository {
  load(): Promise<FinanceSnapshot>;
  saveAccount(account: FinanceAccount): Promise<void>;
  saveTransaction(transaction: FinanceTransaction, activity: ActivityLogEntry): Promise<void>;
  deleteTransaction(transactionId: string, activity: ActivityLogEntry): Promise<void>;
  savePayment(payment: RecurringPayment, activity: ActivityLogEntry | null, transaction?: FinanceTransaction): Promise<void>;
  saveSavingGoal(goal: FinanceSavingGoal, activity: ActivityLogEntry): Promise<void>;
}
