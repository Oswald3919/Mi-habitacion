export type ActivityEntityType =
  | 'room_zone'
  | 'room_item'
  | 'task'
  | 'finance_transaction'
  | 'recurring_payment'
  | 'saving_goal'
  | 'project'
  | 'goal';
export type ActivityAction =
  | 'room.status_changed'
  | 'room.day_reset'
  | 'task.created'
  | 'task.completed'
  | 'task.reopened'
  | 'task.updated'
  | 'task.deleted'
  | 'finance.transaction_created'
  | 'finance.transaction_updated'
  | 'finance.transaction_deleted'
  | 'finance.payment_marked'
  | 'finance.saving_updated'
  | 'project.created'
  | 'project.updated'
  | 'project.status_changed'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.progress_updated';

export type ActivityLogEntry = {
  id: string;
  profile_id: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  occurred_at: number;
  metadata: Record<string, unknown>;
};
