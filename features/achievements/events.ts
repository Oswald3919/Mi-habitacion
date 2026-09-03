export const ACHIEVEMENT_EVENT = 'mi-habitacion:achievement';

export type Achievement = {
  id: string;
  type: 'task' | 'goal' | 'project';
  name: string;
  href: '/tareas' | '/metas' | '/proyectos';
};

export function notifyAchievement(achievement: Achievement): void {
  window.dispatchEvent(new CustomEvent<Achievement>(ACHIEVEMENT_EVENT, { detail: achievement }));
}
