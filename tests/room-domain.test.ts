import { describe, expect, it } from 'vitest';
import {
  applyRoomStatus,
  createRoomDayRecord,
  DEFAULT_ROOM_STATE,
  deriveOverallRoomStatus,
  deriveRoomCounts,
  deriveRoomView,
  getLastRoomUpdate,
} from '../features/room/domain';

describe('room domain', () => {
  it('derives parent and overall statuses from editable descendants', () => {
    const state = {
      ...DEFAULT_ROOM_STATE,
      bed: 'ok' as const,
      desk: 'ok' as const,
      tvUnit: 'ok' as const,
      shoeShelf: 'review' as const,
      dresser: 'ok' as const,
      hanging: 'ok' as const,
      laundry: 'attention' as const,
      cubbies: 'ok' as const,
    };

    expect(deriveRoomView(state)).toMatchObject({
      tv: 'review',
      closet: 'attention',
    });
    expect(deriveOverallRoomStatus(state)).toBe('attention');
    expect(deriveRoomCounts(state)).toEqual({
      ok: 2,
      review: 1,
      attention: 1,
    });
  });

  it('updates a composite zone but reports only real item changes', () => {
    const state = {
      ...DEFAULT_ROOM_STATE,
      tvUnit: 'attention' as const,
      shoeShelf: 'ok' as const,
    };
    const result = applyRoomStatus(state, {}, 'tv', 'attention', 1234);

    expect(result.state.tvUnit).toBe('attention');
    expect(result.state.shoeShelf).toBe('attention');
    expect(result.updated).toMatchObject({
      tv: 1234,
      tvUnit: 1234,
      shoeShelf: 1234,
    });
    expect(result.changedEntities).toEqual([
      {
        entityType: 'item',
        entityId: 'shoeShelf',
        previousStatus: 'ok',
        status: 'attention',
      },
    ]);
  });

  it('uses child timestamps for the last update of a derived parent', () => {
    expect(
      getLastRoomUpdate('closet', {
        closet: 100,
        dresser: 200,
        cubbies: 400,
      }),
    ).toBe(400);
  });

  it('creates a daily snapshot entirely from derived values', () => {
    const record = createRoomDayRecord(
      {
        ...DEFAULT_ROOM_STATE,
        bed: 'ok',
        desk: 'ok',
        tvUnit: 'ok',
        shoeShelf: 'review',
      },
      '2026-09-01',
    );

    expect(record).toEqual({
      date: '2026-09-01',
      status: 'review',
      zones: {
        bed: 'ok',
        desk: 'ok',
        tv: 'review',
        closet: 'ok',
      },
    });
  });
});
