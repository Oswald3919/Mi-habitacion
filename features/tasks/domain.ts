import type { ActivityLogEntry } from '../activity/domain';

export const TASK_STATUSES = ['pending', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = 'none' | 'normal' | 'urgent';
export type TaskArea = string;

export const TASK_AREAS = ['Personal', 'Prepa', 'Proyecto', 'Habitación'] as const;
export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  none: 'Sin prisa',
  normal: 'Normal',
  urgent: 'Urgente',
};

export type Task = {
  id: string;
  profile_id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  due_time: string | null;
  priority: TaskPriority;
  area: TaskArea;
  notes: string | null;
  related_label: string | null;
  project_id: string | null;
  goal_id: string | null;
  subject_enrollment_id: string | null;
  room_item_id: string | null;
  created_at: string;
  updated_at: string;
};

export type NewTaskInput = Pick<
  Task,
  | 'title'
  | 'due_date'
  | 'due_time'
  | 'priority'
  | 'area'
  | 'notes'
  | 'related_label'
> & { room_item_id?: string | null };

export type TaskUpdateInput = Partial<NewTaskInput>;

export type TaskActivityMutation = {
  task: Task;
  activity: ActivityLogEntry;
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'none' || value === 'normal' || value === 'urgent';
}

export function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const task = value as Partial<Task>;
  return (
    typeof task.id === 'string' &&
    typeof task.profile_id === 'string' &&
    typeof task.title === 'string' &&
    task.title.trim().length > 0 &&
    isTaskStatus(task.status) &&
    (task.due_date === null || typeof task.due_date === 'string') &&
    (task.due_time === null || typeof task.due_time === 'string') &&
    isTaskPriority(task.priority) &&
    typeof task.area === 'string' &&
    (task.notes === null || typeof task.notes === 'string') &&
    (task.related_label === null || typeof task.related_label === 'string') &&
    typeof task.created_at === 'string' &&
    typeof task.updated_at === 'string'
  );
}

export function isToday(task: Task, date: string): boolean {
  return task.due_date === date;
}

export function isUpcoming(task: Task, date: string): boolean {
  return task.status === 'pending' && (task.due_date === null || task.due_date > date);
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDate = a.due_date ?? '9999-12-31';
    const bDate = b.due_date ?? '9999-12-31';
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    const aTime = a.due_time ?? '99:99';
    const bTime = b.due_time ?? '99:99';
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return b.created_at.localeCompare(a.created_at);
  });
}

export function taskDateLabel(date: string | null, today: string): string {
  if (!date) return 'Sin fecha';
  if (date === today) return 'Hoy';
  const tomorrow = addDays(today, 1);
  if (date === tomorrow) return 'Mañana';
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '');
}

export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toLocaleDateString('en-CA');
}

export function localToday(): string {
  return new Date().toLocaleDateString('en-CA');
}
