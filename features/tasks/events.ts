export const TASK_CREATE_EVENT = 'mi-habitacion:task-create';
export const TASK_EDIT_EVENT = 'mi-habitacion:task-edit';
export const TASKS_CHANGED_EVENT = 'mi-habitacion:tasks-changed';

export function requestTaskCreation(): void {
  window.dispatchEvent(new CustomEvent(TASK_CREATE_EVENT));
}

export function requestTaskEdit(taskId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_EDIT_EVENT, { detail: { taskId } }));
}

export function notifyTasksChanged(): void {
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}
