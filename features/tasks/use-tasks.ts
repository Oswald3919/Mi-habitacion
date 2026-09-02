'use client';

import { useEffect, useState } from 'react';
import { TASKS_CHANGED_EVENT } from './events';
import type { Task } from './domain';
import { createLocalTaskRepository } from '../../lib/persistence/local-task-repository';

export function useTasks() {
  const [repository] = useState(() => createLocalTaskRepository());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = () => {
      void repository.list().then(setTasks).catch(() => {});
    };
    queueMicrotask(load);
    window.addEventListener(TASKS_CHANGED_EVENT, load);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, load);
  }, [repository]);

  return { tasks, repository };
}
