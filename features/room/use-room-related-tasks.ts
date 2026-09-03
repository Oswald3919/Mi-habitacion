'use client';

import { useMemo } from 'react';
import { useTasks } from '../tasks/use-tasks';

export function useRoomRelatedTasks(roomItemId: string | null) {
  const taskState = useTasks();
  const tasks = useMemo(() => roomItemId ? taskState.tasks.filter((task) => task.room_item_id === roomItemId) : [], [roomItemId, taskState.tasks]);
  return { ...taskState, tasks };
}
