export const GOALS_CHANGED_EVENT = 'mi-habitacion:goals-changed';
export const GOAL_CREATE_EVENT = 'mi-habitacion:goal-create';
export const GOAL_EDIT_EVENT = 'mi-habitacion:goal-edit';
export const notifyGoalsChanged = () => window.dispatchEvent(new Event(GOALS_CHANGED_EVENT));
export const requestGoalCreation = () => window.dispatchEvent(new Event(GOAL_CREATE_EVENT));
export const requestGoalEdit = (goalId: string) => window.dispatchEvent(new CustomEvent(GOAL_EDIT_EVENT, { detail: { goalId } }));
