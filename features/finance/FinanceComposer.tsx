'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { useProjects } from '../projects/use-projects';
import { FINANCE_TRANSACTION_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type FinanceTransaction, type FinanceTransactionType, type NewFinanceTransactionInput } from './domain';
import { notifyFinanceChanged } from './events';
import { preparePaymentCreate, prepareTransactionCreate, prepareTransactionUpdate } from './service';
import { useFinance } from './use-finance';

const createId = () => globalThis.crypto.randomUUID();
const today = () => new Date().toLocaleDateString('en-CA');
const emptyTransaction = (kind: FinanceTransactionType, projectId: string | null): NewFinanceTransactionInput => ({ amount: 0, type: kind, category: kind === 'income' ? 'Ingreso' : kind === 'saving' ? 'Ahorro' : 'General', account_id: '', date: today(), payment_method: 'card', note: null, project_id: projectId, subject_enrollment_id: null, saving_goal_id: null });

export function FinanceComposer({ open, kind, transaction, projectId, onClose }: { open: boolean; kind: FinanceTransactionType | 'payment'; transaction: FinanceTransaction | null; projectId: string | null; onClose: () => void }) {
  const { accounts, savingGoals, repository } = useFinance();
  const { projects } = useProjects();
  const [input, setInput] = useState<NewFinanceTransactionInput>(emptyTransaction('expense', null));
  const [payment, setPayment] = useState({ name: '', amount: 0, category: 'Pagos', account_id: '', payment_method: 'card' as const, next_due_date: today(), note: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (transaction) setInput({ amount: transaction.amount, type: transaction.type, category: transaction.category, account_id: transaction.account_id, date: transaction.date, payment_method: transaction.payment_method, note: transaction.note, project_id: transaction.project_id, subject_enrollment_id: transaction.subject_enrollment_id, saving_goal_id: transaction.saving_goal_id, recurring_payment_id: transaction.recurring_payment_id });
      else if (kind !== 'payment') setInput({ ...emptyTransaction(kind, projectId), account_id: accounts[0]?.id ?? '' });
      else setPayment({ name: '', amount: 0, category: 'Pagos', account_id: accounts[0]?.id ?? '', payment_method: 'card', next_due_date: today(), note: '' });
      setError('');
    });
  }, [open, kind, transaction, projectId, accounts]);

  const setField = <K extends keyof NewFinanceTransactionInput>(field: K, value: NewFinanceTransactionInput[K]) => setInput((current) => ({ ...current, [field]: value }));
  const save = async () => {
    try {
      const now = new Date().toISOString();
      if (kind === 'payment' && !transaction) {
        const value = preparePaymentCreate(LOCAL_PROFILE_ID, { ...payment, note: payment.note || null }, now, createId);
        await repository.savePayment(value, null);
      } else {
        const mutation = transaction ? prepareTransactionUpdate(LOCAL_PROFILE_ID, transaction, input, now, createId) : prepareTransactionCreate(LOCAL_PROFILE_ID, input, now, createId);
        await repository.saveTransaction(mutation.value, mutation.activity);
      }
      notifyFinanceChanged(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
  };

  if (kind === 'payment' && !transaction) return <BottomSheet open={open} title="Nuevo pago" onClose={onClose}><label className="task-form-label">Nombre</label><input className="task-title-input" value={payment.name} onChange={(event) => setPayment({ ...payment, name: event.target.value })} placeholder="Internet, renta…" /><div className="finance-form-grid"><label><span>Monto</span><input type="number" min="0" step="0.01" value={payment.amount || ''} onChange={(event) => setPayment({ ...payment, amount: Number(event.target.value) })} /></label><label><span>Próximo pago</span><input type="date" value={payment.next_due_date} onChange={(event) => setPayment({ ...payment, next_due_date: event.target.value })} /></label></div><label className="task-form-label">Cuenta</label><select className="task-select" value={payment.account_id} onChange={(event) => setPayment({ ...payment, account_id: event.target.value })}><option value="">Selecciona</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select><label className="task-form-label">Método</label><select className="task-select" value={payment.payment_method} onChange={(event) => setPayment({ ...payment, payment_method: event.target.value as typeof payment.payment_method })}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>)}</select>{error && <p className="task-form-error">{error}</p>}<button className="task-save-button" onClick={save}>Guardar pago</button></BottomSheet>;

  return <BottomSheet open={open} title={transaction ? 'Editar movimiento' : `Nuevo ${FINANCE_TRANSACTION_LABEL[input.type].toLowerCase()}`} onClose={onClose}><div className="finance-kind-selector">{(['expense', 'income', 'saving'] as FinanceTransactionType[]).map((type) => <button key={type} className={input.type === type ? 'active' : ''} onClick={() => setField('type', type)}>{FINANCE_TRANSACTION_LABEL[type]}</button>)}</div><label className="finance-amount"><span>$</span><input type="number" min="0" step="0.01" value={input.amount || ''} onChange={(event) => setField('amount', Number(event.target.value))} placeholder="0.00" /></label><div className="finance-form-grid"><label><span>Categoría</span><input value={input.category} onChange={(event) => setField('category', event.target.value)} /></label><label><span>Fecha</span><input type="date" value={input.date} onChange={(event) => setField('date', event.target.value)} /></label></div><label className="task-form-label">Cuenta</label><select className="task-select" value={input.account_id} onChange={(event) => setField('account_id', event.target.value)}><option value="">Selecciona</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select><label className="task-form-label">Método</label><select className="task-select" value={input.payment_method} onChange={(event) => setField('payment_method', event.target.value as NewFinanceTransactionInput['payment_method'])}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>)}</select><label className="task-form-label">Proyecto opcional</label><select className="task-select" value={input.project_id ?? ''} onChange={(event) => setField('project_id', event.target.value || null)}><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{input.type === 'saving' && <><label className="task-form-label">Meta de ahorro</label><select className="task-select" value={input.saving_goal_id ?? ''} onChange={(event) => setField('saving_goal_id', event.target.value || null)}><option value="">Ahorro general</option>{savingGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></>}<label className="task-form-label">Nota opcional</label><textarea className="task-textarea" rows={2} value={input.note ?? ''} onChange={(event) => setField('note', event.target.value || null)} />{accounts.length === 0 && <p className="task-form-error">Primero agrega una cuenta desde Finanzas.</p>}{error && <p className="task-form-error">{error}</p>}<button className="task-save-button" onClick={save}>Guardar movimiento</button></BottomSheet>;
}
