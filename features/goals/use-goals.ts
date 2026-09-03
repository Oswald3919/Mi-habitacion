'use client';
import { useEffect, useState } from 'react';
import { createGoalRepository } from '../../lib/persistence/repositories';
import type { Goal } from './domain';
import { GOALS_CHANGED_EVENT } from './events';
export function useGoals() { const [repository] = useState(() => createGoalRepository()); const [goals, setGoals] = useState<Goal[]>([]); useEffect(() => { const load = () => { void repository.list().then(setGoals).catch(() => {}); }; queueMicrotask(load); window.addEventListener(GOALS_CHANGED_EVENT, load); return () => window.removeEventListener(GOALS_CHANGED_EVENT, load); }, [repository]); return { goals, repository }; }
