'use client';
import { useEffect, useState } from 'react';
import { createIdeaRepository } from '../../lib/persistence/repositories';
import type { Idea } from './domain';
import { IDEAS_CHANGED_EVENT } from './events';
export function useIdeas() { const [repository] = useState(() => createIdeaRepository()); const [ideas, setIdeas] = useState<Idea[]>([]); useEffect(() => { const load = () => { void repository.list().then(setIdeas).catch(() => {}); }; queueMicrotask(load); window.addEventListener(IDEAS_CHANGED_EVENT, load); return () => window.removeEventListener(IDEAS_CHANGED_EVENT, load); }, [repository]); return { ideas, repository }; }
