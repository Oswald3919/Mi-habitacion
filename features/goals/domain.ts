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

import type { Task } from '../tasks/domain';

export type GoalProgress = { current: number; objective: number; percentage: number; automatic: boolean };

export function goalProgress(goal: Goal, tasks: Task[] = []): GoalProgress {
  const related = tasks.filter((task) => task.goal_id === goal.id);
  const automatic = related.length > 0;
  const current = automatic ? related.filter((task) => task.status === 'completed').length : goal.progress;
  const objective = automatic ? related.length : goal.objective;
  const percentage = objective <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((current / objective) * 100)));
  return { current, objective, percentage, automatic };
}

export function goalPercentage(goal: Goal, tasks: Task[] = []): number {
  if (tasks.some((task) => task.goal_id === goal.id)) return goalProgress(goal, tasks).percentage;
  if (goal.objective <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((goal.progress / goal.objective) * 100)));
}

export function isGoal(value: unknown): value is Goal {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Goal>;
  return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.name === 'string' && (item.type === 'money' || item.type === 'quantity' || item.type === 'manual') && typeof item.progress === 'number' && typeof item.objective === 'number' && typeof item.created_at === 'string' && typeof item.updated_at === 'string';
}
