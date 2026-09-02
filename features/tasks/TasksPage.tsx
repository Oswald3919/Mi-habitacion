'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusChip } from '../../components/ui/StatusChip';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { requestTaskCreation, requestTaskEdit, notifyTasksChanged } from './events';
import { localToday, isToday, isUpcoming, TASK_PRIORITY_LABEL, type Task, type TaskStatus } from './domain';
import { useTasks } from './use-tasks';
import { prepareTaskStatusChange } from './service';

type TaskView = 'all' | 'today' | 'upcoming' | 'completed';

const viewLabels: Record<TaskView, string> = { all: 'Todas', today: 'Hoy', upcoming: 'Próximas', completed: 'Terminadas' };

function createId(): string { return globalThis.crypto.randomUUID(); }

function groupTasks(tasks: Task[], view: TaskView, today: string): Array<[string, Task[]]> {
  const filtered = tasks.filter((task) => {
    if (view === 'today') return isToday(task, today);
    if (view === 'upcoming') return isUpcoming(task, today);
    if (view === 'completed') return task.status === 'completed';
    return true;
  });
  if (view === 'completed') return filtered.length ? [['TERMINADAS', filtered]] : [];
  if (view === 'today') return filtered.length ? [['HOY', filtered]] : [];
  const todayTasks = filtered.filter((task) => task.status === 'pending' && isToday(task, today));
  const upcomingTasks = filtered.filter((task) => task.status === 'pending' && !isToday(task, today));
  const completedTasks = view === 'all' ? filtered.filter((task) => task.status === 'completed') : [];
  return [
    ...(todayTasks.length ? [['HOY', todayTasks] as [string, Task[]]] : []),
    ...(upcomingTasks.length ? [['PRÓXIMAMENTE', upcomingTasks] as [string, Task[]]] : []),
    ...(completedTasks.length ? [['TERMINADAS', completedTasks] as [string, Task[]]] : []),
  ];
}

export function TasksPage() {
  const { tasks, repository } = useTasks();
  const [view, setView] = useState<TaskView>('all');
  const today = localToday();
  const groups = useMemo(() => groupTasks(tasks, view, today), [tasks, view, today]);

  const changeStatus = async (task: Task, status: TaskStatus) => {
    const mutation = prepareTaskStatusChange(LOCAL_PROFILE_ID, task, status, new Date().toISOString(), createId);
    if (mutation.activity) {
      await repository.save(mutation.task, mutation.activity);
      notifyTasksChanged();
    }
  };

  return (
    <main className="foundation-page tasks-page">
      <PageHeader title="Tareas" intro="Lo que quieres poner en orden, un paso a la vez." />
      <div className="tasks-toolbar"><div className="task-tabs" role="tablist" aria-label="Vistas de tareas">{(Object.keys(viewLabels) as TaskView[]).map((tab) => <button key={tab} role="tab" aria-selected={view === tab} className={view === tab ? 'active' : ''} onClick={() => setView(tab)}>{viewLabels[tab]}</button>)}</div><button className="task-new-button" onClick={requestTaskCreation}>+ Nueva tarea</button></div>
      {groups.length === 0 ? <section className="foundation-card tasks-empty"><span aria-hidden="true">✦</span><h2>{view === 'all' ? 'Todavía no hay tareas' : `No hay tareas en ${viewLabels[view].toLowerCase()}`}</h2><p>Cuando tengas algo pendiente, guárdalo aquí para volver a encontrarlo.</p><button onClick={requestTaskCreation}>Crear una tarea</button></section> : <div className="task-groups">{groups.map(([label, grouped]) => <section key={label} className="task-group" aria-labelledby={`tasks-${label}`}><h2 id={`tasks-${label}`}>{label}</h2>{grouped.map((task) => <TaskCard key={task.id} task={task} today={today} onStatus={changeStatus} onEdit={() => requestTaskEdit(task.id)} />)}</section>)}</div>}
    </main>
  );
}

function TaskCard({ task, today, onStatus, onEdit }: { task: Task; today: string; onStatus: (task: Task, status: TaskStatus) => void; onEdit: () => void }) {
  const completed = task.status === 'completed';
  return <article className={`task-card ${completed ? 'completed' : ''}`}><button className="task-check" onClick={() => onStatus(task, completed ? 'pending' : 'completed')} aria-label={completed ? `Reabrir ${task.title}` : `Completar ${task.title}`} aria-pressed={completed}>{completed ? '✓' : ''}</button><div className="task-card__body"><h3>{task.title}</h3><div className="task-card__meta"><span className={`task-priority task-priority--${task.priority}`}>{TASK_PRIORITY_LABEL[task.priority]}</span><StatusChip status={completed ? 'ok' : task.priority === 'urgent' ? 'attention' : 'review'}>{completed ? 'Terminada' : task.area}</StatusChip>{task.due_date && <span className="task-date">{task.due_date === today ? 'Hoy' : new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(`${task.due_date}T12:00:00`))}{task.due_time ? ` · ${task.due_time}` : ''}</span>}</div>{task.notes && <p className="task-card__notes">{task.notes}</p>}{task.related_label && <p className="task-card__related">Relacionado con · {task.related_label}</p>}</div><button className="task-edit" onClick={onEdit} aria-label={`Editar ${task.title}`}>Editar</button></article>;
}
