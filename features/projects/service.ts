import type { ActivityLogEntry } from '../activity/domain';
import type { Project, ProjectInput, ProjectStatus } from './domain';

type IdFactory = () => string;
export function prepareProjectSave(profileId: string, input: ProjectInput, now: string, createId: IdFactory, existing?: Project): { project: Project; activity: ActivityLogEntry } {
  const name = input.name.trim();
  if (!name) throw new Error('El nombre del proyecto es obligatorio');
  const project: Project = existing ? { ...existing, ...input, name, type: input.type.trim() || 'Personal', objective: input.objective.trim(), notes: input.notes?.trim() || null, target_date: input.target_date || null, updated_at: now } : { ...input, id: createId(), profile_id: profileId, name, type: input.type.trim() || 'Personal', objective: input.objective.trim(), notes: input.notes?.trim() || null, target_date: input.target_date || null, created_at: now, updated_at: now };
  const action = existing && existing.status !== project.status ? 'project.status_changed' : existing ? 'project.updated' : 'project.created';
  return { project, activity: { id: createId(), profile_id: profileId, action, entity_type: 'project', entity_id: project.id, occurred_at: Date.parse(now), metadata: { name: project.name, status: project.status, previous_status: existing?.status } } };
}

export function prepareProjectStatusChange(profileId: string, project: Project, status: ProjectStatus, now: string, createId: IdFactory): { project: Project; activity: ActivityLogEntry | null } {
  if (project.status === status) return { project, activity: null };
  const updated = { ...project, status, updated_at: now };
  return { project: updated, activity: { id: createId(), profile_id: profileId, action: 'project.status_changed', entity_type: 'project', entity_id: project.id, occurred_at: Date.parse(now), metadata: { previous_status: project.status, status } } };
}
