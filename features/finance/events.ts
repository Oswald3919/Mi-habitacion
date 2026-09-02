import type { FinanceTransactionType } from './domain';

export const FINANCE_CHANGED_EVENT = 'mi-habitacion:finance-changed';
export const FINANCE_CREATE_EVENT = 'mi-habitacion:finance-create';
export const FINANCE_EDIT_EVENT = 'mi-habitacion:finance-edit';

export function notifyFinanceChanged(): void { window.dispatchEvent(new Event(FINANCE_CHANGED_EVENT)); }
export function requestFinanceCreation(kind: FinanceTransactionType | 'payment' = 'expense', projectId: string | null = null): void { window.dispatchEvent(new CustomEvent(FINANCE_CREATE_EVENT, { detail: { kind, projectId } })); }
export function requestFinanceEdit(transactionId: string): void { window.dispatchEvent(new CustomEvent(FINANCE_EDIT_EVENT, { detail: { transactionId } })); }
