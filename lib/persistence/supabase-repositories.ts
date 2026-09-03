import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityLogEntry } from '../../features/activity/domain';
import type { ActivityRepository } from '../../features/activity/repository';
import type { FinanceAccount, FinanceSavingGoal, FinanceTransaction, RecurringPayment } from '../../features/finance/domain';
import type { FinanceRepository } from '../../features/finance/repository';
import type { Goal } from '../../features/goals/domain';
import type { GoalRepository } from '../../features/goals/repository';
import type { Idea } from '../../features/ideas/domain';
import type { IdeaRepository } from '../../features/ideas/repository';
import type { Project } from '../../features/projects/domain';
import type { ProjectRepository } from '../../features/projects/repository';
import { BIS_MODULES, BIS_SUBJECTS } from '../../features/school/catalog';
import type { SubjectEnrollment } from '../../features/school/domain';
import type { SchoolRepository } from '../../features/school/repository';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings, type AppSettings } from '../../features/settings/domain';
import type { SettingsRepository } from '../../features/settings/repository';
import { applyRoomStatus, createRoomDayRecord, DEFAULT_ROOM_STATE, ROOM_ITEM_IDS, ROOM_ITEM_LABELS, ROOM_ZONE_IDS, type RoomDayRecord, type RoomSession, type RoomState, type RoomUpdated } from '../../features/room/domain';
import type { RoomMutation, RoomRepository } from '../../features/room/repository';
import type { Task } from '../../features/tasks/domain';
import { sortTasks } from '../../features/tasks/domain';
import type { TaskRepository } from '../../features/tasks/repository';
import { getSupabaseBrowserClient, reportDataError } from '../supabase/client';
import { exportDatabaseFromSupabase, uploadDatabaseToSupabase } from './local-to-supabase';
import { migrateCurrentDatabase } from './migrations';

const iso = (value: number | null) => value === null ? null : new Date(value).toISOString();
const millis = (value: string | null) => value ? Date.parse(value) : undefined;
const withoutProfile = <T extends { profile_id: string }>(value: T, userId: string) => { const { profile_id: _profileId, ...rest } = value; void _profileId; return { ...rest, user_id: userId }; };
const activityRow = (entry: ActivityLogEntry, userId: string) => ({ ...withoutProfile(entry, userId), occurred_at: new Date(entry.occurred_at).toISOString() });
const activityDomain = (row: Record<string, unknown>, userId: string): ActivityLogEntry => ({ ...(row as unknown as ActivityLogEntry), profile_id: userId, occurred_at: Date.parse(String(row.occurred_at)) });

async function userId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) { reportDataError('Tu sesión expiró. Vuelve a iniciar sesión.'); throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.'); }
  return data.user.id;
}
function checked<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) { reportDataError(result.error.message); throw new Error(result.error.message); }
  return result.data as NonNullable<T>;
}
const client = () => getSupabaseBrowserClient();
const zoneNames: Record<(typeof ROOM_ZONE_IDS)[number], string> = { bed: 'Cama', desk: 'Escritorio', tv: 'Zona de TV', closet: 'Clóset' };

export function createSupabaseTaskRepository(): TaskRepository { return {
  async list() { const c = client(); const uid = await userId(c); const rows = checked(await c.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false })); return sortTasks(rows.map((row) => ({ ...row, profile_id: uid })) as Task[]); },
  async save(task, activity) { const c = client(); const uid = await userId(c); checked(await c.from('tasks').upsert(withoutProfile(task, uid))); if (activity) checked(await c.from('activity_log').upsert(activityRow(activity, uid))); },
}; }

