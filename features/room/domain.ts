export const ROOM_STATUSES = ['ok', 'review', 'attention'] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];
export type RoomZoneId = 'bed' | 'desk' | 'tv' | 'closet';
export type RoomItemId =
  | 'tvUnit'
  | 'shoeShelf'
  | 'dresser'
  | 'hanging'
  | 'laundry'
  | 'cubbies';
export type RoomEntityId = RoomZoneId | RoomItemId;
export type RoomFilter = 'all' | 'attention' | 'ok';
export type RoomState = Record<RoomEntityId, RoomStatus>;
export type RoomUpdated = Partial<Record<RoomEntityId, number>>;

export type RoomDayRecord = {
  date: string;
  status: RoomStatus;
  zones: Record<RoomZoneId, RoomStatus>;
};

export type RoomSession = {
  date: string;
  state: RoomState;
  updated: RoomUpdated;
  history: RoomDayRecord[];
  notifications: boolean;
};

export type RoomStatusHistoryEntry = {
  id: string;
  profile_id: string;
  entity_type: 'zone' | 'item';
  entity_id: RoomZoneId | RoomItemId;
  previous_status: RoomStatus;
  status: RoomStatus;
  changed_at: number;
  source: 'user' | 'day_rollover';
};

export type RoomStatusChange = {
  state: RoomState;
  updated: RoomUpdated;
  changedEntities: Array<{
    entityType: 'zone' | 'item';
    entityId: RoomZoneId | RoomItemId;
    previousStatus: RoomStatus;
    status: RoomStatus;
  }>;
};

export const ROOM_ZONE_IDS: RoomZoneId[] = ['bed', 'desk', 'tv', 'closet'];
export const ROOM_ITEM_IDS: RoomItemId[] = [
  'tvUnit',
  'shoeShelf',
  'dresser',
  'hanging',
  'laundry',
  'cubbies',
];

export const ROOM_ITEM_LABELS: Record<RoomItemId, string> = {
  tvUnit: 'Mueble de TV',
  shoeShelf: 'Estantería / mueble de zapatos',
  dresser: 'Cómoda',
  hanging: 'Ropa colgada',
  laundry: 'Ropa sucia',
  cubbies: 'Cubículos',
};

export const ROOM_CHILDREN: Partial<Record<RoomZoneId, RoomItemId[]>> = {
  tv: ['tvUnit', 'shoeShelf'],
  closet: ['dresser', 'hanging', 'laundry', 'cubbies'],
};

export const DEFAULT_ROOM_STATE: RoomState = {
  bed: 'attention',
  desk: 'review',
  tv: 'ok',
  closet: 'ok',
  tvUnit: 'ok',
  shoeShelf: 'ok',
  dresser: 'ok',
  hanging: 'ok',
  laundry: 'ok',
  cubbies: 'ok',
};

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  ok: 'En orden',
  review: 'Revisar',
  attention: 'Requiere atención',
};

const ROOM_STATUS_RANK: Record<RoomStatus, number> = {
  ok: 0,
  review: 1,
  attention: 2,
};

export function isRoomStatus(value: unknown): value is RoomStatus {
  return typeof value === 'string' && ROOM_STATUSES.includes(value as RoomStatus);
}

export function isRoomItemId(value: RoomEntityId | string | undefined): value is RoomItemId {
  return typeof value === 'string' && ROOM_ITEM_IDS.includes(value as RoomItemId);
}

export function worstRoomStatus(statuses: RoomStatus[]): RoomStatus {
  return statuses.reduce(
    (worst, status) =>
      ROOM_STATUS_RANK[status] > ROOM_STATUS_RANK[worst] ? status : worst,
    'ok',
  );
}

export function deriveRoomView(state: RoomState): RoomState {
  return {
    ...state,
    tv: worstRoomStatus([state.tvUnit, state.shoeShelf]),
    closet: worstRoomStatus([
      state.dresser,
      state.hanging,
      state.laundry,
      state.cubbies,
    ]),
  };
}

export function deriveRoomCounts(state: RoomState): Record<RoomStatus, number> {
  const view = deriveRoomView(state);
  return ROOM_ZONE_IDS.reduce<Record<RoomStatus, number>>(
    (counts, zoneId) => ({
      ...counts,
      [view[zoneId]]: counts[view[zoneId]] + 1,
    }),
    { ok: 0, review: 0, attention: 0 },
  );
}

export function deriveOverallRoomStatus(state: RoomState): RoomStatus {
  const view = deriveRoomView(state);
  return worstRoomStatus(ROOM_ZONE_IDS.map((zoneId) => view[zoneId]));
}

export function createRoomDayRecord(
  state: RoomState,
  date: string,
): RoomDayRecord {
  const view = deriveRoomView(state);
  const zones = Object.fromEntries(
    ROOM_ZONE_IDS.map((zoneId) => [zoneId, view[zoneId]]),
  ) as Record<RoomZoneId, RoomStatus>;

  return {
    date,
    status: worstRoomStatus(Object.values(zones)),
    zones,
  };
}

export function getLastRoomUpdate(
  entityId: RoomEntityId,
  updated: RoomUpdated,
): number | undefined {
  const children = ROOM_CHILDREN[entityId as RoomZoneId];
  const latestChildUpdate = children?.reduce(
    (latest, childId) => Math.max(latest, updated[childId] ?? 0),
    0,
  );

  return latestChildUpdate || updated[entityId];
}

export function formatRoomUpdate(value?: number): string {
  return value
    ? new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(value)
    : 'Sin cambios registrados';
}

export function applyRoomStatus(
  state: RoomState,
  updated: RoomUpdated,
  entityId: RoomEntityId,
  status: RoomStatus,
  changedAt: number,
): RoomStatusChange {
  const children = ROOM_CHILDREN[entityId as RoomZoneId];
  const editableEntityIds: RoomEntityId[] = children ?? [entityId];
  const nextState = { ...state };
  const nextUpdated = { ...updated };
  const changedEntities: RoomStatusChange['changedEntities'] = [];

  for (const editableEntityId of editableEntityIds) {
    const previousStatus = state[editableEntityId];
    nextState[editableEntityId] = status;
    nextUpdated[editableEntityId] = changedAt;

    if (previousStatus !== status) {
      changedEntities.push({
        entityType: ROOM_ITEM_IDS.includes(editableEntityId as RoomItemId)
          ? 'item'
          : 'zone',
        entityId: editableEntityId as RoomZoneId | RoomItemId,
        previousStatus,
        status,
      });
    }
  }

  if (children) nextUpdated[entityId] = changedAt;

  return { state: nextState, updated: nextUpdated, changedEntities };
}

export function todayInLocalTimezone(): string {
  return new Date().toLocaleDateString('en-CA');
}
