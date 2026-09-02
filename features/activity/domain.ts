export type ActivityEntityType = 'room_zone' | 'room_item' | 'task';
export type ActivityAction =
  | 'room.status_changed'
  | 'room.day_reset'
  | 'task.created'
  | 'task.completed'
  | 'task.reopened'
  | 'task.updated'
  | 'task.deleted';

export type ActivityLogEntry = {
  id: string;
  profile_id: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  occurred_at: number;
  metadata: Record<string, unknown>;
};