export function createSupabaseFinanceRepository(): FinanceRepository { return {
  async load() { const c = client(); const uid = await userId(c); const [a,t,p,s] = await Promise.all([c.from('finance_accounts').select('*'), c.from('finance_transactions').select('*').order('date',{ascending:false}), c.from('recurring_payments').select('*').order('next_due_date'), c.from('finance_saving_goals').select('*')]); return { accounts: checked(a).map((x) => ({...x,profile_id:uid})) as FinanceAccount[], transactions: checked(t).map((x) => ({...x,profile_id:uid,amount:Number(x.amount)})) as FinanceTransaction[], payments: checked(p).map((x) => ({...x,profile_id:uid,amount:Number(x.amount)})) as RecurringPayment[], savingGoals: checked(s).map((x) => ({...x,profile_id:uid,target_amount:Number(x.target_amount)})) as FinanceSavingGoal[] }; },
  async saveAccount(value) { const c=client(); const uid=await userId(c); checked(await c.from('finance_accounts').upsert(withoutProfile(value,uid))); },
  async saveTransaction(value,entry) { const c=client(); const uid=await userId(c); checked(await c.from('finance_transactions').upsert(withoutProfile(value,uid))); checked(await c.from('activity_log').upsert(activityRow(entry,uid))); },
  async deleteTransaction(id,entry) { const c=client(); const uid=await userId(c); checked(await c.from('finance_transactions').delete().eq('id',id).eq('user_id',uid)); checked(await c.from('activity_log').upsert(activityRow(entry,uid))); },
  async savePayment(value,entry,transaction) { const c=client(); const uid=await userId(c); checked(await c.from('recurring_payments').upsert(withoutProfile(value,uid))); if(transaction) checked(await c.from('finance_transactions').upsert(withoutProfile(transaction,uid))); if(entry) checked(await c.from('activity_log').upsert(activityRow(entry,uid))); },
  async saveSavingGoal(value,entry) { const c=client(); const uid=await userId(c); checked(await c.from('finance_saving_goals').upsert(withoutProfile(value,uid))); checked(await c.from('activity_log').upsert(activityRow(entry,uid))); },
}; }

export function createSupabaseProjectRepository(): ProjectRepository { return {
  async list(){const c=client();const uid=await userId(c);return checked(await c.from('projects').select('*').order('updated_at',{ascending:false})).map(x=>({...x,profile_id:uid})) as Project[];},
  async save(value,entry){const c=client();const uid=await userId(c);checked(await c.from('projects').upsert(withoutProfile(value,uid)));checked(await c.from('activity_log').upsert(activityRow(entry,uid)));},
  async related(id){const c=client();const uid=await userId(c);const [t,f,a]=await Promise.all([c.from('tasks').select('*').eq('project_id',id),c.from('finance_transactions').select('*').eq('project_id',id),c.from('activity_log').select('*').eq('entity_type','project').eq('entity_id',id).order('occurred_at',{ascending:false})]);return{tasks:checked(t).map(x=>({...x,profile_id:uid})) as Task[],transactions:checked(f).map(x=>({...x,profile_id:uid,amount:Number(x.amount)})) as FinanceTransaction[],activity:checked(a).map(x=>activityDomain(x,uid))};},
}; }
export function createSupabaseGoalRepository(): GoalRepository { return {
  async list(){const c=client();const uid=await userId(c);return checked(await c.from('goals').select('*').order('updated_at',{ascending:false})).map(x=>({...x,profile_id:uid,progress:Number(x.progress),objective:Number(x.objective)})) as Goal[];},
  async save(value,entry){const c=client();const uid=await userId(c);checked(await c.from('goals').upsert(withoutProfile(value,uid)));checked(await c.from('activity_log').upsert(activityRow(entry,uid)));},
  async relatedTasks(id){const c=client();const uid=await userId(c);return checked(await c.from('tasks').select('*').eq('goal_id',id)).map(x=>({...x,profile_id:uid})) as Task[];},
}; }
export function createSupabaseIdeaRepository(): IdeaRepository { return {
  async list(){const c=client();const uid=await userId(c);return checked(await c.from('ideas').select('*').order('updated_at',{ascending:false})).map(x=>({...x,profile_id:uid})) as Idea[];},
  async save(value,entry){const c=client();const uid=await userId(c);checked(await c.from('ideas').upsert(withoutProfile(value,uid)));checked(await c.from('activity_log').upsert(activityRow(entry,uid)));},
}; }
export function createSupabaseActivityRepository(): ActivityRepository { return { async list(){const c=client();const uid=await userId(c);return checked(await c.from('activity_log').select('*').order('occurred_at',{ascending:false})).map(x=>activityDomain(x,uid));} }; }

