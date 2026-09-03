'use client';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { TaskStatusButton } from '../../components/ui/TaskStatusButton';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { requestTaskCreationForGoal, notifyTasksChanged, requestTaskEdit } from '../tasks/events';
import { prepareTaskUpdate } from '../tasks/service';
import { useTasks } from '../tasks/use-tasks';
import { goalPercentage, goalProgress, GOAL_PRIORITY_LABEL, GOAL_TYPE_LABEL } from './domain';
import { requestGoalCreation, requestGoalEdit } from './events';
import { useGoals } from './use-goals';
import { useProjects } from '../projects/use-projects';

const createId = () => globalThis.crypto.randomUUID();
export function GoalsPage() {
  const { goals } = useGoals(); const { projects } = useProjects(); const { tasks, repository, pendingTaskIds, setTaskStatus } = useTasks(); const [selectedId, setSelectedId] = useState<string | null>(null); const [linking, setLinking] = useState(false);
  const selected = goals.find((item) => item.id === selectedId) ?? null;
  const related = selected ? tasks.filter((item) => item.goal_id === selected.id) : [];
  const linkTask = async (taskId: string) => { if (!selected) return; const task = tasks.find((item) => item.id === taskId); if (!task) return; const mutation = prepareTaskUpdate(LOCAL_PROFILE_ID, task, { goal_id: selected.id }, new Date().toISOString(), createId); await repository.save(mutation.task, mutation.activity); notifyTasksChanged(); };
  const toggleTask = (task: (typeof tasks)[number]) => { void setTaskStatus(task, task.status === 'completed' ? 'pending' : 'completed', goals).catch(() => {}); };
  if (selected) { const progress = goalProgress(selected, tasks); const project = projects.find((item) => item.id === selected.project_id); return <main className="foundation-page"><button className="back-link" onClick={() => setSelectedId(null)}>← Metas</button><header className="goal-hero"><span>{GOAL_TYPE_LABEL[selected.type]}</span><h1>{selected.name}</h1><p>{GOAL_PRIORITY_LABEL[selected.priority]}{project ? ` · ${project.name}` : ''}</p><button onClick={() => requestGoalEdit(selected.id)}>Editar meta</button></header><section className="goal-progress-card foundation-card"><div><strong>{progress.current}</strong><span>de {progress.objective}</span><b>{progress.percentage}%</b></div><div className="progress-track"><i style={{ width: `${progress.percentage}%` }}/></div>{progress.automatic && <small>Progreso automático según sus tareas</small>}{selected.target_date && <small>Fecha objetivo · {selected.target_date}</small>}</section><section className="module-section"><div className="module-section__heading"><h2>Próximos pasos</h2><span><button onClick={() => setLinking((value) => !value)}>Vincular</button><button onClick={() => requestTaskCreationForGoal(selected.id)}>+ Tarea</button></span></div>{linking && <div className="link-picker">{tasks.filter((item) => !item.goal_id).map((task) => <button key={task.id} onClick={() => linkTask(task.id)}>+ {task.title}</button>)}</div>}{related.length ? related.map((task) => <article className={`simple-row task-simple-row${task.status === 'completed' ? ' completed' : ''}`} key={task.id}><TaskStatusButton task={task} pending={pendingTaskIds.has(task.id)} onToggle={() => toggleTask(task)}/><button className="task-row-content" onClick={() => requestTaskEdit(task.id)}><span><b>{task.title}</b><small>{task.status === 'completed' ? 'Terminada' : 'Pendiente'}</small></span><i>›</i></button></article>) : <Empty text="Añade tareas reales como próximos pasos."/>}</section></main>; }
  return <main className="foundation-page"><PageHeader title="Metas" intro="Avances visibles hacia lo que más te importa."/><div className="module-toolbar"><span>{goals.length} {goals.length === 1 ? 'meta' : 'metas'}</span><button onClick={requestGoalCreation}>+ Nueva meta</button></div>{goals.length ? <div className="goal-cards">{goals.map((goal) => { const percent = goalPercentage(goal, tasks); return <button className="goal-card foundation-card" key={goal.id} onClick={() => setSelectedId(goal.id)}><div><span>{GOAL_TYPE_LABEL[goal.type]}</span><b>{goal.name}</b><small>{GOAL_PRIORITY_LABEL[goal.priority]}</small></div><strong>{percent}%</strong><div className="progress-track"><i style={{ width: `${percent}%` }}/></div></button>; })}</div> : <Empty text="Crea una meta y acompáñala con tareas reales."/>}</main>;
}
function Empty({ text }: { text: string }) { return <div className="module-empty"><span>○</span><p>{text}</p></div>; }
