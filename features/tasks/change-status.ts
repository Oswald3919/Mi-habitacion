import type { Goal } from '../goals/domain';
import { goalPercentage } from '../goals/domain';
import { notifyAchievement } from '../achievements/events';
import type { Task, TaskStatus } from './domain';
import type { TaskRepository } from './repository';
import { prepareTaskStatusChange } from './service';
import { notifyTasksChanged, requestRoomCompletionConfirmation } from './events';

type ChangeTaskStatusOptions = {
  repository: TaskRepository;
  tasks: Task[];
  goals?: Goal[];
  now?: () => string;
  createId?: () => string;
};

const inFlight = new Map<string, Promise<boolean>>();

export function changeTaskStatus(
  task: Task,
  status: TaskStatus,
  { repository, tasks, goals = [], now = () => new Date().toISOString(), createId = () => globalThis.crypto.randomUUID() }: ChangeTaskStatusOptions,
): Promise<boolean> {
  const current = inFlight.get(task.id);
  if (current) return current;
  const mutation = prepareTaskStatusChange(task.profile_id, task, status, now(), createId);
  if (!mutation.activity) return Promise.resolve(false);
  const activity = mutation.activity;

  const operation = (async () => {
    const linkedGoal = task.goal_id ? goals.find((goal) => goal.id === task.goal_id) : undefined;
    const before = linkedGoal ? goalPercentage(linkedGoal, tasks) : 0;
    const optimisticTasks = tasks.map((item) => item.id === task.id ? mutation.task : item);
    notifyTasksChanged({ task: mutation.task, pending: true });
    try {
      await repository.save(mutation.task, activity);
      notifyTasksChanged({ task: mutation.task, pending: false });
      if (status === 'completed') {
        notifyAchievement({ id: activity.id, type: 'task', name: mutation.task.title, href: '/tareas' });
        if (linkedGoal && before < 100 && goalPercentage(linkedGoal, optimisticTasks) === 100) {
          notifyAchievement({ id: `${activity.id}:goal`, type: 'goal', name: linkedGoal.name, href: '/metas' });
        }
        if (task.room_item_id) requestRoomCompletionConfirmation(task.id, task.room_item_id);
      }
      return true;
    } catch (error) {
      notifyTasksChanged({ task, pending: false });
      throw error;
    } finally {
      inFlight.delete(task.id);
    }
  })();
  inFlight.set(task.id, operation);
  return operation;
}

export const __testables = { inFlight };