export function createSupabaseSchoolRepository(): SchoolRepository { return {
  async load(){const c=client();const uid=await userId(c);const [m,s,e,a,u]=await Promise.all([c.from('school_modules').select('*').order('position'),c.from('school_subjects').select('*').order('position'),c.from('subject_enrollments').select('*').order('start_date'),c.from('activity_log').select('*').eq('entity_type','subject_enrollment').order('occurred_at',{ascending:false}),c.from('user_settings').select('settings').maybeSingle()]);const settings=normalizeAppSettings((checked(u)?.settings??DEFAULT_APP_SETTINGS) as Partial<AppSettings>);return{modules:(checked(m).length?checked(m):BIS_MODULES),subjects:(checked(s).length?checked(s):BIS_SUBJECTS),enrollments:checked(e).map(x=>({...x,profile_id:uid,duration_weeks:Number(x.duration_weeks),final_grade:x.final_grade===null?null:Number(x.final_grade)})) as SubjectEnrollment[],settings:settings.school,activity:checked(a).map(x=>activityDomain(x,uid))};},
  async saveEnrollment(value,entry){const c=client();const uid=await userId(c);checked(await c.from('subject_enrollments').upsert(withoutProfile(value,uid)));checked(await c.from('activity_log').upsert(activityRow(entry,uid)));},
  async markPaid(value,transaction,activity){const c=client();const uid=await userId(c);const existing=checked(await c.from('finance_transactions').select('id').eq('subject_enrollment_id',value.id).maybeSingle());if(existing)return;checked(await c.from('finance_transactions').upsert(withoutProfile(transaction,uid)));checked(await c.from('subject_enrollments').upsert(withoutProfile(value,uid)));if(activity.length)checked(await c.from('activity_log').upsert(activity.map(x=>activityRow(x,uid))));},
}; }

export function createSupabaseSettingsRepository(): SettingsRepository { return {
  async load(){const c=client();await userId(c);const row=checked(await c.from('user_settings').select('settings').maybeSingle());return normalizeAppSettings((row?.settings??DEFAULT_APP_SETTINGS) as Partial<AppSettings>);},
  async save(value,entry){const c=client();const uid=await userId(c);checked(await c.from('user_settings').upsert({user_id:uid,settings:value,updated_at:new Date().toISOString()}));checked(await c.from('profiles').upsert({id:uid,display_name:value.profile_name,updated_at:new Date().toISOString()}));checked(await c.from('activity_log').upsert(activityRow(entry,uid)));localStorage.setItem('mi-habitacion:appearance-cache',JSON.stringify({appearance:value.appearance,accent:value.accent}));},
  async exportBackup(){const c=client();const uid=await userId(c);return JSON.stringify(await exportDatabaseFromSupabase(c,uid),null,2);},
  async importBackup(raw,_now,createId){let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error('El archivo no contiene JSON válido');}const db=migrateCurrentDatabase(parsed);if(!db)throw new Error('El respaldo no es compatible o está incompleto');const c=client();const uid=await userId(c);await uploadDatabaseToSupabase(c,uid,db,`manual-import:${createId()}`);},
}; }

