'use client';
import { useEffect, useState } from 'react';
import { createProjectRepository } from '../../lib/persistence/repositories';
import type { Project } from './domain';
import { PROJECTS_CHANGED_EVENT } from './events';
export function useProjects() { const [repository] = useState(() => createProjectRepository()); const [projects, setProjects] = useState<Project[]>([]); useEffect(() => { const load = () => { void repository.list().then(setProjects).catch(() => {}); }; queueMicrotask(load); window.addEventListener(PROJECTS_CHANGED_EVENT, load); return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, load); }, [repository]); return { projects, repository }; }
