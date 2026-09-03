import { describe, expect, it } from 'vitest';
import { prepareProjectSave, prepareProjectStatusChange } from '../features/projects/service';
import { prepareGoalSave } from '../features/goals/service';
import { goalPercentage, goalProgress } from '../features/goals/domain';
import type { Task } from '../features/tasks/domain';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';

const ids = () => { let value = 0; return () => `id-${++value}`; };
const now = '2026-09-02T12:00:00.000Z';

describe('projects and goals services', () => {
  it('creates and changes project status with activity', () => {
    const created = prepareProjectSave(LOCAL_PROFILE_ID, { name: '  Portafolio ', status: 'planning', type: 'Personal', priority: 'main', objective: 'Publicar', target_date: null, icon: '✦', color: 'sage', notes: null }, now, ids());
    expect(created.project.name).toBe('Portafolio');
    expect(created.activity.action).toBe('project.created');
    const changed = prepareProjectStatusChange(LOCAL_PROFILE_ID, created.project, 'active', now, ids());
    expect(changed.project.status).toBe('active');
    expect(changed.activity?.action).toBe('project.status_changed');
  });

  it('updates goal progress and calculates its derived percentage', () => {
    const created = prepareGoalSave(LOCAL_PROFILE_ID, { name: 'Leer', type: 'quantity', priority: 'important', progress: 2, objective: 10, target_date: null, project_id: 'project-1' }, now, ids());
    const updated = prepareGoalSave(LOCAL_PROFILE_ID, { ...created.goal, progress: 5 }, now, ids(), created.goal);
    expect(updated.activity.action).toBe('goal.progress_updated');
    expect(goalPercentage(updated.goal)).toBe(50);
    expect(updated.goal.project_id).toBe('project-1');
  });

  it('derives goal progress from linked tasks and ignores manual values', () => {
    const goal = prepareGoalSave(LOCAL_PROFILE_ID, { name: 'Conectar', type: 'manual', priority: 'main', progress: 99, objective: 100, target_date: null, project_id: null }, now, ids()).goal;
    const base = { profile_id: LOCAL_PROFILE_ID, due_date: null, due_time: null, priority: 'normal' as const, area: 'Proyecto', notes: null, related_label: null, project_id: 'project-1', goal_id: goal.id, subject_enrollment_id: null, room_item_id: null, created_at: now, updated_at: now };
    const tasks: Task[] = [
      { ...base, id: 'task-1', title: 'Primera', status: 'completed' },
      { ...base, id: 'task-2', title: 'Segunda', status: 'pending' },
    ];
    expect(goalProgress(goal, tasks)).toEqual({ current: 1, objective: 2, percentage: 50, automatic: true });
    expect(goalPercentage(goal, tasks.map((task) => ({ ...task, status: 'completed' })))).toBe(100);
    expect(goalPercentage(goal, [])).toBe(99);
  });
});
