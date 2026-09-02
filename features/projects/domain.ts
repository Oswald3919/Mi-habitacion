export type ProjectStatus = 'idea' | 'planning' | 'active' | 'paused' | 'completed';
export type ProjectPriority = 'none' | 'important' | 'main';

export type Project = {
  id: string;
  profile_id: string;
  name: string;
  status: ProjectStatus;
  type: string;
  priority: ProjectPriority;
  objective: string;
  target_date: string | null;
  icon: string;
  color: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<Project, 'id' | 'profile_id' | 'created_at' | 'updated_at'>;
export const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'planning', 'active', 'paused', 'completed'];
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = { idea: 'Idea', planning: 'Planeando', active: 'Activo', paused: 'Pausado', completed: 'Terminado' };
export const PROJECT_PRIORITY_LABEL: Record<ProjectPriority, string> = { none: 'Sin prisa', important: 'Importante', main: 'Principal' };

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Project>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && PROJECT_STATUSES.includes(item.status as ProjectStatus) && typeof item.type === 'string' && typeof item.objective === 'string' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}
