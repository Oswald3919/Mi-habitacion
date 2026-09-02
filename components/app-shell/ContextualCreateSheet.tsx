'use client';

import { usePathname } from 'next/navigation';
import { BottomSheet } from '../ui/BottomSheet';
import { getCreateOptions } from './navigation';
import { requestTaskCreation } from '../../features/tasks/events';
import { requestFinanceCreation } from '../../features/finance/events';
import { requestProjectCreation } from '../../features/projects/events';
import { requestGoalCreation } from '../../features/goals/events';

const enabled = new Set(['Tarea', 'Movimiento financiero', 'Gasto', 'Ingreso', 'Ahorro', 'Pago', 'Meta', 'Proyecto']);

function runCreate(option: string): void {
  if (option === 'Tarea') requestTaskCreation();
  else if (option === 'Movimiento financiero' || option === 'Gasto') requestFinanceCreation('expense');
  else if (option === 'Ingreso') requestFinanceCreation('income');
  else if (option === 'Ahorro') requestFinanceCreation('saving');
  else if (option === 'Pago') requestFinanceCreation('payment');
  else if (option === 'Meta') requestGoalCreation();
  else if (option === 'Proyecto') requestProjectCreation();
}

export function ContextualCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const options = getCreateOptions(pathname);

  return (
    <BottomSheet open={open} title="Crear algo nuevo" onClose={onClose}>
      <p className="contextual-note">Elige qué quieres guardar en este espacio.</p>
      {options.map((option) => (
        <button key={option} className="sheet-option" disabled={!enabled.has(option)} onClick={enabled.has(option) ? () => { onClose(); runCreate(option); } : undefined}>
          <span className="sheet-option__icon" aria-hidden="true">+</span>
          <span className="sheet-option__text"><b>{option}</b><small>{enabled.has(option) ? 'Abrir flujo de creación' : 'Disponible próximamente'}</small></span>
        </button>
      ))}
    </BottomSheet>
  );
}
