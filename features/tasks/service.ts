import type { ActivityLogEntry } from '../activity/domain';
import type { NewTaskInput, Task, TaskStatus, TaskUpdateInput } from './domain';

export type TaskMutation = {
  task: Task;
  activity: ActivityLogEntry | null;
};

type IdFactory = () => string;

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function taskActivity(
  id: string,
  profileId: string,
  action: ActivityLogEntry['action'],
  task: Task,
  occurredAt: string,
  metadata: Record<string, unknown>,
): ActivityLogEntry {
  return {
    id,
    profile_id: profileId,
    action,
    entity_type: 'task',
    entity_id: task.id,
    occurred_at: Date.parse(occurredAt),
    metadata,
  };
}

export function prepareTaskCreate(
  profileId: string,
  input: NewTaskInput,
  now: string,
  createId: IdFactory,
): TaskMutation {
  const title = input.title.trim();
  if (!title) throw new Error('El título de la tarea es obligatorio');
  const task: Task = {
    id: createId(),
    profile_id: profileId,
    title,
    status: 'pending',
    due_date: input.due_date || null,
    due_time: input.due_time || null,
    priority: input.priority,
    area: input.area.trim() || 'Personal',
    notes: normalizeOptional(input.notes),
    related_label: normalizeOptional(input.related_label),
    project_id: input.project_id ?? null,
    goal_id: input.goal_id ?? null,
    subject_enrollment_id: input.subject_enrollment_id ?? null,
    room_item_id: input.room_item_id ?? null,
    created_at: now,
    updated_at: now,
  };
  return {
    task,
    activity: taskActivity(createId(), profileId, 'task.created', task, now, {
      title: task.title,
      area: task.area,
      priority: task.priority,
    }),
  };
}

export function prepareTaskUpdate(
  profileId: string,
  task: Task,
  changes: TaskUpdateInput,
  now: string,
  createId: IdFactory,
): TaskMutation {
  const nextTitle = changes.title === undefined ? task.title : changes.title.trim();
  if (!nextTitle) throw new Error('El título de la tarea es obligatorio');
  const nextTask: Task = {
    ...task,
    ...changes,
    title: nextTitle,
    due_date: changes.due_date === undefined ? task.due_date : changes.due_date || null,
    due_time: changes.due_time === undefined ? task.due_time : changes.due_time || null,
    area: changes.area === undefined ? task.area : changes.area.trim() || 'Personal',
    notes: changes.notes === undefined ? task.notes : normalizeOptional(changes.notes),
    related_label:
      changes.related_label === undefined
        ? task.related_label
        : normalizeOptional(changes.related_label),
    updated_at: now,
  };
  return {
    task: nextTask,
    activity: taskActivity(createId(), profileId, 'task.updated', nextTask, now, {
      changed_fields: Object.keys(changes),
    }),
  };
}

export function prepareTaskStatusChange(
  profileId: string,
  task: Task,
  status: TaskStatus,
  now: string,
  createId: IdFactory,
): TaskMutation {
  if (task.status === status) return { task, activity: null };
  const nextTask = { ...task, status, updated_at: now };
  return {
    task: nextTask,
    activity: taskActivity(
      createId(),
      profileId,
      status === 'completed' ? 'task.completed' : 'task.reopened',
      nextTask,
      now,
      { previous_status: task.status, status },
    ),
  };
}
