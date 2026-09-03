'use client';

import { useEffect, useState } from 'react';
import { TASKS_CHANGED_EVENT, type TaskChangedDetail } from './events';
import type { Task } from './domain';
import { createTaskRepository } from '../../lib/persistence/repositories';
import { changeTaskStatus } from './change-status';
import type { Goal } from '../goals/domain';
import type { TaskStatus } from './domain';

export function useTasks() {
  const [repository] = useState(() => createTaskRepository());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const load = () => {
      void repository.list().then(setTasks).catch(() => {});
    };
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<TaskChangedDetail>).detail;
      if (!detail?.task) { load(); return; }
      setTasks((current) => current.map((task) => task.id === detail.task.id ? detail.task : task));
      setPendingTaskIds((current) => {
        const next = new Set(current);
        if (detail.pending) next.add(detail.task.id); else next.delete(detail.task.id);
        return next;
      });
    };
    queueMicrotask(load);
    window.addEventListener(TASKS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, sync);
  }, [repository]);

  const setTaskStatus = (task: Task, status: TaskStatus, goals?: Goal[]) => changeTaskStatus(task, status, { repository, tasks, goals });
  return { tasks, repository, pendingTaskIds, setTaskStatus };
}
