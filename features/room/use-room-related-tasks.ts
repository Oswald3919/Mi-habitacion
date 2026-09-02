'use client';

import { useEffect, useState } from 'react';
import { TASKS_CHANGED_EVENT } from '../tasks/events';
import { createLocalTaskRepository } from '../../lib/persistence/local-task-repository';
import type { Task } from '../tasks/domain';

export function useRoomRelatedTasks(roomItemId: string | null): Task[] {
  const [repository] = useState(() => createLocalTaskRepository());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = () => {
      if (!roomItemId) {
        queueMicrotask(() => setTasks([]));
        return;
      }
      queueMicrotask(() => {
        void repository.list().then((items) => {
          setTasks(items.filter((task) => task.room_item_id === roomItemId && task.status === 'pending'));
        }).catch(() => {});
      });
    };
    load();
    window.addEventListener(TASKS_CHANGED_EVENT, load);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, load);
  }, [repository, roomItemId]);

  return tasks;
}
