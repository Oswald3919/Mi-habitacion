'use client';

import { useEffect, useState } from 'react';
import { createLocalFinanceRepository } from '../../lib/persistence/local-finance-repository';
import type { FinanceSnapshot } from './repository';
import { FINANCE_CHANGED_EVENT } from './events';

const empty: FinanceSnapshot = { accounts: [], transactions: [], payments: [], savingGoals: [] };
export function useFinance() {
  const [repository] = useState(() => createLocalFinanceRepository());
  const [finance, setFinance] = useState<FinanceSnapshot>(empty);
  useEffect(() => { const load = () => { void repository.load().then(setFinance).catch(() => {}); }; queueMicrotask(load); window.addEventListener(FINANCE_CHANGED_EVENT, load); return () => window.removeEventListener(FINANCE_CHANGED_EVENT, load); }, [repository]);
  return { ...finance, repository };
}
