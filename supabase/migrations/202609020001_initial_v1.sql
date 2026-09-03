begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_modules (
  id text primary key,
  number smallint not null unique check (number between 1 and 6),
  name text not null,
  position smallint not null
);
create table if not exists public.school_subjects (
  id text primary key,
  module_id text not null references public.school_modules(id),
  name text not null,
  position smallint not null,
  unique (module_id, position)
);

create table if not exists public.projects (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, status text not null check (status in ('idea','planning','active','paused','completed')),
  type text not null, priority text not null check (priority in ('none','important','main')),
  objective text not null default '', target_date date, icon text not null, color text not null, notes text,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id)
);
create table if not exists public.goals (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text not null check (type in ('money','quantity','manual')),
  priority text not null check (priority in ('none','important','main')), progress numeric not null default 0,
  objective numeric not null check (objective >= 0), target_date date, project_id uuid,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id),
  foreign key(user_id,project_id) references public.projects(user_id,id) on delete restrict
);
create table if not exists public.room_zones (
  user_id uuid not null references auth.users(id) on delete cascade, id text not null,
  name text not null, status text check (status is null or status in ('ok','review','attention')),
  updated_at timestamptz, position smallint not null, primary key(user_id,id)
);
create table if not exists public.room_items (
  user_id uuid not null references auth.users(id) on delete cascade, id text not null, room_zone_id text not null,
  name text not null, status text not null check (status in ('ok','review','attention')),
  updated_at timestamptz, position smallint not null, primary key(user_id,id),
  foreign key(user_id,room_zone_id) references public.room_zones(user_id,id) on delete cascade
);
create table if not exists public.subject_enrollments (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null references public.school_subjects(id), start_date date not null,
  duration_weeks smallint not null check (duration_weeks in (2,3,4)), final_grade numeric check (final_grade between 0 and 10),
  paid_at timestamptz, finance_transaction_id uuid, created_at timestamptz not null, updated_at timestamptz not null,
  unique(user_id,id)
);
create table if not exists public.finance_accounts (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, opening_balance numeric not null default 0, created_at timestamptz not null, updated_at timestamptz not null,
  unique(user_id,id)
);
create table if not exists public.finance_saving_goals (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, target_amount numeric not null check (target_amount >= 0), target_date date,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id)
);
create table if not exists public.recurring_payments (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, amount numeric not null check (amount > 0), category text not null,
  account_id uuid not null, payment_method text not null check (payment_method in ('cash','card','transfer','other')),
  next_due_date date not null, note text, active boolean not null default true, last_paid_at timestamptz,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id),
  foreign key(user_id,account_id) references public.finance_accounts(user_id,id) on delete cascade
);
create table if not exists public.finance_transactions (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0), type text not null check (type in ('income','expense','saving')),
  category text not null, account_id uuid not null, date date not null,
  payment_method text not null check (payment_method in ('cash','card','transfer','other')), note text,
  project_id uuid, subject_enrollment_id uuid, saving_goal_id uuid, recurring_payment_id uuid,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id),
  foreign key(user_id,account_id) references public.finance_accounts(user_id,id) on delete cascade,
  foreign key(user_id,project_id) references public.projects(user_id,id) on delete restrict,
  foreign key(user_id,subject_enrollment_id) references public.subject_enrollments(user_id,id) on delete restrict,
  foreign key(user_id,saving_goal_id) references public.finance_saving_goals(user_id,id) on delete restrict,
  foreign key(user_id,recurring_payment_id) references public.recurring_payments(user_id,id) on delete restrict
);
alter table public.subject_enrollments drop constraint if exists subject_enrollments_finance_transaction_fk;
alter table public.subject_enrollments add constraint subject_enrollments_finance_transaction_fk foreign key(user_id,finance_transaction_id) references public.finance_transactions(user_id,id) deferrable initially deferred;
create table if not exists public.tasks (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0), status text not null check (status in ('pending','completed')),
  due_date date, due_time time, priority text not null check (priority in ('none','normal','urgent')), area text not null,
  notes text, related_label text, project_id uuid, goal_id uuid, subject_enrollment_id uuid, room_item_id text,
  created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id),
  foreign key(user_id,project_id) references public.projects(user_id,id) on delete restrict,
  foreign key(user_id,goal_id) references public.goals(user_id,id) on delete restrict,
  foreign key(user_id,subject_enrollment_id) references public.subject_enrollments(user_id,id) on delete restrict,
  foreign key(user_id,room_item_id) references public.room_items(user_id,id) on delete restrict
);
create table if not exists public.ideas (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  content text not null, status text not null check (status in ('active','archived','converted')),
  area text, project_id uuid, converted_entity_type text check (converted_entity_type is null or converted_entity_type in ('task','goal','project')),
  converted_entity_id uuid, created_at timestamptz not null, updated_at timestamptz not null, unique(user_id,id),
  foreign key(user_id,project_id) references public.projects(user_id,id) on delete restrict
);
create table if not exists public.room_status_history (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('zone','item')), entity_id text not null,
  previous_status text not null check (previous_status in ('ok','review','attention')),
  status text not null check (status in ('ok','review','attention')), changed_at timestamptz not null,
  source text not null check (source in ('user','day_rollover')), unique(user_id,id)
);
create table if not exists public.room_daily_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade, date date not null,
  status text not null check (status in ('ok','review','attention')), zones jsonb not null,
  primary key(user_id,date)
);
create table if not exists public.activity_log (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  action text not null, entity_type text not null, entity_id text not null,
  occurred_at timestamptz not null, metadata jsonb not null default '{}'::jsonb, unique(user_id,id)
);
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb, room_current_date date not null default current_date,
  updated_at timestamptz not null default now()
);
create table if not exists public.local_migrations (
  user_id uuid not null references auth.users(id) on delete cascade, migration_key text not null,
  completed_at timestamptz not null default now(), source_schema_version integer not null,
  primary key(user_id,migration_key)
);

