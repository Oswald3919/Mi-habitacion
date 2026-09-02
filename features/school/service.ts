import type { ActivityLogEntry } from '../activity/domain';
import type { FinanceTransaction, PaymentMethod } from '../finance/domain';
import { prepareTransactionCreate } from '../finance/service';
import { enrollmentCost, enrollmentEndDate, isSaturday, type SchoolSettings, type SubjectEnrollment } from './domain';

type IdFactory = () => string;
const activity = (id: string, profileId: string, action: ActivityLogEntry['action'], enrollmentId: string, now: string, metadata: Record<string, unknown>): ActivityLogEntry => ({ id, profile_id: profileId, action, entity_type: 'subject_enrollment', entity_id: enrollmentId, occurred_at: Date.parse(now), metadata });
export function prepareEnrollment(profileId: string, subjectId: string, startDate: string, durationWeeks: 2 | 3 | 4, enrollments: SubjectEnrollment[], now: string, createId: IdFactory): { enrollment: SubjectEnrollment; activity: ActivityLogEntry } {
  if (!isSaturday(startDate)) throw new Error('La materia debe comenzar en sábado');
  const endDate = enrollmentEndDate({ start_date: startDate, duration_weeks: durationWeeks });
  const overlaps = enrollments.some((item) => startDate <= enrollmentEndDate(item) && endDate >= item.start_date);
  if (overlaps) throw new Error('Las materias deben cursarse de forma secuencial');
  if (enrollments.some((item) => item.subject_id === subjectId)) throw new Error('Esta materia ya tiene un cursado');
  const enrollment: SubjectEnrollment = { id: createId(), profile_id: profileId, subject_id: subjectId, start_date: startDate, duration_weeks: durationWeeks, final_grade: null, paid_at: null, finance_transaction_id: null, created_at: now, updated_at: now };
  return { enrollment, activity: activity(createId(), profileId, 'school.enrollment_configured', enrollment.id, now, { subject_id: subjectId, start_date: startDate, duration_weeks: durationWeeks }) };
}
export function prepareGrade(profileId: string, enrollment: SubjectEnrollment, grade: number, now: string, createId: IdFactory): { enrollment: SubjectEnrollment; activity: ActivityLogEntry } {
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) throw new Error('La calificación debe estar entre 0 y 100');
  const updated = { ...enrollment, final_grade: grade, updated_at: now };
  return { enrollment: updated, activity: activity(createId(), profileId, 'school.grade_recorded', enrollment.id, now, { grade, subject_id: enrollment.subject_id }) };
}
export function prepareSchoolPayment(profileId: string, enrollment: SubjectEnrollment, subjectName: string, accountId: string, paymentMethod: PaymentMethod, settings: SchoolSettings, now: string, createId: IdFactory): { enrollment: SubjectEnrollment; transaction: FinanceTransaction; activity: ActivityLogEntry[] } | null {
  if (enrollment.finance_transaction_id || enrollment.paid_at) return null;
  const finance = prepareTransactionCreate(profileId, { amount: enrollmentCost(enrollment.duration_weeks, settings), type: 'expense', category: 'Escuela', account_id: accountId, date: now.slice(0, 10), payment_method: paymentMethod, note: subjectName, project_id: null, subject_enrollment_id: enrollment.id, saving_goal_id: null }, now, createId);
  const updated = { ...enrollment, paid_at: now, finance_transaction_id: finance.value.id, updated_at: now };
  return { enrollment: updated, transaction: finance.value, activity: [finance.activity, activity(createId(), profileId, 'school.payment_marked', enrollment.id, now, { transaction_id: finance.value.id, amount: finance.value.amount })] };
}
