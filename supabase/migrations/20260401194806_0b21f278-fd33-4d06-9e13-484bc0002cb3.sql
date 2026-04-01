alter table public.lojas add column if not exists nome_assistente text;
alter table public.lojas add column if not exists instance text;
alter table public.lojas add column if not exists ativo boolean not null default true;

alter table public.procedures add column if not exists active boolean not null default true;

alter table public.patients add column if not exists birth_date date;