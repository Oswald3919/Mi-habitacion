import type { FinanceRepository } from '../../features/finance/repository';
import { loadOrMigrateDatabase } from './migrations';
import { LOCAL_DATABASE_KEY, type StorageLike } from './schema';

type Options = { storage?: StorageLike; currentDate?: () => string };
const today = () => new Date().toLocaleDateString('en-CA');
const browserStorage = (): StorageLike => window.localStorage;

export function createLocalFinanceRepository(options: Options = {}): FinanceRepository {
  const storage = () => options.storage ?? browserStorage();
  const load = () => loadOrMigrateDatabase(storage(), (options.currentDate ?? today)());
  const save = (database: ReturnType<typeof load>) => storage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
  return {
    async load() { const db = load(); return { accounts: db.finance_accounts, transactions: [...db.finance_transactions].sort((a, b) => b.date.localeCompare(a.date)), payments: [...db.recurring_payments].sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)), savingGoals: db.finance_saving_goals }; },
    async saveAccount(account) { const db = load(); const index = db.finance_accounts.findIndex((item) => item.id === account.id); if (index < 0) db.finance_accounts.push(account); else db.finance_accounts[index] = account; save(db); },
    async saveTransaction(transaction, entry) { const db = load(); const index = db.finance_transactions.findIndex((item) => item.id === transaction.id); if (index < 0) db.finance_transactions.push(transaction); else db.finance_transactions[index] = transaction; db.activity_log.push(entry); save(db); },
    async deleteTransaction(transactionId, entry) { const db = load(); db.subject_enrollments = db.subject_enrollments.map((item) => item.finance_transaction_id === transactionId ? { ...item, finance_transaction_id: null, updated_at: new Date().toISOString() } : item); db.finance_transactions = db.finance_transactions.filter((item) => item.id !== transactionId); db.activity_log.push(entry); save(db); },
    async savePayment(payment, entry, transaction) { const db = load(); const index = db.recurring_payments.findIndex((item) => item.id === payment.id); if (index < 0) db.recurring_payments.push(payment); else db.recurring_payments[index] = payment; if (transaction) db.finance_transactions.push(transaction); if (entry) db.activity_log.push(entry); save(db); },
    async saveSavingGoal(goal, entry) { const db = load(); const index = db.finance_saving_goals.findIndex((item) => item.id === goal.id); if (index < 0) db.finance_saving_goals.push(goal); else db.finance_saving_goals[index] = goal; db.activity_log.push(entry); save(db); },
  };
}
