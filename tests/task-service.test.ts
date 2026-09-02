import { describe, expect, it } from 'vitest';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';
import { prepareTaskCreate, prepareTaskStatusChange, prepareTaskUpdate } from '../features/tasks/service';

const ids = () => { let value = 0; return () => `id-${++value}`; };

describe('task service', () => {
  it('creates a normalized task with future relation slots', () => {
    const mutation = prepareTaskCreate(LOCAL_PROFILE_ID, {
      title: '  Comprar carpetas  ', due_date: '', due_time: '', priority: 'urgent', area: 'Personal', notes: '  Para el sábado ', related_label: '  Prepa  ',
    }, '2026-09-02T12:00:00.000Z', ids());
    expect(mutation.task).toMatchObject({ title: 'Comprar carpetas', status: 'pending', due_date: null, due_time: null, priority: 'urgent', notes: 'Para el sábado', related_label: 'Prepa', project_id: null, goal_id: null, subject_enrollment_id: null, room_item_id: null });
    expect(mutation.activity).toMatchObject({ action: 'task.created', entity_type: 'task', entity_id: mutation.task.id });
  });

  it('creates semantic activity for completion, reopening and updates', () => {
    const created = prepareTaskCreate(LOCAL_PROFILE_ID, { title: 'Leer', due_date: null, due_time: null, priority: 'normal', area: 'Personal', notes: null, related_label: null }, '2026-09-02T12:00:00.000Z', ids());
    const completed = prepareTaskStatusChange(LOCAL_PROFILE_ID, created.task, 'completed', '2026-09-02T13:00:00.000Z', ids());
    const reopened = prepareTaskStatusChange(LOCAL_PROFILE_ID, completed.task, 'pending', '2026-09-02T14:00:00.000Z', ids());
    const updated = prepareTaskUpdate(LOCAL_PROFILE_ID, reopened.task, { title: 'Leer un capítulo' }, '2026-09-02T15:00:00.000Z', ids());
    expect(completed.activity?.action).toBe('task.completed');
    expect(reopened.activity?.action).toBe('task.reopened');
    expect(updated.activity?.action).toBe('task.updated');
    expect(updated.task.title).toBe('Leer un capítulo');
  });

  it('rejects empty titles and does not log a no-op status change', () => {
    expect(() => prepareTaskCreate(LOCAL_PROFILE_ID, { title: ' ', due_date: null, due_time: null, priority: 'normal', area: 'Personal', notes: null, related_label: null }, '2026-09-02T12:00:00.000Z', ids())).toThrow();
    const created = prepareTaskCreate(LOCAL_PROFILE_ID, { title: 'Leer', due_date: null, due_time: null, priority: 'normal', area: 'Personal', notes: null, related_label: null }, '2026-09-02T12:00:00.000Z', ids());
    const unchanged = prepareTaskStatusChange(LOCAL_PROFILE_ID, created.task, 'pending', '2026-09-02T13:00:00.000Z', ids());
    expect(unchanged.activity).toBeNull();
  });
});
