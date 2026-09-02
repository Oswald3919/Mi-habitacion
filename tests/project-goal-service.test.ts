import { describe, expect, it } from 'vitest';
import { prepareProjectSave, prepareProjectStatusChange } from '../features/projects/service';
import { prepareGoalSave } from '../features/goals/service';
import { goalPercentage } from '../features/goals/domain';
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
});
