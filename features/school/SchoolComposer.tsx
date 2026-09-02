'use client';

import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import {
  enrollmentCost,
  enrollmentEndDate,
  enrollmentStatus,
  type SubjectEnrollment,
} from './domain';
import { notifySchoolChanged } from './events';
import { prepareEnrollment, prepareGrade } from './service';
import { useSchool } from './use-school';

const createId = () => globalThis.crypto.randomUUID();

function nextSaturday(): string {
  const value = new Date();
  value.setDate(value.getDate() + ((6 - value.getDay() + 7) % 7));
  return value.toLocaleDateString('en-CA');
}

export function SchoolComposer({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: 'enrollment' | 'grade';
  onClose: () => void;
}) {
  const { subjects, enrollments, settings, repository } = useSchool();
  const available = useMemo(
    () => subjects.filter((subject) => !enrollments.some((item) => item.subject_id === subject.id)),
    [subjects, enrollments],
  );
  const waiting = useMemo(
    () => enrollments.filter((item) => enrollmentStatus(item, new Date().toLocaleDateString('en-CA')) === 'awaiting_grade'),
    [enrollments],
  );
  const [subjectId, setSubjectId] = useState('');
  const [startDate, setStartDate] = useState(nextSaturday);
  const [duration, setDuration] = useState<2 | 3 | 4>(3);
  const [gradeEnrollment, setGradeEnrollment] = useState<SubjectEnrollment | null>(null);
  const [grade, setGrade] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setSubjectId(available[0]?.id ?? '');
      setGradeEnrollment(waiting[0] ?? null);
      setStartDate(nextSaturday());
      setDuration(3);
      setGrade(0);
      setError('');
    });
  }, [open, mode, available, waiting]);

  const save = async () => {
    try {
      const now = new Date().toISOString();
      if (mode === 'grade') {
        if (!gradeEnrollment) throw new Error('No hay materias esperando calificación');
        const mutation = prepareGrade(LOCAL_PROFILE_ID, gradeEnrollment, grade, now, createId);
        await repository.saveEnrollment(mutation.enrollment, mutation.activity);
      } else {
        if (!subjectId) throw new Error('No hay materias disponibles');
        const mutation = prepareEnrollment(LOCAL_PROFILE_ID, subjectId, startDate, duration, enrollments, now, createId);
        await repository.saveEnrollment(mutation.enrollment, mutation.activity);
      }
      notifySchoolChanged();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
    }
  };

  if (mode === 'grade') {
    return (
      <BottomSheet open={open} title="Registrar calificación" onClose={onClose}>
        <label className="task-form-label">Materia terminada</label>
        <select className="task-select" value={gradeEnrollment?.id ?? ''} onChange={(event) => setGradeEnrollment(enrollments.find((item) => item.id === event.target.value) ?? null)}>
          {waiting.map((item) => <option key={item.id} value={item.id}>{subjects.find((subject) => subject.id === item.subject_id)?.name}</option>)}
        </select>
        <label className="grade-input"><input type="number" min="0" max="100" value={grade || ''} onChange={(event) => setGrade(Number(event.target.value))}/><span>/ 100</span></label>
        {error && <p className="task-form-error">{error}</p>}
        <button className="task-save-button" onClick={save}>Guardar calificación</button>
      </BottomSheet>
    );
  }

  const preview = { start_date: startDate, duration_weeks: duration };
  return (
    <BottomSheet open={open} title="Configurar materia" onClose={onClose}>
      <label className="task-form-label">Materia oficial</label>
      <select className="task-select" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
        {available.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
      </select>
      <label className="task-form-label">Primer sábado</label>
      <input className="task-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/>
      <fieldset className="task-form-fieldset"><legend>Duración</legend><div className="school-duration">{([2, 3, 4] as const).map((weeks) => <button key={weeks} className={duration === weeks ? 'active' : ''} onClick={() => setDuration(weeks)}><b>{weeks} sábados</b><span>${enrollmentCost(weeks, settings).toLocaleString('es-MX')}</span></button>)}</div></fieldset>
      <div className="school-preview"><span><small>Inicio</small><b>{startDate}</b></span><span><small>Final</small><b>{enrollmentEndDate(preview)}</b></span><span><small>Horario</small><b>{settings.start_time}–{settings.end_time}</b></span></div>
      {error && <p className="task-form-error">{error}</p>}
      <button className="task-save-button" onClick={save}>Guardar cursado</button>
    </BottomSheet>
  );
}
