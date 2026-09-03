import type { Task } from '../../features/tasks/domain';

export function TaskStatusButton({ task, pending = false, onToggle }: { task: Task; pending?: boolean; onToggle: () => void }) {
  const completed = task.status === 'completed';
  return <button type="button" className={`task-check${completed ? ' completed' : ''}`} onClick={onToggle} disabled={pending} aria-label={completed ? `Reabrir ${task.title}` : `Completar ${task.title}`} aria-pressed={completed}>{completed ? '✓' : ''}</button>;
}
