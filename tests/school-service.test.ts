import { describe, expect, it } from 'vitest';
import { enrollmentCost, enrollmentEndDate, enrollmentStatus, SCHOOL_DEFAULT_SETTINGS } from '../features/school/domain';
import { prepareEnrollment, prepareGrade, prepareSchoolPayment } from '../features/school/service';
import { LOCAL_PROFILE_ID } from '../lib/persistence/schema';
const ids = () => { let value = 0; return () => `id-${++value}`; };
const now = '2026-09-02T12:00:00.000Z';
describe('school domain and service', () => {
  it('calculates exact Saturdays, cost and status', () => {
    const mutation = prepareEnrollment(LOCAL_PROFILE_ID, 'subject-1', '2026-09-05', 3, [], now, ids());
    expect(enrollmentEndDate(mutation.enrollment)).toBe('2026-09-19');
    expect(enrollmentCost(3, SCHOOL_DEFAULT_SETTINGS)).toBe(1160);
    expect(enrollmentStatus(mutation.enrollment, '2026-09-04')).toBe('upcoming');
    expect(enrollmentStatus(mutation.enrollment, '2026-09-12')).toBe('studying');
    expect(enrollmentStatus(mutation.enrollment, '2026-09-20')).toBe('awaiting_grade');
    expect(prepareGrade(LOCAL_PROFILE_ID, mutation.enrollment, 92, now, ids()).enrollment.final_grade).toBe(92);
  });

  it('enforces Saturday starts and sequential subjects', () => {
    expect(() => prepareEnrollment(LOCAL_PROFILE_ID, 'subject-1', '2026-09-04', 2, [], now, ids())).toThrow('sábado');
    const first = prepareEnrollment(LOCAL_PROFILE_ID, 'subject-1', '2026-09-05', 3, [], now, ids()).enrollment;
    expect(() => prepareEnrollment(LOCAL_PROFILE_ID, 'subject-2', '2026-09-12', 2, [first], now, ids())).toThrow('secuencial');
  });

  it('creates one real school expense and prevents duplicate preparation', () => {
    const enrollment = prepareEnrollment(LOCAL_PROFILE_ID, 'subject-1', '2026-09-05', 2, [], now, ids()).enrollment;
    const payment = prepareSchoolPayment(LOCAL_PROFILE_ID, enrollment, 'Cultura Digital I', 'cash', 'cash', SCHOOL_DEFAULT_SETTINGS, now, ids());
    expect(payment?.transaction).toMatchObject({ amount: 772, type: 'expense', category: 'Escuela', subject_enrollment_id: enrollment.id });
    expect(payment?.activity.map((item) => item.action)).toEqual(['finance.transaction_created', 'school.payment_marked']);
    expect(prepareSchoolPayment(LOCAL_PROFILE_ID, payment!.enrollment, 'Cultura Digital I', 'cash', 'cash', SCHOOL_DEFAULT_SETTINGS, now, ids())).toBeNull();
  });
});
