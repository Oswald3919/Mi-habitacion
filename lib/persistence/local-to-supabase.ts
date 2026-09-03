import type { SupabaseClient } from '@supabase/supabase-js';
import type { LocalDatabase } from './schema';
import { LOCAL_DATABASE_VERSION } from './schema';
import { normalizeAppSettings } from '../../features/settings/domain';
import { BIS_MODULES, BIS_SUBJECTS } from '../../features/school/catalog';

export const LOCAL_UPLOAD_KEY = 'v1-local-database';
export const LOCAL_UPLOAD_MARKER = 'mi-habitacion:supabase-migration';
const omitProfile = <T extends { profile_id: string }>(row: T, userId: string) => { const { profile_id: _profileId, ...rest } = row; void _profileId; return { ...rest, user_id: userId }; };
const timestamp = (value: number | null) => value === null ? null : new Date(value).toISOString();
const activity = (row: LocalDatabase['activity_log'][number], userId: string) => ({ ...omitProfile(row,userId), occurred_at:new Date(row.occurred_at).toISOString() });

async function upsert(client:SupabaseClient,table:string,rows:unknown[],onConflict='id'){if(!rows.length)return;const {error}=await client.from(table).upsert(rows,{onConflict});if(error)throw new Error(`${table}: ${error.message}`);}

export async function uploadDatabaseToSupabase(client:SupabaseClient,userId:string,db:LocalDatabase,migrationKey=LOCAL_UPLOAD_KEY):Promise<void>{
  const {data:done,error:doneError}=await client.from('local_migrations').select('migration_key').eq('migration_key',migrationKey).maybeSingle();if(doneError)throw new Error(doneError.message);if(done)return;
  await upsert(client,'profiles',[{id:userId,display_name:db.settings.profile_name,updated_at:new Date().toISOString()}]);
  await upsert(client,'projects',db.projects.map(x=>omitProfile(x,userId))); await upsert(client,'goals',db.goals.map(x=>omitProfile(x,userId)));
  await upsert(client,'room_zones',db.room_zones.map(x=>({user_id:userId,id:x.id,name:x.name,status:x.status,updated_at:timestamp(x.updated_at),position:x.position})),'user_id,id');
  await upsert(client,'room_items',db.room_items.map(x=>({user_id:userId,id:x.id,room_zone_id:x.room_zone_id,name:x.name,status:x.status,updated_at:timestamp(x.updated_at),position:x.position})),'user_id,id');
  await upsert(client,'subject_enrollments',db.subject_enrollments.map(x=>({...omitProfile(x,userId),finance_transaction_id:null})));
  await upsert(client,'finance_accounts',db.finance_accounts.map(x=>omitProfile(x,userId))); await upsert(client,'finance_saving_goals',db.finance_saving_goals.map(x=>omitProfile(x,userId))); await upsert(client,'recurring_payments',db.recurring_payments.map(x=>omitProfile(x,userId)));
  await upsert(client,'finance_transactions',db.finance_transactions.map(x=>omitProfile(x,userId)));
  await upsert(client,'subject_enrollments',db.subject_enrollments.map(x=>omitProfile(x,userId)));
  await upsert(client,'tasks',db.tasks.map(x=>omitProfile(x,userId))); await upsert(client,'ideas',db.ideas.map(x=>omitProfile(x,userId)));
  await upsert(client,'room_status_history',db.room_status_history.map(x=>({...omitProfile(x,userId),changed_at:new Date(x.changed_at).toISOString()})));
  await upsert(client,'room_daily_snapshots',db.room_daily_snapshots.map(x=>({user_id:userId,date:x.date,status:x.status,zones:x.zones})),'user_id,date');
  await upsert(client,'activity_log',db.activity_log.map(x=>activity(x,userId)));
  await upsert(client,'user_settings',[{user_id:userId,settings:db.settings,room_current_date:db.current_date,updated_at:new Date().toISOString()}],'user_id');
  const verifications:Array<[string,string[]]>=[['tasks',db.tasks.map(x=>x.id)],['finance_transactions',db.finance_transactions.map(x=>x.id)],['projects',db.projects.map(x=>x.id)],['goals',db.goals.map(x=>x.id)],['ideas',db.ideas.map(x=>x.id)]];
  for(const [table,ids] of verifications){if(!ids.length)continue;const {data,error}=await client.from(table).select('id').in('id',ids);if(error)throw new Error(`${table}: ${error.message}`);const found=new Set((data??[]).map(x=>x.id));if(ids.some(id=>!found.has(id)))throw new Error(`La verificación de ${table} quedó incompleta.`);}
  await upsert(client,'local_migrations',[{user_id:userId,migration_key:migrationKey,source_schema_version:db.schema_version,completed_at:new Date().toISOString()}],'user_id,migration_key');
}

