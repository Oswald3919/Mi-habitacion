export const SCHOOL_CHANGED_EVENT = 'mi-habitacion:school-changed';
export const SCHOOL_CREATE_EVENT = 'mi-habitacion:school-create';
export const notifySchoolChanged = () => window.dispatchEvent(new Event(SCHOOL_CHANGED_EVENT));
export const requestSchoolEnrollment = () => window.dispatchEvent(new CustomEvent(SCHOOL_CREATE_EVENT, { detail: { mode: 'enrollment' } }));
export const requestSchoolGrade = () => window.dispatchEvent(new CustomEvent(SCHOOL_CREATE_EVENT, { detail: { mode: 'grade' } }));
