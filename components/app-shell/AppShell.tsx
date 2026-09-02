'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';
import { ContextualCreateSheet } from './ContextualCreateSheet';
import { MoreMenu } from './MoreMenu';
import { TaskComposer } from '../../features/tasks/TaskComposer';
import { TASK_CREATE_EVENT, TASK_EDIT_EVENT } from '../../features/tasks/events';
import type { Task } from '../../features/tasks/domain';
import { createLocalTaskRepository } from '../../lib/persistence/local-task-repository';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskComposerOpen, setTaskComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskRepository] = useState(() => createLocalTaskRepository());

  useEffect(() => {
    const openCreate = () => { setEditingTask(null); setTaskComposerOpen(true); };
    const openEdit = (event: Event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (!taskId) return;
      void taskRepository.list().then((tasks) => {
        const task = tasks.find((entry) => entry.id === taskId);
        if (task) { setEditingTask(task); setTaskComposerOpen(true); }
      }).catch(() => {});
    };
    window.addEventListener(TASK_CREATE_EVENT, openCreate);
    window.addEventListener(TASK_EDIT_EVENT, openEdit);
    return () => { window.removeEventListener(TASK_CREATE_EVENT, openCreate); window.removeEventListener(TASK_EDIT_EVENT, openEdit); };
  }, [taskRepository]);

  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      <BottomNav
        moreOpen={moreOpen}
        onMore={() => setMoreOpen((open) => !open)}
        onCreate={() => setCreateOpen(true)}
      />
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
      <ContextualCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskComposer open={taskComposerOpen} task={editingTask} onClose={() => { setTaskComposerOpen(false); setEditingTask(null); }} />
    </div>
  );
}
