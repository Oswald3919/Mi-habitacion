'use client';

import { usePathname } from 'next/navigation';
import { BottomSheet } from '../ui/BottomSheet';
import { getCreateOptions } from './navigation';
import { requestTaskCreation } from '../../features/tasks/events';

export function ContextualCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const options = getCreateOptions(pathname);

  return (
    <BottomSheet open={open} title="Crear algo nuevo" onClose={onClose}>
      <p className="contextual-note">Elige qué quieres guardar en este espacio.</p>
      {options.map((option) => (
        <button key={option} className="sheet-option" disabled={option !== 'Tarea'} onClick={option === 'Tarea' ? () => { onClose(); requestTaskCreation(); } : undefined}>
          <span className="sheet-option__icon" aria-hidden="true">+</span>
          <span className="sheet-option__text"><b>{option}</b><small>{option === 'Tarea' ? 'Abrir nueva tarea' : 'Disponible próximamente'}</small></span>
        </button>
      ))}
    </BottomSheet>
  );
}
