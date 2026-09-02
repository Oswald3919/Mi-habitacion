export type SchoolModule = { id: string; number: number; name: string; position: number };
export type SchoolSubject = { id: string; module_id: string; name: string; position: number };
export type SubjectEnrollment = {
  id: string;
  profile_id: string;
  subject_id: string;
  start_date: string;
  duration_weeks: 2 | 3 | 4;
  final_grade: number | null;
  paid_at: string | null;
  finance_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};
export type SchoolSettings = { class_day: 6; start_time: string; end_time: string; price_2_weeks: number; price_3_weeks: number; price_4_weeks: number };
export type EnrollmentStatus = 'upcoming' | 'studying' | 'awaiting_grade' | 'completed';
export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = { upcoming: 'Próxima', studying: 'Cursando', awaiting_grade: 'Esperando calificación', completed: 'Terminada' };
export const SCHOOL_DEFAULT_SETTINGS: SchoolSettings = { class_day: 6, start_time: '08:30', end_time: '14:00', price_2_weeks: 772, price_3_weeks: 1160, price_4_weeks: 1544 };
export function addDays(date: string, days: number): string { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return value.toLocaleDateString('en-CA'); }
export function enrollmentEndDate(enrollment: Pick<SubjectEnrollment, 'start_date' | 'duration_weeks'>): string { return addDays(enrollment.start_date, (enrollment.duration_weeks - 1) * 7); }
export function enrollmentCost(duration: 2 | 3 | 4, settings: SchoolSettings): number { return settings[`price_${duration}_weeks`]; }
export function enrollmentStatus(enrollment: SubjectEnrollment, today: string): EnrollmentStatus { if (enrollment.final_grade !== null) return 'completed'; if (today < enrollment.start_date) return 'upcoming'; if (today <= enrollmentEndDate(enrollment)) return 'studying'; return 'awaiting_grade'; }
export function isSaturday(date: string): boolean { return new Date(`${date}T12:00:00`).getDay() === 6; }
export function isSchoolModule(value: unknown): value is SchoolModule { if (!value || typeof value !== 'object') return false; const item = value as Partial<SchoolModule>; return typeof item.id === 'string' && typeof item.number === 'number' && typeof item.name === 'string'; }
export function isSchoolSubject(value: unknown): value is SchoolSubject { if (!value || typeof value !== 'object') return false; const item = value as Partial<SchoolSubject>; return typeof item.id === 'string' && typeof item.module_id === 'string' && typeof item.name === 'string'; }
export function isSubjectEnrollment(value: unknown): value is SubjectEnrollment { if (!value || typeof value !== 'object') return false; const item = value as Partial<SubjectEnrollment>; return typeof item.id === 'string' && typeof item.profile_id === 'string' && typeof item.subject_id === 'string' && typeof item.start_date === 'string' && (item.duration_weeks === 2 || item.duration_weeks === 3 || item.duration_weeks === 4) && (item.final_grade === null || typeof item.final_grade === 'number'); }
