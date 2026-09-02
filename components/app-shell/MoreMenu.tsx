'use client';

import Link from 'next/link';
import { calculateAvailableBalance } from '../../features/finance/domain';
import { useFinance } from '../../features/finance/use-finance';
import { useGoals } from '../../features/goals/use-goals';
import { useIdeas } from '../../features/ideas/use-ideas';
import { useProjects } from '../../features/projects/use-projects';
import { useTasks } from '../../features/tasks/use-tasks';
import { BottomSheet } from '../ui/BottomSheet';
import { MORE_LINKS } from './navigation';

const icons = ['✓', '$', '◎', '◈', '⌂', '⌘', '✦', '◷', '⚙'];
const descriptions = ['Pendientes y próximos pasos', 'Saldo, movimientos y pagos', 'Lo que quieres conseguir', 'Cosas que estás construyendo', 'Tu recorrido BIS', 'Pon tu espacio en orden', 'Capturas para después', 'Actividad de tu espacio', 'Preferencias y datos'];

export function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tasks } = useTasks(); const { accounts, transactions } = useFinance(); const { goals } = useGoals(); const { projects } = useProjects(); const { ideas } = useIdeas();
  const pending = tasks.filter((task) => task.status === 'pending').length; const activeGoals = goals.filter((goal) => goal.progress < goal.objective).length; const activeProjects = projects.filter((project) => project.status === 'active').length; const activeIdeas = ideas.filter((idea) => idea.status === 'active').length; const balance = calculateAvailableBalance(accounts, transactions); const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(balance);
  const details = [`${pending} pendiente${pending === 1 ? '' : 's'}`, accounts.length ? `${money} disponibles` : 'Aún sin cuentas', `${activeGoals} activa${activeGoals === 1 ? '' : 's'}`, `${activeProjects} activo${activeProjects === 1 ? '' : 's'}`, 'Módulos y materias', 'Estado de tu espacio', `${activeIdeas} reciente${activeIdeas === 1 ? '' : 's'}`, 'Línea de tiempo', 'Ajustes'];
  return <BottomSheet open={open} title="Explorar" onClose={onClose} className="app-sheet--explore"><p className="more-menu__intro">Todo lo que forma parte de tu espacio.</p><div className="more-menu__grid">{MORE_LINKS.map(([label, href], index) => <Link key={href} href={href} className="more-menu__card" onClick={onClose}><span className="more-menu__icon" aria-hidden="true">{icons[index]}</span><span className="more-menu__copy"><strong>{label}</strong><small>{descriptions[index]}</small><em>{details[index]}</em></span><span className="more-menu__arrow" aria-hidden="true">›</span></Link>)}</div></BottomSheet>;
}
