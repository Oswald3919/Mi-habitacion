import type { ActivityLogEntry } from '../activity/domain';
import type { Goal, GoalInput } from './domain';
type IdFactory = () => string;
export function prepareGoalSave(profileId: string, input: GoalInput, now: string, createId: IdFactory, existing?: Goal): { goal: Goal; activity: ActivityLogEntry } {
  const name = input.name.trim();
  if (!name) throw new Error('El nombre de la meta es obligatorio');
  if (!(input.objective > 0) || input.progress < 0) throw new Error('Revisa el progreso y el objetivo');
  const goal: Goal = existing ? { ...existing, ...input, name, progress: Number(input.progress), objective: Number(input.objective), target_date: input.target_date || null, project_id: input.project_id || null, updated_at: now } : { ...input, id: createId(), profile_id: profileId, name, progress: Number(input.progress), objective: Number(input.objective), target_date: input.target_date || null, project_id: input.project_id || null, created_at: now, updated_at: now };
  const progressChanged = existing && existing.progress !== goal.progress;
  return { goal, activity: { id: createId(), profile_id: profileId, action: progressChanged ? 'goal.progress_updated' : existing ? 'goal.updated' : 'goal.created', entity_type: 'goal', entity_id: goal.id, occurred_at: Date.parse(now), metadata: { name: goal.name, progress: goal.progress, objective: goal.objective } } };
}
