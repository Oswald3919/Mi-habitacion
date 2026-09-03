import type { SchoolModule, SchoolSubject } from './domain';

// Curricular seed kept in one replaceable boundary. Confirm the exact BIS plantel
// catalog before treating these names as the authoritative academic plan.
export const BIS_MODULES: SchoolModule[] = Array.from({ length: 6 }, (_, index) => ({ id: `bis-module-${index + 1}`, number: index + 1, name: `Módulo ${index + 1}`, position: index }));

const moduleSubjects: string[][] = [
  ['Lengua y Comunicación I', 'Pensamiento Matemático I', 'Ciencias Sociales I', 'La materia y sus interacciones', 'Humanidades I', 'Inglés I', 'Laboratorio de Investigación', 'Educación para la Salud', 'Cultura Digital I'],
  ['Lengua y Comunicación II', 'Inglés II', 'Pensamiento Matemático II', 'Cultura Digital II', 'Humanidades II', 'Ciencias Sociales II', 'Conservación de la energía y su interacción con la materia', 'Taller de Ciencias I', 'Recursos Socioemocionales II'],
  ['Lengua y Comunicación III', 'Inglés III', 'Pensamiento Matemático III', 'Humanidades III', 'Ecosistemas: interacciones, energía y dinámica', 'Conciencia Histórica I', 'Taller de Ciencias II', 'Formación Socioemocional III'],
  ['Inglés IV', 'Ciencias Sociales III', 'Conciencia Histórica II', 'Reacciones químicas: conservación de la materia', 'Pensamiento Matemático IV', 'Comunicación, Arte y Cultura I', 'Formación Socioemocional IV'],
  ['Conciencia Histórica III', 'La energía en los procesos de la vida diaria', 'Comunicación, Arte y Cultura II', 'Pensamiento Matemático V', 'Formación Laboral I', 'Formación Socioemocional V'],
  ['Cultura Digital III', 'Organismos, estructuras y procesos: herencia y evolución', 'Comunicación, Arte y Cultura III', 'Pensamiento Matemático VI', 'Formación Laboral II', 'Formación Socioemocional VI'],
];

export const BIS_SUBJECTS: SchoolSubject[] = moduleSubjects.flatMap((subjects, moduleIndex) => subjects.map((name, position) => ({ id: `bis-subject-${moduleIndex + 1}-${position + 1}`, module_id: BIS_MODULES[moduleIndex].id, name, position })));
