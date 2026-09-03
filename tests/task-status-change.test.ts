import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeTaskStatus, __testables } from '../features/tasks/change-status';
import { TASKS_CHANGED_EVENT } from '../features/tasks/events';
import type { Task } from '../features/tasks/domain';

const task: Task = { id: 'task-1', profile_id: 'user-1', title: 'Conectar Supabase', status: 'pending', due_date: null, due_time: null, priority: 'normal', area: 'Proyecto', notes: null, related_label: null, project_id: 'project-1', goal_id: null, subject_enrollment_id: null, room_item_id: null, created_at: '2026-09-03T10:00:00.000Z', updated_at: '2026-09-03T10:00:00.000Z' };

describe('central task status change', () => {
  let browserWindow: EventTarget;
  beforeEach(() => { browserWindow = new EventTarget(); Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow }); });
  afterEach(() => { __testables.inFlight.clear(); vi.restoreAllMocks(); Reflect.deleteProperty(globalThis, 'window'); });

  it('publishes an optimistic value and rolls it back when persistence fails', async () => {
    const states: Array<{ status: string; pending: boolean }> = [];
    browserWindow.addEventListener(TASKS_CHANGED_EVENT, (event) => { const detail = (event as CustomEvent<{ task: Task; pending: boolean }>).detail; states.push({ status: detail.task.status, pending: detail.pending }); });
    const repository = { list: vi.fn(), save: vi.fn().mockRejectedValue(new Error('offline')) };
    await expect(changeTaskStatus(task, 'completed', { repository, tasks: [task], now: () => '2026-09-03T11:00:00.000Z', createId: () => 'activity-1' })).rejects.toThrow('offline');
    expect(states).toEqual([{ status: 'completed', pending: true }, { status: 'pending', pending: false }]);
  });

  it('deduplicates repeated clicks while one request is in flight', async () => {
    let release = () => {};
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const repository = { list: vi.fn(), save: vi.fn(() => wait) };
    const first = changeTaskStatus(task, 'completed', { repository, tasks: [task], createId: () => 'activity-1' });
    const second = changeTaskStatus(task, 'completed', { repository, tasks: [task], createId: () => 'activity-2' });
    expect(repository.save).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
