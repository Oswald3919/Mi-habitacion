'use client';

import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { createLocalTaskRepository } from '../../lib/persistence/local-task-repository';
import { addDays, TASK_AREAS, TASK_PRIORITY_LABEL, type NewTaskInput, type Task, type TaskPriority } from './domain';
import { ROOM_ITEM_LABELS, isRoomItemId } from '../room/domain';
import { notifyTasksChanged } from './events';
import { prepareTaskCreate, prepareTaskUpdate } from './service';
import { useProjects } from '../projects/use-projects';
import { useGoals } from '../goals/use-goals';

function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

function createId(): string {
  return globalThis.crypto.randomUUID();
}

const blankInput = (roomItemId: string | null = null, projectId: string | null = null, goalId: string | null = null): NewTaskInput => ({
  title: '', due_date: today(), due_time: null, priority: 'normal', area: roomItemId ? 'Habitación' : projectId ? 'Proyecto' : 'Personal', notes: null, related_label: roomItemId && isRoomItemId(roomItemId) ? ROOM_ITEM_LABELS[roomItemId] : null, room_item_id: roomItemId, project_id: projectId, goal_id: goalId, subject_enrollment_id: null,
});

export function TaskComposer({
  open,
  task,
  roomItemId = null,
  projectId = null,
  goalId = null,
  onClose,
}: {
  open: boolean;
  task: Task | null;
  roomItemId?: string | null;
  projectId?: string | null;
  goalId?: string | null;
  onClose: () => void;
}) {
  const [input, setInput] = useState<NewTaskInput>(blankInput);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [otherDate, setOtherDate] = useState('');
  const [error, setError] = useState('');
  const [repository] = useState(() => createLocalTaskRepository());
  const { projects } = useProjects();
  const { goals } = useGoals();
  const dateOptions = useMemo(() => [today(), addDays(today(), 1), addDays(today(), 2), addDays(today(), 3)], []);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (task) {
        setInput({ title: task.title, due_date: task.due_date, due_time: task.due_time, priority: task.priority, area: task.area, notes: task.notes, related_label: task.related_label, project_id: task.project_id, goal_id: task.goal_id, subject_enrollment_id: task.subject_enrollment_id, room_item_id: task.room_item_id });
        setOtherDate(task.due_date && !dateOptions.includes(task.due_date) ? task.due_date : '');
        setDetailsOpen(Boolean(task.due_time || task.notes || task.related_label || task.project_id || task.goal_id));
      } else {
        setInput(blankInput(roomItemId, projectId, goalId));
        setOtherDate('');
        setDetailsOpen(false);
      }
      setError('');
    });
  }, [open, task, roomItemId, projectId, goalId, dateOptions]);

  const setField = <K extends keyof NewTaskInput>(field: K, value: NewTaskInput[K]) => {
    setInput((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    try {
      const now = new Date().toISOString();
      const mutation = task
        ? prepareTaskUpdate(LOCAL_PROFILE_ID, task, input, now, createId)
        : prepareTaskCreate(LOCAL_PROFILE_ID, input, now, createId);
      await repository.save(mutation.task, mutation.activity);
      notifyTasksChanged();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la tarea.');
    }
  };

  const selectedDate = input.due_date;
  return (
    <BottomSheet open={open} title={task ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose}>
      <label className="task-form-label" htmlFor="task-title">¿Qué necesitas hacer?</label>
      <input id="task-title" className="task-title-input" value={input.title} onChange={(event) => setField('title', event.target.value)} placeholder="Escribe una tarea" autoFocus={open} />

      <fieldset className="task-form-fieldset">
        <legend>¿Cuándo?</legend>
        <div className="task-date-line" role="radiogroup" aria-label="Fecha de la tarea">
          {dateOptions.map((date, index) => (
            <button key={date} type="button" className={selectedDate === date ? 'active' : ''} onClick={() => setField('due_date', date)} role="radio" aria-checked={selectedDate === date}>
              <strong>{index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))}</strong>
              <span>{index > 1 ? new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(`${date}T12:00:00`)) : ''}</span>
            </button>
          ))}
          <button type="button" className={selectedDate && !dateOptions.includes(selectedDate) ? 'active' : ''} onClick={() => setField('due_date', otherDate || null)} role="radio" aria-checked={Boolean(selectedDate && !dateOptions.includes(selectedDate))}>Otra fecha</button>
        </div>
        {selectedDate && !dateOptions.includes(selectedDate) || otherDate ? <input className="task-date-input" type="date" value={otherDate || selectedDate || ''} onChange={(event) => { setOtherDate(event.target.value); setField('due_date', event.target.value || null); }} /> : null}
      </fieldset>

      <fieldset className="task-form-fieldset">
        <legend>Prioridad</legend>
        <div className="task-priority-line" role="radiogroup" aria-label="Prioridad">
          {(['none', 'normal', 'urgent'] as TaskPriority[]).map((priority) => <button key={priority} type="button" className={input.priority === priority ? 'active' : ''} onClick={() => setField('priority', priority)} role="radio" aria-checked={input.priority === priority}>{TASK_PRIORITY_LABEL[priority]}</button>)}
        </div>
      </fieldset>

      <label className="task-form-label" htmlFor="task-area">Área</label>
      <select id="task-area" className="task-select" value={input.area} onChange={(event) => setField('area', event.target.value)}>{TASK_AREAS.map((area) => <option key={area}>{area}</option>)}</select>

      <button type="button" className="task-details-toggle" onClick={() => setDetailsOpen((openDetails) => !openDetails)} aria-expanded={detailsOpen}>Agregar detalles <span>{detailsOpen ? '−' : '+'}</span></button>
      {detailsOpen && <div className="task-details"><label className="task-form-label" htmlFor="task-time">Hora opcional</label><input id="task-time" className="task-input" type="time" value={input.due_time ?? ''} onChange={(event) => setField('due_time', event.target.value || null)} /><label className="task-form-label" htmlFor="task-notes">Notas</label><textarea id="task-notes" className="task-textarea" value={input.notes ?? ''} onChange={(event) => setField('notes', event.target.value || null)} placeholder="Algo que quieras recordar" rows={3} /><label className="task-form-label" htmlFor="task-project">Proyecto</label><select id="task-project" className="task-select" value={input.project_id ?? ''} onChange={(event) => setField('project_id', event.target.value || null)}><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><label className="task-form-label" htmlFor="task-goal">Meta</label><select id="task-goal" className="task-select" value={input.goal_id ?? ''} onChange={(event) => setField('goal_id', event.target.value || null)}><option value="">Sin meta</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select><label className="task-form-label" htmlFor="task-related">Relacionado con</label><input id="task-related" className="task-input" value={input.related_label ?? ''} onChange={(event) => setField('related_label', event.target.value || null)} placeholder="Referencia opcional" /></div>}
      {error && <p className="task-form-error" role="alert">{error}</p>}
      <button type="button" className="task-save-button" onClick={save}>{task ? 'Guardar cambios' : 'Guardar tarea'}</button>
    </BottomSheet>
  );
}
