'use client';
import { useEffect, useState } from 'react';
import { createSettingsRepository } from '../../lib/persistence/repositories';
import { DEFAULT_APP_SETTINGS, type AppSettings } from './domain';
import { SETTINGS_CHANGED_EVENT } from './events';
export function useSettings() { const [repository] = useState(() => createSettingsRepository()); const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS); useEffect(() => { const load = () => { void repository.load().then(setSettings).catch(() => {}); }; queueMicrotask(load); window.addEventListener(SETTINGS_CHANGED_EVENT, load); return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, load); }, [repository]); return { settings, repository }; }
