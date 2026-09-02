'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Icon({ name }: { name: 'home' | 'tasks' | 'money' | 'more' }) {
  if (name === 'home') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/></svg>;
  if (name === 'tasks') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8m-4 7 1.5 1.5L12 14m4-5h1m-1 7h1"/></svg>;
  if (name === 'money') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.6-1.6-1-3-1-1.7 0-2.7.8-2.7 1.8 0 2.8 5.7 1 5.7 3.9 0 1.2-1.1 2-3 2-1.3 0-2.4-.4-3.2-1.1M12 5.5v13"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
}

export function BottomNav({
  onCreate,
  onMore,
  moreOpen,
}: {
  onCreate: () => void;
  onMore: () => void;
  moreOpen: boolean;
}) {
  const pathname = usePathname();
  const homeActive = pathname === '/';
  const tasksActive = pathname.startsWith('/tareas');
  const moneyActive = pathname.startsWith('/finanzas');

  return (
    <nav className="app-bottom-nav" aria-label="Navegación principal">
      <Link className={`app-nav-link ${homeActive ? 'active' : ''}`} href="/">
        <Icon name="home" />Inicio
      </Link>
      <Link className={`app-nav-link ${tasksActive ? 'active' : ''}`} href="/tareas">
        <Icon name="tasks" />Tareas
      </Link>
      <button className="app-nav-create" onClick={onCreate} aria-label="Crear nuevo" title="Crear nuevo">+</button>
      <Link className={`app-nav-link ${moneyActive ? 'active' : ''}`} href="/finanzas">
        <Icon name="money" />Finanzas
      </Link>
      <button className={`app-nav-more ${moreOpen ? 'active' : ''}`} onClick={onMore} aria-expanded={moreOpen}>
        <Icon name="more" />Más
      </button>
    </nav>
  );
}