export function createSupabaseRoomRepository(): RoomRepository {
  const load = async (): Promise<RoomSession> => {const c=client();const uid=await userId(c);const [z,i,d,u]=await Promise.all([c.from('room_zones').select('*').order('position'),c.from('room_items').select('*').order('position'),c.from('room_daily_snapshots').select('*').order('date'),c.from('user_settings').select('settings,room_current_date').maybeSingle()]);const state:RoomState={...DEFAULT_ROOM_STATE};const updated:RoomUpdated={};for(const row of checked(z)){if(row.status)state[row.id as keyof RoomState]=row.status;if(row.updated_at)updated[row.id as keyof RoomState]=Date.parse(row.updated_at);}for(const row of checked(i)){state[row.id as keyof RoomState]=row.status;if(row.updated_at)updated[row.id as keyof RoomState]=Date.parse(row.updated_at);}const settings=normalizeAppSettings((checked(u)?.settings??DEFAULT_APP_SETTINGS) as Partial<AppSettings>);const date=checked(u)?.room_current_date??new Date().toLocaleDateString('en-CA');const history=checked(d).map(x=>({date:x.date,status:x.status,zones:x.zones})) as RoomDayRecord[];const current=new Date().toLocaleDateString('en-CA');if(date===current)return{date,state,updated,history,notifications:settings.room_notifications};const previous=createRoomDayRecord(state,date);const change=applyRoomStatus(state,updated,'bed','attention',Date.now());const next={date:current,state:change.state,updated:change.updated,history:[...history.filter(x=>x.date!==date),previous].slice(-365),notifications:settings.room_notifications};checked(await c.from('room_daily_snapshots').upsert({user_id:uid,...previous}));checked(await c.from('room_zones').upsert({user_id:uid,id:'bed',name:'Cama',status:next.state.bed,updated_at:iso(next.updated.bed??null),position:0}));if(change.changedEntities.length)checked(await c.from('room_status_history').upsert(change.changedEntities.map(x=>({id:crypto.randomUUID(),user_id:uid,entity_type:x.entityType,entity_id:x.entityId,previous_status:x.previousStatus,status:x.status,changed_at:new Date().toISOString(),source:'day_rollover'}))));checked(await c.from('user_settings').upsert({user_id:uid,room_current_date:current,settings}));return next;};
  return {loadSession:load,async loadDailyHistory(){return(await load()).history;},async commit(mutation:RoomMutation){const c=client();const uid=await userId(c);const zones=ROOM_ZONE_IDS.map((id,position)=>({user_id:uid,id,name:zoneNames[id],status:id==='tv'||id==='closet'?null:mutation.session.state[id],updated_at:iso(mutation.session.updated[id]??null),position}));const items=ROOM_ITEM_IDS.map((id,position)=>({user_id:uid,id,room_zone_id:id==='tvUnit'||id==='shoeShelf'?'tv':'closet',name:ROOM_ITEM_LABELS[id],status:mutation.session.state[id],updated_at:iso(mutation.session.updated[id]??null),position}));checked(await c.from('room_zones').upsert(zones));checked(await c.from('room_items').upsert(items));if(mutation.session.history.length)checked(await c.from('room_daily_snapshots').upsert(mutation.session.history.map(x=>({user_id:uid,...x}))));if(mutation.statusHistory.length)checked(await c.from('room_status_history').upsert(mutation.statusHistory.map(x=>({...withoutProfile(x,uid),changed_at:new Date(x.changed_at).toISOString()}))));if(mutation.activity.length)checked(await c.from('activity_log').upsert(mutation.activity.map(x=>activityRow(x,uid))));checked(await c.from('user_settings').upsert({user_id:uid,room_current_date:mutation.session.date}));},async saveNotificationPreference(enabled){const c=client();const uid=await userId(c);const row=checked(await c.from('user_settings').select('settings').maybeSingle());const settings=normalizeAppSettings((row?.settings??DEFAULT_APP_SETTINGS) as Partial<AppSettings>);checked(await c.from('user_settings').upsert({user_id:uid,settings:{...settings,room_notifications:enabled}}));}};
}

export const __testables = { withoutProfile, activityRow, activityDomain, iso, millis };
