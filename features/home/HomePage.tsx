'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isToday, localToday } from '../tasks/domain';
import { useTasks } from '../tasks/use-tasks';

const modules = [
  ['Tareas', 'Organiza lo que necesita tu atención.', '/tareas'],
  ['Finanzas', 'Revisa tu dinero cuando llegue el momento.', '/finanzas'],
  ['Metas', 'Mantén cerca lo que quieres conseguir.', '/metas'],
  ['Proyectos', 'Da espacio a lo que estás construyendo.', '/proyectos'],
  ['Prepa', 'Continúa desde donde vas en tus módulos.', '/prepa'],
  ['Habitación', 'Revisa cómo está tu espacio.', '/habitacion'],
  ['Ideas', 'Guarda lo que se te ocurra.', '/ideas'],
  ['Historial', 'Mira lo que has ido haciendo.', '/historial'],
] as const;

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HomePage() {
  const [greeting, setGreeting] = useState('Buenos días');
  const { tasks } = useTasks();
  const pendingTasks = tasks.filter((task) => task.status === 'pending');
  const todayTasks = pendingTasks.filter((task) => isToday(task, localToday()));

  useEffect(() => {
    queueMicrotask(() => setGreeting(greetingForHour(new Date().getHours())));
  }, []);

  return (
    <main className="foundation-page home-page">
      <header className="foundation-page__header">
        <div>
          <p className="foundation-page__eyebrow">Mi espacio</p>
          <h1 className="foundation-page__title">Mi habitación</h1>
        </div>
      </header>
      <section className="home-page__greeting" aria-labelledby="home-greeting">
        <h2 id="home-greeting">{greeting}, Armando</h2>
        <p>¿Qué quieres organizar hoy?</p>
      </section>
      <section className="home-page__modules" aria-label="Módulos">
        {modules.map(([name, description, href], index) => (
          <Link key={href} href={href} className={`foundation-card home-module-card ${index === 5 ? 'home-module-card--accent' : ''}`}>
            <span className="home-module-card__name"><strong>{name}</strong><span>{name === 'Tareas' ? `${pendingTasks.length} ${pendingTasks.length === 1 ? 'pendiente' : 'pendientes'}` : description}</span></span>
            <span className="home-module-card__arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
      {todayTasks.length > 0 && <section className="home-page__today" aria-labelledby="home-today-title"><div className="home-page__today-heading"><h2 id="home-today-title">Hoy</h2><Link href="/tareas">Ver tareas</Link></div><div className="home-page__today-list">{todayTasks.map((task) => <Link key={task.id} href="/tareas" className="foundation-card home-today-task"><span className="home-today-task__dot" aria-hidden="true"/><span><strong>{task.title}</strong>{task.due_time && <small>{task.due_time}</small>}</span><span aria-hidden="true">›</span></Link>)}</div></section>}
    </main>
  );
}
