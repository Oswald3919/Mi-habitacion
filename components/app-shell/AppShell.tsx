'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';
import { ContextualCreateSheet } from './ContextualCreateSheet';
import { MoreMenu } from './MoreMenu';
import { BottomSheet } from '../ui/BottomSheet';
import { TaskComposer } from '../../features/tasks/TaskComposer';
import { TASK_COMPLETED_EVENT, TASK_CREATE_EVENT, TASK_EDIT_EVENT } from '../../features/tasks/events';
import type { Task } from '../../features/tasks/domain';
import { createLocalTaskRepository } from '../../lib/persistence/local-task-repository';
import { createLocalRoomRepository } from '../../lib/persistence/local-repositories';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import { prepareRoomStatusChange } from '../../features/room/service';
import { ROOM_ITEM_LABELS, isRoomItemId, type RoomItemId } from '../../features/room/domain';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskComposerOpen, setTaskComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [roomItemId, setRoomItemId] = useState<string | null>(null);
  const [completionPrompt, setCompletionPrompt] = useState<{ taskId: string; roomItemId: RoomItemId } | null>(null);
  const [taskRepository] = useState(() => createLocalTaskRepository());

  useEffect(() => {
    const openCreate = (event: Event) => { const detail = (event as CustomEvent<{ roomItemId?: string }>).detail; setEditingTask(null); setRoomItemId(detail?.roomItemId ?? null); setTaskComposerOpen(true); };
    const openEdit = (event: Event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (!taskId) return;
      void taskRepository.list().then((tasks) => {
        const task = tasks.find((entry) => entry.id === taskId);
        if (task) { setEditingTask(task); setRoomItemId(null); setTaskComposerOpen(true); }
      }).catch(() => {});
    };
    const promptCompletion = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId?: string; roomItemId?: string }>).detail;
      if (detail?.taskId && isRoomItemId(detail.roomItemId)) setCompletionPrompt({ taskId: detail.taskId, roomItemId: detail.roomItemId });
    };
    window.addEventListener(TASK_CREATE_EVENT, openCreate);
    window.addEventListener(TASK_EDIT_EVENT, openEdit);
    window.addEventListener(TASK_COMPLETED_EVENT, promptCompletion);
    return () => { window.removeEventListener(TASK_CREATE_EVENT, openCreate); window.removeEventListener(TASK_EDIT_EVENT, openEdit); window.removeEventListener(TASK_COMPLETED_EVENT, promptCompletion); };
  }, [taskRepository]);

  const confirmRoomOrder = async () => {
    if (!completionPrompt) return;
    const repository = createLocalRoomRepository();
    const session = await repository.loadSession();
    const mutation = prepareRoomStatusChange(LOCAL_PROFILE_ID, session, completionPrompt.roomItemId, 'ok', Date.now(), () => globalThis.crypto.randomUUID());
    await repository.commit(mutation);
    setCompletionPrompt(null);
  };

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
      <TaskComposer open={taskComposerOpen} task={editingTask} roomItemId={roomItemId} onClose={() => { setTaskComposerOpen(false); setEditingTask(null); setRoomItemId(null); }} />
      <BottomSheet open={Boolean(completionPrompt)} title="Tarea completada" onClose={() => setCompletionPrompt(null)}>
        {completionPrompt && <><p className="contextual-note">¿También quieres poner {ROOM_ITEM_LABELS[completionPrompt.roomItemId]} en En orden?</p><button className="task-save-button" onClick={confirmRoomOrder}>Sí, poner en En orden</button><button className="task-details-toggle" onClick={() => setCompletionPrompt(null)}>Ahora no</button></>}
      </BottomSheet>
    </div>
  );
}
