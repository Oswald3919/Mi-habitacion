import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_STATE, type RoomSession } from '../features/room/domain';
import {
  prepareRoomDayReset,
  prepareRoomStatusChange,
} from '../features/room/service';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';

const session = (overrides: Partial<RoomSession> = {}): RoomSession => ({
  date: '2026-09-02',
  state: { ...DEFAULT_ROOM_STATE },
  updated: {},
  history: [],
  notifications: false,
  ...overrides,
});

const ids = () => {
  let value = 0;
  return () => `id-${++value}`;
};

describe('room service', () => {
  it('logs one significant activity and only changed editable children', () => {
    const current = session({
      state: {
        ...DEFAULT_ROOM_STATE,
        tvUnit: 'review',
        shoeShelf: 'ok',
      },
    });
    const mutation = prepareRoomStatusChange(
      LOCAL_PROFILE_ID,
      current,
      'tv',
      'attention',
      500,
      ids(),
    );

    expect(mutation.statusHistory).toHaveLength(2);
    expect(mutation.statusHistory.map((entry) => entry.entity_id)).toEqual([
      'tvUnit',
      'shoeShelf',
    ]);
    expect(
      mutation.statusHistory.some((entry) => entry.entity_id === 'tv'),
    ).toBe(false);
    expect(mutation.activity).toHaveLength(1);
    expect(mutation.activity[0]).toMatchObject({
      action: 'room.status_changed',
      entity_type: 'room_zone',
      entity_id: 'tv',
    });
  });

  it('does not log activity or status history when the status did not change', () => {
    const current = session({
      state: { ...DEFAULT_ROOM_STATE, bed: 'attention' },
    });
    const mutation = prepareRoomStatusChange(
      LOCAL_PROFILE_ID,
      current,
      'bed',
      'attention',
      700,
      ids(),
    );

    expect(mutation.statusHistory).toEqual([]);
    expect(mutation.activity).toEqual([]);
    expect(mutation.session.updated.bed).toBe(700);
  });

  it('logs an explicit day reset only when it changes the bed', () => {
    const changed = prepareRoomDayReset(
      LOCAL_PROFILE_ID,
      session({ state: { ...DEFAULT_ROOM_STATE, bed: 'ok' } }),
      800,
      ids(),
    );
    const unchanged = prepareRoomDayReset(
      LOCAL_PROFILE_ID,
      session({ state: { ...DEFAULT_ROOM_STATE, bed: 'attention' } }),
      900,
      ids(),
    );

    expect(changed.statusHistory).toHaveLength(1);
    expect(changed.activity[0]?.action).toBe('room.day_reset');
    expect(unchanged.statusHistory).toEqual([]);
    expect(unchanged.activity).toEqual([]);
  });

  it('can put an editable room item in order through the existing service', () => {
    const mutation = prepareRoomStatusChange(
      LOCAL_PROFILE_ID,
      session({ state: { ...DEFAULT_ROOM_STATE, cubbies: 'review' } }),
      'cubbies',
      'ok',
      1000,
      ids(),
    );

    expect(mutation.session.state.cubbies).toBe('ok');
    expect(mutation.statusHistory).toHaveLength(1);
    expect(mutation.statusHistory[0]).toMatchObject({ entity_type: 'item', entity_id: 'cubbies', status: 'ok' });
    expect(mutation.activity[0]).toMatchObject({ action: 'room.status_changed', entity_type: 'room_item', entity_id: 'cubbies' });
  });
});
