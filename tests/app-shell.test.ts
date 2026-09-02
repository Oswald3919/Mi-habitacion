import { describe, expect, it } from 'vitest';
import { getCreateOptions, MORE_LINKS } from '../components/app-shell/navigation';

describe('app shell navigation', () => {
  it('exposes all destinations in Más', () => {
    expect(MORE_LINKS.map(([, href]) => href)).toEqual([
      '/metas', '/proyectos', '/prepa', '/habitacion', '/ideas', '/historial', '/ajustes',
    ]);
  });

  it('selects create actions according to the current context', () => {
    expect(getCreateOptions('/')).toEqual(['Tarea', 'Movimiento financiero', 'Meta', 'Proyecto', 'Nota', 'Idea']);
    expect(getCreateOptions('/finanzas')).toEqual(['Gasto', 'Ingreso', 'Ahorro', 'Pago']);
    expect(getCreateOptions('/proyectos/alpha')).toEqual(['Tarea', 'Nota', 'Archivo', 'Proyecto']);
    expect(getCreateOptions('/habitacion')).toEqual(['Tarea', 'Zona', 'Elemento']);
  });
});
