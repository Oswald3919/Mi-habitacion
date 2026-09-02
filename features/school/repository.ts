import type { ActivityLogEntry } from '../activity/domain';
import type { FinanceTransaction } from '../finance/domain';
import type { SchoolModule, SchoolSettings, SchoolSubject, SubjectEnrollment } from './domain';
export type SchoolSnapshot = { modules: SchoolModule[]; subjects: SchoolSubject[]; enrollments: SubjectEnrollment[]; settings: SchoolSettings; activity: ActivityLogEntry[] };
export interface SchoolRepository { load(): Promise<SchoolSnapshot>; saveEnrollment(enrollment: SubjectEnrollment, activity: ActivityLogEntry): Promise<void>; markPaid(enrollment: SubjectEnrollment, transaction: FinanceTransaction, activity: ActivityLogEntry[]): Promise<void>; }
