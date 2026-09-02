'use client';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { useProjects } from '../projects/use-projects';
import { GOAL_PRIORITY_LABEL, GOAL_TYPE_LABEL, type Goal, type GoalInput, type GoalPriority, type GoalType } from './domain';
import { notifyGoalsChanged } from './events';
import { prepareGoalSave } from './service';
import { useGoals } from './use-goals';

const createId = () => globalThis.crypto.randomUUID();
const blank: GoalInput = { name: '', type: 'manual', priority: 'important', progress: 0, objective: 100, target_date: null, project_id: null };
export function GoalComposer({ open, goal, onClose }: { open: boolean; goal: Goal | null; onClose: () => void }) {
  const { repository } = useGoals(); const { projects } = useProjects(); const [input, setInput] = useState<GoalInput>(blank); const [error, setError] = useState('');
  useEffect(() => { if (open) queueMicrotask(() => { setInput(goal ? { name: goal.name, type: goal.type, priority: goal.priority, progress: goal.progress, objective: goal.objective, target_date: goal.target_date, project_id: goal.project_id } : blank); setError(''); }); }, [open, goal]);
  const field = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const save = async () => { try { const mutation = prepareGoalSave(LOCAL_PROFILE_ID, input, new Date().toISOString(), createId, goal ?? undefined); await repository.save(mutation.goal, mutation.activity); notifyGoalsChanged(); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); } };
  return <BottomSheet open={open} title={goal ? 'Editar meta' : 'Nueva meta'} onClose={onClose}><label className="task-form-label">¿Qué quieres conseguir?</label><input className="task-title-input" value={input.name} onChange={(event) => field('name', event.target.value)} placeholder="Nombre de la meta"/><fieldset className="task-form-fieldset"><legend>Tipo</legend><div className="task-priority-line">{(['money','quantity','manual'] as GoalType[]).map((type) => <button key={type} className={input.type === type ? 'active' : ''} onClick={() => field('type', type)}>{GOAL_TYPE_LABEL[type]}</button>)}</div></fieldset><fieldset className="task-form-fieldset"><legend>Prioridad</legend><div className="task-priority-line">{(['none','important','main'] as GoalPriority[]).map((priority) => <button key={priority} className={input.priority === priority ? 'active' : ''} onClick={() => field('priority', priority)}>{GOAL_PRIORITY_LABEL[priority]}</button>)}</div></fieldset><div className="finance-form-grid"><label><span>Progreso</span><input type="number" min="0" value={input.progress} onChange={(event) => field('progress', Number(event.target.value))}/></label><label><span>Objetivo</span><input type="number" min="1" value={input.objective} onChange={(event) => field('objective', Number(event.target.value))}/></label></div><label className="task-form-label">Fecha objetivo opcional</label><input className="task-input" type="date" value={input.target_date ?? ''} onChange={(event) => field('target_date', event.target.value || null)}/><label className="task-form-label">Proyecto opcional</label><select className="task-select" value={input.project_id ?? ''} onChange={(event) => field('project_id', event.target.value || null)}><option value="">Sin proyecto</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>{error && <p className="task-form-error">{error}</p>}<button className="task-save-button" onClick={save}>Guardar meta</button></BottomSheet>;
}
