import type { ActivityLogEntry } from '../activity/domain';
import {
  applyRoomStatus,
  ROOM_CHILDREN,
  type RoomEntityId,
  type RoomSession,
  type RoomStatus,
  type RoomStatusHistoryEntry,
  type RoomZoneId,
} from './domain';
import type { RoomMutation } from './repository';

type IdFactory = () => string;

function createStatusHistory(
  profileId: string,
  changedAt: number,
  source: RoomStatusHistoryEntry['source'],
  changes: ReturnType<typeof applyRoomStatus>['changedEntities'],
  createId: IdFactory,
): RoomStatusHistoryEntry[] {
  return changes.map((change) => ({
    id: createId(),
    profile_id: profileId,
    entity_type: change.entityType,
    entity_id: change.entityId,
    previous_status: change.previousStatus,
    status: change.status,
    changed_at: changedAt,
    source,
  }));
}

export function prepareRoomStatusChange(
  profileId: string,
  session: RoomSession,
  entityId: RoomEntityId,
  status: RoomStatus,
  changedAt: number,
  createId: IdFactory,
): RoomMutation {
  const change = applyRoomStatus(
    session.state,
    session.updated,
    entityId,
    status,
    changedAt,
  );
  const hasRealChanges = change.changedEntities.length > 0;
  const activity: ActivityLogEntry[] = hasRealChanges
    ? [
        {
          id: createId(),
          profile_id: profileId,
          action: 'room.status_changed',
          entity_type: ROOM_CHILDREN[entityId as RoomZoneId]
            ? 'room_zone'
            : change.changedEntities[0].entityType === 'item'
              ? 'room_item'
              : 'room_zone',
          entity_id: entityId,
          occurred_at: changedAt,
          metadata: {
            status,
            previous_statuses: Object.fromEntries(
              change.changedEntities.map((entry) => [
                entry.entityId,
                entry.previousStatus,
              ]),
            ),
            affected_entities: change.changedEntities.map(
              (entry) => entry.entityId,
            ),
          },
        },
      ]
    : [];

  return {
    session: {
      ...session,
      state: change.state,
      updated: change.updated,
    },
    statusHistory: createStatusHistory(
      profileId,
      changedAt,
      'user',
      change.changedEntities,
      createId,
    ),
    activity,
  };
}

export function prepareRoomDayReset(
  profileId: string,
  session: RoomSession,
  changedAt: number,
  createId: IdFactory,
): RoomMutation {
  const change = applyRoomStatus(
    session.state,
    session.updated,
    'bed',
    'attention',
    changedAt,
  );
  const activity: ActivityLogEntry[] =
    change.changedEntities.length > 0
      ? [
          {
            id: createId(),
            profile_id: profileId,
            action: 'room.day_reset',
            entity_type: 'room_zone',
            entity_id: 'bed',
            occurred_at: changedAt,
            metadata: { status: 'attention' },
          },
        ]
      : [];

  return {
    session: {
      ...session,
      state: change.state,
      updated: change.updated,
    },
    statusHistory: createStatusHistory(
      profileId,
      changedAt,
      'user',
      change.changedEntities,
      createId,
    ),
    activity,
  };
}
