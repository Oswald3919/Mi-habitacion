export const TASK_CREATE_EVENT = 'mi-habitacion:task-create';
export const TASK_EDIT_EVENT = 'mi-habitacion:task-edit';
export const TASKS_CHANGED_EVENT = 'mi-habitacion:tasks-changed';
export const TASK_COMPLETED_EVENT = 'mi-habitacion:task-completed';

export function requestTaskCreation(): void {
  window.dispatchEvent(new CustomEvent(TASK_CREATE_EVENT));
}

export function requestTaskEdit(taskId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_EDIT_EVENT, { detail: { taskId } }));
}

export function requestTaskCreationForRoom(roomItemId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_CREATE_EVENT, { detail: { roomItemId } }));
}

export function requestTaskCreationForProject(projectId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_CREATE_EVENT, { detail: { projectId } }));
}

export function requestTaskCreationForGoal(goalId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_CREATE_EVENT, { detail: { goalId } }));
}

export function requestRoomCompletionConfirmation(taskId: string, roomItemId: string): void {
  window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT, { detail: { taskId, roomItemId } }));
}

export function notifyTasksChanged(): void {
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}
