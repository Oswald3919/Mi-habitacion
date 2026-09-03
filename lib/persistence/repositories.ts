import type { ActivityRepository } from '../../features/activity/repository';
import type { FinanceRepository } from '../../features/finance/repository';
import type { GoalRepository } from '../../features/goals/repository';
import type { IdeaRepository } from '../../features/ideas/repository';
import type { ProjectRepository } from '../../features/projects/repository';
import type { RoomRepository } from '../../features/room/repository';
import type { SchoolRepository } from '../../features/school/repository';
import type { SettingsRepository } from '../../features/settings/repository';
import type { TaskRepository } from '../../features/tasks/repository';
import { getDataMode } from '../supabase/client';
import { createLocalActivityRepository } from './local-activity-repository';
import { createLocalFinanceRepository } from './local-finance-repository';
import { createLocalGoalRepository } from './local-goal-repository';
import { createLocalIdeaRepository } from './local-idea-repository';
import { createLocalProjectRepository } from './local-project-repository';
import { createLocalRoomRepository } from './local-repositories';
import { createLocalSchoolRepository } from './local-school-repository';
import { createLocalSettingsRepository } from './local-settings-repository';
import { createLocalTaskRepository } from './local-task-repository';
import { createSupabaseActivityRepository, createSupabaseFinanceRepository, createSupabaseGoalRepository, createSupabaseIdeaRepository, createSupabaseProjectRepository, createSupabaseRoomRepository, createSupabaseSchoolRepository, createSupabaseSettingsRepository, createSupabaseTaskRepository } from './supabase-repositories';

const remote = () => getDataMode() === 'remote';
export function createTaskRepository():TaskRepository{const l=createLocalTaskRepository(),r=createSupabaseTaskRepository();return{list:()=>remote()?r.list():l.list(),save:(v,a)=>remote()?r.save(v,a):l.save(v,a)};}
export function createFinanceRepository():FinanceRepository{const l=createLocalFinanceRepository(),r=createSupabaseFinanceRepository();return{load:()=>remote()?r.load():l.load(),saveAccount:v=>remote()?r.saveAccount(v):l.saveAccount(v),saveTransaction:(v,a)=>remote()?r.saveTransaction(v,a):l.saveTransaction(v,a),deleteTransaction:(v,a)=>remote()?r.deleteTransaction(v,a):l.deleteTransaction(v,a),savePayment:(v,a,t)=>remote()?r.savePayment(v,a,t):l.savePayment(v,a,t),saveSavingGoal:(v,a)=>remote()?r.saveSavingGoal(v,a):l.saveSavingGoal(v,a)};}
export function createProjectRepository():ProjectRepository{const l=createLocalProjectRepository(),r=createSupabaseProjectRepository();return{list:()=>remote()?r.list():l.list(),save:(v,a)=>remote()?r.save(v,a):l.save(v,a),related:id=>remote()?r.related(id):l.related(id)};}
export function createGoalRepository():GoalRepository{const l=createLocalGoalRepository(),r=createSupabaseGoalRepository();return{list:()=>remote()?r.list():l.list(),save:(v,a)=>remote()?r.save(v,a):l.save(v,a),relatedTasks:id=>remote()?r.relatedTasks(id):l.relatedTasks(id)};}
export function createIdeaRepository():IdeaRepository{const l=createLocalIdeaRepository(),r=createSupabaseIdeaRepository();return{list:()=>remote()?r.list():l.list(),save:(v,a)=>remote()?r.save(v,a):l.save(v,a)};}
export function createActivityRepository():ActivityRepository{const l=createLocalActivityRepository(),r=createSupabaseActivityRepository();return{list:()=>remote()?r.list():l.list()};}
export function createSchoolRepository():SchoolRepository{const l=createLocalSchoolRepository(),r=createSupabaseSchoolRepository();return{load:()=>remote()?r.load():l.load(),saveEnrollment:(v,a)=>remote()?r.saveEnrollment(v,a):l.saveEnrollment(v,a),markPaid:(v,t,a)=>remote()?r.markPaid(v,t,a):l.markPaid(v,t,a)};}
export function createSettingsRepository():SettingsRepository{const l=createLocalSettingsRepository(),r=createSupabaseSettingsRepository();return{load:()=>remote()?r.load():l.load(),save:(v,a)=>remote()?r.save(v,a):l.save(v,a),exportBackup:()=>remote()?r.exportBackup():l.exportBackup(),importBackup:(v,n,c)=>remote()?r.importBackup(v,n,c):l.importBackup(v,n,c)};}
export function createRoomRepository():RoomRepository{const l=createLocalRoomRepository(),r=createSupabaseRoomRepository();return{loadSession:()=>remote()?r.loadSession():l.loadSession(),loadDailyHistory:()=>remote()?r.loadDailyHistory():l.loadDailyHistory(),commit:v=>remote()?r.commit(v):l.commit(v),saveNotificationPreference:v=>remote()?r.saveNotificationPreference(v):l.saveNotificationPreference(v)};}
