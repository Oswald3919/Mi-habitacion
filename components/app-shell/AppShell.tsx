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
import { FinanceComposer } from '../../features/finance/FinanceComposer';
import { FINANCE_CREATE_EVENT, FINANCE_EDIT_EVENT } from '../../features/finance/events';
import type { FinanceTransaction, FinanceTransactionType } from '../../features/finance/domain';
import { createLocalFinanceRepository } from '../../lib/persistence/local-finance-repository';
import { ProjectComposer } from '../../features/projects/ProjectComposer';
import { PROJECT_CREATE_EVENT, PROJECT_EDIT_EVENT } from '../../features/projects/events';
import type { Project } from '../../features/projects/domain';
import { createLocalProjectRepository } from '../../lib/persistence/local-project-repository';
import { GoalComposer } from '../../features/goals/GoalComposer';
import { GOAL_CREATE_EVENT, GOAL_EDIT_EVENT } from '../../features/goals/events';
import type { Goal } from '../../features/goals/domain';
import { createLocalGoalRepository } from '../../lib/persistence/local-goal-repository';
import { SchoolComposer } from '../../features/school/SchoolComposer';
import { SCHOOL_CREATE_EVENT } from '../../features/school/events';
import { IdeaComposer } from '../../features/ideas/IdeaComposer';
import { IDEA_CREATE_EVENT, IDEA_EDIT_EVENT } from '../../features/ideas/events';
import type { Idea } from '../../features/ideas/domain';
import { createLocalIdeaRepository } from '../../lib/persistence/local-idea-repository';
import { useSettings } from '../../features/settings/use-settings';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskComposerOpen, setTaskComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [roomItemId, setRoomItemId] = useState<string | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [taskGoalId, setTaskGoalId] = useState<string | null>(null);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [financeKind, setFinanceKind] = useState<FinanceTransactionType | 'payment'>('expense');
  const [financeProjectId, setFinanceProjectId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolMode, setSchoolMode] = useState<'enrollment' | 'grade'>('enrollment');
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [completionPrompt, setCompletionPrompt] = useState<{ taskId: string; roomItemId: RoomItemId } | null>(null);
  const [taskRepository] = useState(() => createLocalTaskRepository());
  const { settings } = useSettings();

  useEffect(() => { document.documentElement.dataset.appearance = settings.appearance; }, [settings.appearance]);

  useEffect(() => {
    const openCreate = (event: Event) => { const detail = (event as CustomEvent<{ roomItemId?: string; projectId?: string; goalId?: string }>).detail; setEditingTask(null); setRoomItemId(detail?.roomItemId ?? null); setTaskProjectId(detail?.projectId ?? null); setTaskGoalId(detail?.goalId ?? null); setTaskComposerOpen(true); };
    const openEdit = (event: Event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (!taskId) return;
      void taskRepository.list().then((tasks) => {
        const task = tasks.find((entry) => entry.id === taskId);
        if (task) { setEditingTask(task); setRoomItemId(null); setTaskProjectId(null); setTaskGoalId(null); setTaskComposerOpen(true); }
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

  useEffect(() => {
    const financeRepository = createLocalFinanceRepository(); const projectRepository = createLocalProjectRepository(); const goalRepository = createLocalGoalRepository();
    const createFinance = (event: Event) => { const detail = (event as CustomEvent<{ kind?: FinanceTransactionType | 'payment'; projectId?: string | null }>).detail; setFinanceKind(detail?.kind ?? 'expense'); setFinanceProjectId(detail?.projectId ?? null); setEditingTransaction(null); setFinanceOpen(true); };
    const editFinance = (event: Event) => { const id = (event as CustomEvent<{ transactionId?: string }>).detail?.transactionId; if (id) void financeRepository.load().then((data) => { const item = data.transactions.find((entry) => entry.id === id); if (item) { setEditingTransaction(item); setFinanceKind(item.type); setFinanceProjectId(null); setFinanceOpen(true); } }); };
    const createProject = () => { setEditingProject(null); setProjectOpen(true); };
    const editProject = (event: Event) => { const id = (event as CustomEvent<{ projectId?: string }>).detail?.projectId; if (id) void projectRepository.list().then((items) => { const item = items.find((entry) => entry.id === id); if (item) { setEditingProject(item); setProjectOpen(true); } }); };
    const createGoal = () => { setEditingGoal(null); setGoalOpen(true); };
    const editGoal = (event: Event) => { const id = (event as CustomEvent<{ goalId?: string }>).detail?.goalId; if (id) void goalRepository.list().then((items) => { const item = items.find((entry) => entry.id === id); if (item) { setEditingGoal(item); setGoalOpen(true); } }); };
    window.addEventListener(FINANCE_CREATE_EVENT, createFinance); window.addEventListener(FINANCE_EDIT_EVENT, editFinance); window.addEventListener(PROJECT_CREATE_EVENT, createProject); window.addEventListener(PROJECT_EDIT_EVENT, editProject); window.addEventListener(GOAL_CREATE_EVENT, createGoal); window.addEventListener(GOAL_EDIT_EVENT, editGoal);
    return () => { window.removeEventListener(FINANCE_CREATE_EVENT, createFinance); window.removeEventListener(FINANCE_EDIT_EVENT, editFinance); window.removeEventListener(PROJECT_CREATE_EVENT, createProject); window.removeEventListener(PROJECT_EDIT_EVENT, editProject); window.removeEventListener(GOAL_CREATE_EVENT, createGoal); window.removeEventListener(GOAL_EDIT_EVENT, editGoal); };
  }, []);

  useEffect(() => {
    const ideaRepository = createLocalIdeaRepository();
    const openSchool = (event: Event) => { const mode = (event as CustomEvent<{ mode?: 'enrollment' | 'grade' }>).detail?.mode ?? 'enrollment'; setSchoolMode(mode); setSchoolOpen(true); };
    const createIdea = () => { setEditingIdea(null); setIdeaOpen(true); };
    const editIdea = (event: Event) => { const id = (event as CustomEvent<{ ideaId?: string }>).detail?.ideaId; if (id) void ideaRepository.list().then((items) => { const item = items.find((entry) => entry.id === id); if (item) { setEditingIdea(item); setIdeaOpen(true); } }); };
    window.addEventListener(SCHOOL_CREATE_EVENT, openSchool); window.addEventListener(IDEA_CREATE_EVENT, createIdea); window.addEventListener(IDEA_EDIT_EVENT, editIdea);
    return () => { window.removeEventListener(SCHOOL_CREATE_EVENT, openSchool); window.removeEventListener(IDEA_CREATE_EVENT, createIdea); window.removeEventListener(IDEA_EDIT_EVENT, editIdea); };
  }, []);

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
      <TaskComposer open={taskComposerOpen} task={editingTask} roomItemId={roomItemId} projectId={taskProjectId} goalId={taskGoalId} onClose={() => { setTaskComposerOpen(false); setEditingTask(null); setRoomItemId(null); setTaskProjectId(null); setTaskGoalId(null); }} />
      <FinanceComposer open={financeOpen} kind={financeKind} transaction={editingTransaction} projectId={financeProjectId} onClose={() => { setFinanceOpen(false); setEditingTransaction(null); setFinanceProjectId(null); }} />
      <ProjectComposer open={projectOpen} project={editingProject} onClose={() => { setProjectOpen(false); setEditingProject(null); }} />
      <GoalComposer open={goalOpen} goal={editingGoal} onClose={() => { setGoalOpen(false); setEditingGoal(null); }} />
      <SchoolComposer open={schoolOpen} mode={schoolMode} onClose={() => setSchoolOpen(false)} />
      <IdeaComposer open={ideaOpen} idea={editingIdea} onClose={() => { setIdeaOpen(false); setEditingIdea(null); }} />
      <BottomSheet open={Boolean(completionPrompt)} title="Tarea completada" onClose={() => setCompletionPrompt(null)}>
        {completionPrompt && <><p className="contextual-note">¿También quieres poner {ROOM_ITEM_LABELS[completionPrompt.roomItemId]} en En orden?</p><button className="task-save-button" onClick={confirmRoomOrder}>Sí, poner en En orden</button><button className="task-details-toggle" onClick={() => setCompletionPrompt(null)}>Ahora no</button></>}
      </BottomSheet>
    </div>
  );
}