create index if not exists tasks_user_due_idx on public.tasks(user_id,status,due_date);
create index if not exists transactions_user_date_idx on public.finance_transactions(user_id,date desc);
create index if not exists activity_user_date_idx on public.activity_log(user_id,occurred_at desc);
create index if not exists enrollments_user_start_idx on public.subject_enrollments(user_id,start_date);
create index if not exists room_history_user_date_idx on public.room_status_history(user_id,changed_at desc);

insert into public.school_modules(id,number,name,position) values
('bis-module-1',1,'Módulo 1',0),('bis-module-2',2,'Módulo 2',1),('bis-module-3',3,'Módulo 3',2),
('bis-module-4',4,'Módulo 4',3),('bis-module-5',5,'Módulo 5',4),('bis-module-6',6,'Módulo 6',5)
on conflict(id) do update set name=excluded.name, position=excluded.position;

insert into public.school_subjects(id,module_id,name,position) values
('bis-subject-1-1','bis-module-1','Lengua y Comunicación I',0),('bis-subject-1-2','bis-module-1','Inglés I',1),('bis-subject-1-3','bis-module-1','Pensamiento Matemático I',2),('bis-subject-1-4','bis-module-1','Cultura Digital I',3),('bis-subject-1-5','bis-module-1','Humanidades I',4),('bis-subject-1-6','bis-module-1','Ciencias Sociales I',5),('bis-subject-1-7','bis-module-1','La materia y sus interacciones',6),('bis-subject-1-8','bis-module-1','Laboratorio de Investigación',7),('bis-subject-1-9','bis-module-1','Recursos Socioemocionales I',8),
('bis-subject-2-1','bis-module-2','Lengua y Comunicación II',0),('bis-subject-2-2','bis-module-2','Inglés II',1),('bis-subject-2-3','bis-module-2','Pensamiento Matemático II',2),('bis-subject-2-4','bis-module-2','Cultura Digital II',3),('bis-subject-2-5','bis-module-2','Humanidades II',4),('bis-subject-2-6','bis-module-2','Ciencias Sociales II',5),('bis-subject-2-7','bis-module-2','Conservación de la energía y su interacción con la materia',6),('bis-subject-2-8','bis-module-2','Taller de Ciencias I',7),('bis-subject-2-9','bis-module-2','Recursos Socioemocionales II',8),
('bis-subject-3-1','bis-module-3','Lengua y Comunicación III',0),('bis-subject-3-2','bis-module-3','Inglés III',1),('bis-subject-3-3','bis-module-3','Pensamiento Matemático III',2),('bis-subject-3-4','bis-module-3','Humanidades III',3),('bis-subject-3-5','bis-module-3','Ecosistemas: interacciones, energía y dinámica',4),('bis-subject-3-6','bis-module-3','Conciencia Histórica I',5),('bis-subject-3-7','bis-module-3','Taller de Ciencias II',6),('bis-subject-3-8','bis-module-3','Formación Socioemocional III',7),
('bis-subject-4-1','bis-module-4','Inglés IV',0),('bis-subject-4-2','bis-module-4','Ciencias Sociales III',1),('bis-subject-4-3','bis-module-4','Conciencia Histórica II',2),('bis-subject-4-4','bis-module-4','Reacciones químicas: conservación de la materia',3),('bis-subject-4-5','bis-module-4','Pensamiento Matemático IV',4),('bis-subject-4-6','bis-module-4','Comunicación, Arte y Cultura I',5),('bis-subject-4-7','bis-module-4','Formación Socioemocional IV',6),
('bis-subject-5-1','bis-module-5','Conciencia Histórica III',0),('bis-subject-5-2','bis-module-5','La energía en los procesos de la vida diaria',1),('bis-subject-5-3','bis-module-5','Comunicación, Arte y Cultura II',2),('bis-subject-5-4','bis-module-5','Pensamiento Matemático V',3),('bis-subject-5-5','bis-module-5','Formación Laboral I',4),('bis-subject-5-6','bis-module-5','Formación Socioemocional V',5),
('bis-subject-6-1','bis-module-6','Cultura Digital III',0),('bis-subject-6-2','bis-module-6','Organismos, estructuras y procesos: herencia y evolución',1),('bis-subject-6-3','bis-module-6','Comunicación, Arte y Cultura III',2),('bis-subject-6-4','bis-module-6','Pensamiento Matemático VI',3),('bis-subject-6-5','bis-module-6','Formación Laboral II',4),('bis-subject-6-6','bis-module-6','Formación Socioemocional VI',5)
on conflict(id) do update set name=excluded.name,module_id=excluded.module_id,position=excluded.position;

do $$ declare t text; begin
  foreach t in array array['profiles','projects','goals','room_zones','room_items','subject_enrollments','finance_accounts','finance_saving_goals','recurring_payments','finance_transactions','tasks','ideas','room_status_history','room_daily_snapshots','activity_log','user_settings','local_migrations'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
alter table public.school_modules enable row level security;
alter table public.school_subjects enable row level security;

create or replace function public.is_owner(row_user_id uuid) returns boolean language sql stable security invoker set search_path='' as $$ select auth.uid() = row_user_id $$;
do $$ declare t text; begin
  foreach t in array array['projects','goals','room_zones','room_items','subject_enrollments','finance_accounts','finance_saving_goals','recurring_payments','finance_transactions','tasks','ideas','room_status_history','room_daily_snapshots','activity_log','user_settings','local_migrations'] loop
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists catalog_read on public.school_modules;
create policy catalog_read on public.school_modules for select to authenticated using (true);
drop policy if exists catalog_read on public.school_subjects;
create policy catalog_read on public.school_subjects for select to authenticated using (true);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

commit;
