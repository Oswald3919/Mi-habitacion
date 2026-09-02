import { describe, expect, it } from 'vitest';
import { prepareIdeaArchive, prepareIdeaConverted, prepareIdeaSave } from '../features/ideas/service';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from '../features/settings/domain';
import { prepareSettingsUpdate } from '../features/settings/service';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';
const ids = () => { let value = 0; return () => `id-${++value}`; };
const now = '2026-09-02T12:00:00.000Z';
describe('ideas and settings services', () => {
  it('keeps the original idea after conversion', () => {
    const created = prepareIdeaSave(LOCAL_PROFILE_ID, '  Crear una app  ', now, ids());
    const converted = prepareIdeaConverted(LOCAL_PROFILE_ID, created.idea, 'project', 'project-1', now, ids());
    expect(converted.idea).toMatchObject({ content: 'Crear una app', status: 'converted', converted_entity_type: 'project', converted_entity_id: 'project-1' });
    expect(converted.activity.action).toBe('idea.converted');
    expect(prepareIdeaArchive(LOCAL_PROFILE_ID, created.idea, now, ids()).activity.action).toBe('idea.archived');
  });

  it('normalizes settings while preserving all home modules', () => {
    const mutation = prepareSettingsUpdate(LOCAL_PROFILE_ID, { ...DEFAULT_APP_SETTINGS, profile_name: '  ', home_module_order: ['room', 'tasks'], finance_categories: [' General ', '', 'Escuela'], school: { ...DEFAULT_APP_SETTINGS.school, class_day: 6, price_2_weeks: -10 } }, now, ids());
    expect(mutation.settings.profile_name).toBe('Armando');
    expect(mutation.settings.home_module_order.slice(0, 2)).toEqual(['room', 'tasks']);
    expect(mutation.settings.home_module_order).toHaveLength(8);
    expect(mutation.settings.finance_categories).toEqual(['General', 'Escuela']);
    expect(mutation.settings.school.price_2_weeks).toBe(0);
    expect(mutation.activity.action).toBe('settings.updated');
  });

  it('defaults the new accent when loading an older settings payload', () => {
    const normalized = normalizeAppSettings({ ...DEFAULT_APP_SETTINGS, accent: undefined });
    expect(normalized.appearance).toBe('warm');
    expect(normalized.accent).toBe('green');
  });
});
