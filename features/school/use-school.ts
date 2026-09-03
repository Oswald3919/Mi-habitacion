'use client';
import { useEffect, useState } from 'react';
import { createSchoolRepository } from '../../lib/persistence/repositories';
import type { SchoolSnapshot } from './repository';
import { SCHOOL_CHANGED_EVENT } from './events';
import { SCHOOL_DEFAULT_SETTINGS } from './domain';
const empty: SchoolSnapshot = { modules: [], subjects: [], enrollments: [], settings: SCHOOL_DEFAULT_SETTINGS, activity: [] };
export function useSchool() { const [repository] = useState(() => createSchoolRepository()); const [school, setSchool] = useState<SchoolSnapshot>(empty); useEffect(() => { const load = () => { void repository.load().then(setSchool).catch(() => {}); }; queueMicrotask(load); window.addEventListener(SCHOOL_CHANGED_EVENT, load); return () => window.removeEventListener(SCHOOL_CHANGED_EVENT, load); }, [repository]); return { ...school, repository }; }