export async function exportDatabaseFromSupabase(client:SupabaseClient,userId:string):Promise<LocalDatabase>{
  const tables=['tasks','finance_accounts','finance_transactions','recurring_payments','finance_saving_goals','projects','goals','subject_enrollments','room_zones','room_items','room_status_history','room_daily_snapshots','ideas','activity_log','user_settings'] as const;
  const values=await Promise.all(tables.map(async table=>{const {data,error}=await client.from(table).select('*');if(error)throw new Error(`${table}: ${error.message}`);return data??[];}));
  const rows=Object.fromEntries(tables.map((table,index)=>[table,values[index]])) as Record<(typeof tables)[number],Array<Record<string,unknown>>>;
  const profile=(row:Record<string,unknown>)=>{const {user_id:_user,...rest}=row;void _user;return{...rest,profile_id:userId};};
  const settingsRow=rows.user_settings[0]??{}; const settings=normalizeAppSettings((settingsRow.settings??{}) as Parameters<typeof normalizeAppSettings>[0]);
  return {schema_version:LOCAL_DATABASE_VERSION,profile_id:userId,current_date:String(settingsRow.room_current_date??new Date().toLocaleDateString('en-CA')),
    room_zones:rows.room_zones.map(x=>({...profile(x),updated_at:x.updated_at?Date.parse(String(x.updated_at)):null})) as LocalDatabase['room_zones'],
    room_items:rows.room_items.map(x=>({...profile(x),updated_at:x.updated_at?Date.parse(String(x.updated_at)):null})) as LocalDatabase['room_items'],
    room_status_history:rows.room_status_history.map(x=>({...profile(x),changed_at:Date.parse(String(x.changed_at))})) as LocalDatabase['room_status_history'],
    room_daily_snapshots:rows.room_daily_snapshots.map(x=>({...profile(x),id:`room-day:${x.date}`})) as LocalDatabase['room_daily_snapshots'],
    activity_log:rows.activity_log.map(x=>({...profile(x),occurred_at:Date.parse(String(x.occurred_at))})) as LocalDatabase['activity_log'], settings,
    tasks:rows.tasks.map(profile) as LocalDatabase['tasks'], finance_accounts:rows.finance_accounts.map(x=>({...profile(x),opening_balance:Number(x.opening_balance)})) as LocalDatabase['finance_accounts'], finance_transactions:rows.finance_transactions.map(x=>({...profile(x),amount:Number(x.amount)})) as LocalDatabase['finance_transactions'], recurring_payments:rows.recurring_payments.map(x=>({...profile(x),amount:Number(x.amount)})) as LocalDatabase['recurring_payments'], finance_saving_goals:rows.finance_saving_goals.map(x=>({...profile(x),target_amount:Number(x.target_amount)})) as LocalDatabase['finance_saving_goals'], projects:rows.projects.map(profile) as LocalDatabase['projects'], goals:rows.goals.map(x=>({...profile(x),progress:Number(x.progress),objective:Number(x.objective)})) as LocalDatabase['goals'], school_modules:BIS_MODULES, school_subjects:BIS_SUBJECTS, subject_enrollments:rows.subject_enrollments.map(x=>({...profile(x),duration_weeks:Number(x.duration_weeks),final_grade:x.final_grade===null?null:Number(x.final_grade)})) as LocalDatabase['subject_enrollments'], ideas:rows.ideas.map(profile) as LocalDatabase['ideas']};
}

export const __testables={omitProfile,timestamp};
