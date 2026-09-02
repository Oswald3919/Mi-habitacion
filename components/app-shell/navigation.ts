export const MORE_LINKS = [
  ['Tareas', '/tareas'],
  ['Finanzas', '/finanzas'],
  ['Metas', '/metas'],
  ['Proyectos', '/proyectos'],
  ['Prepa', '/prepa'],
  ['Habitación', '/habitacion'],
  ['Ideas', '/ideas'],
  ['Historial', '/historial'],
  ['Ajustes', '/ajustes'],
] as const;

export const GLOBAL_CREATE_OPTIONS = ['Tarea', 'Movimiento financiero', 'Meta', 'Proyecto', 'Nota', 'Idea'] as const;

const CONTEXTUAL_CREATE_OPTIONS: Array<[string, readonly string[]]> = [
  ['/finanzas', ['Gasto', 'Ingreso', 'Ahorro', 'Pago']],
  ['/proyectos', ['Tarea', 'Nota', 'Archivo', 'Proyecto']],
  ['/prepa', ['Configurar materia', 'Nota', 'Registrar calificación']],
  ['/habitacion', ['Tarea', 'Zona', 'Elemento']],
];

export function getCreateOptions(pathname: string): readonly string[] {
  return CONTEXTUAL_CREATE_OPTIONS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? GLOBAL_CREATE_OPTIONS;
}
