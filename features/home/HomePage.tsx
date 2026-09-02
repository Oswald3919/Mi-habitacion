'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
            <span className="home-module-card__name"><strong>{name}</strong><span>{description}</span></span>
            <span className="home-module-card__arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
