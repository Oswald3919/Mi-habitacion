export type GoalType = 'money' | 'quantity' | 'manual';
export type GoalPriority = 'none' | 'important' | 'main';

export type Goal = {
  id: string;
  profile_id: string;
  name: string;
  type: GoalType;
  priority: GoalPriority;
  progress: number;
  objective: number;
  target_date: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalInput = Omit<Goal, 'id' | 'profile_id' | 'created_at' | 'updated_at'>;
export const GOAL_TYPE_LABEL: Record<GoalType, string> = { money: 'Dinero', quantity: 'Cantidad', manual: 'Manual' };
export const GOAL_PRIORITY_LABEL: Record<GoalPriority, string> = { none: 'Sin prisa', important: 'Importante', main: 'Principal' };

export function goalPercentage(goal: Goal): number {
  if (goal.objective <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((goal.progress / goal.objective) * 100)));
}

export function isGoal(value: unknown): value is Goal {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Goal>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && (item.type === 'money' || item.type === 'quantity' || item.type === 'manual') && typeof item.progress === 'number' && typeof item.objective === 'number' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}
