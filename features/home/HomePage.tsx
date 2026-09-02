'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isToday, localToday } from '../tasks/domain';
import { useTasks } from '../tasks/use-tasks';
import { useFinance } from '../finance/use-finance';
import { calculateAvailableBalance } from '../finance/domain';
import { useProjects } from '../projects/use-projects';
import { PROJECT_STATUS_LABEL } from '../projects/domain';
import { useGoals } from '../goals/use-goals';
import { goalPercentage } from '../goals/domain';

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
  const { accounts, transactions, payments } = useFinance();
  const { projects } = useProjects();
  const { goals } = useGoals();
  const pendingTasks = tasks.filter((task) => task.status === 'pending');
  const todayTasks = pendingTasks.filter((task) => isToday(task, localToday()));
  const activeProjects = projects.filter((project) => project.status === 'active');
  const activeGoals = goals.filter((goal) => goalPercentage(goal) < 100);
  const upcomingPayments = payments.filter((payment) => payment.active).slice(0, 3);
  const available = calculateAvailableBalance(accounts, transactions);
  const moduleDetail = (name: string, fallback: string) => {
    if (name === 'Tareas') return `${pendingTasks.length} ${pendingTasks.length === 1 ? 'pendiente' : 'pendientes'}`;
    if (name === 'Finanzas') return accounts.length ? `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(available)} disponibles` : 'Aún sin cuentas';
    if (name === 'Proyectos') return `${activeProjects.length} ${activeProjects.length === 1 ? 'activo' : 'activos'}`;
    if (name === 'Metas') return `${activeGoals.length} ${activeGoals.length === 1 ? 'activa' : 'activas'}`;
    return fallback;
  };

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
            <span className="home-module-card__name"><strong>{name}</strong><span>{moduleDetail(name, description)}</span></span>
            <span className="home-module-card__arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
      {todayTasks.length > 0 && <section className="home-page__today" aria-labelledby="home-today-title"><div className="home-page__today-heading"><h2 id="home-today-title">Hoy</h2><Link href="/tareas">Ver tareas</Link></div><div className="home-page__today-list">{todayTasks.map((task) => <Link key={task.id} href="/tareas" className="foundation-card home-today-task"><span className="home-today-task__dot" aria-hidden="true"/><span><strong>{task.title}</strong>{task.due_time && <small>{task.due_time}</small>}</span><span aria-hidden="true">›</span></Link>)}</div></section>}
      {upcomingPayments.length > 0 && <section className="home-page__today"><div className="home-page__today-heading"><h2>Próximos pagos</h2><Link href="/finanzas">Ver finanzas</Link></div><div className="home-page__today-list">{upcomingPayments.map((payment) => <Link key={payment.id} href="/finanzas" className="foundation-card home-today-task"><span className="home-today-task__dot"/><span><strong>{payment.name}</strong><small>{payment.next_due_date}</small></span><strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(payment.amount)}</strong></Link>)}</div></section>}
      {activeProjects.length > 0 && <section className="home-page__today"><div className="home-page__today-heading"><h2>Proyectos activos</h2><Link href="/proyectos">Ver proyectos</Link></div><div className="home-page__today-list">{activeProjects.slice(0, 3).map((project) => <Link key={project.id} href="/proyectos" className="foundation-card home-today-task"><span>{project.icon}</span><span><strong>{project.name}</strong><small>{PROJECT_STATUS_LABEL[project.status]}</small></span><span>›</span></Link>)}</div></section>}
      {activeGoals.length > 0 && <section className="home-page__today"><div className="home-page__today-heading"><h2>Metas activas</h2><Link href="/metas">Ver metas</Link></div><div className="home-page__today-list">{activeGoals.slice(0, 3).map((goal) => <Link key={goal.id} href="/metas" className="foundation-card home-today-task"><span className="home-today-task__dot"/><span><strong>{goal.name}</strong><small>{goal.progress} de {goal.objective}</small></span><strong>{goalPercentage(goal)}%</strong></Link>)}</div></section>}
    </main>
  );
}
