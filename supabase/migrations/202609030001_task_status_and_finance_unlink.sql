begin;

-- Preserve school enrollments when their optional payment movement is removed.
alter table public.subject_enrollments
  drop constraint if exists subject_enrollments_finance_transaction_fk;

alter table public.subject_enrollments
  add constraint subject_enrollments_finance_transaction_fk
  foreign key (user_id, finance_transaction_id)
  references public.finance_transactions (user_id, id)
  on delete set null (finance_transaction_id)
  deferrable initially deferred;

create index if not exists subject_enrollments_finance_transaction_idx
  on public.subject_enrollments (user_id, finance_transaction_id)
  where finance_transaction_id is not null;

-- Normalize legacy aliases before enforcing the canonical task states.
alter table public.tasks drop constraint if exists tasks_status_check;

update public.tasks
set status = case
  when lower(trim(status)) in ('completed', 'complete', 'done', 'terminada', 'terminado', 'completada', 'completado') then 'completed'
  else 'pending'
end
where status not in ('pending', 'completed');

alter table public.tasks
  add constraint tasks_status_check check (status in ('pending', 'completed'));

commit;
