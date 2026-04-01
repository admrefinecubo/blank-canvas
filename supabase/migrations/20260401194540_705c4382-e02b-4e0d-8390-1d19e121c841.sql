create extension if not exists vector;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('platform_admin','clinic_owner','clinic_staff','clinic_receptionist');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.clinic_status AS ENUM ('ativa','inativa','cancelada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_stage AS ENUM ('novo','qualificado','orcamento','negociacao','fechado_ganho','fechado_perdido');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.visita_status AS ENUM ('agendada','confirmada','realizada','cancelada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.clinic_status not null default 'ativa',
  city text,
  state text,
  owner_name text not null,
  owner_email text not null,
  phone text,
  email text,
  primary_color text,
  logo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  clinic_id uuid references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, clinic_id)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create or replace function public.has_clinic_access(_user_id uuid, _clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and (role = 'platform_admin' or clinic_id = _clinic_id)
  )
$$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  cpf text,
  gender text,
  source text,
  stage text not null default 'lead',
  notes text,
  tags text[] not null default '{}',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text,
  price numeric(12,2) not null default 0,
  duration_minutes integer not null default 60,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  procedure_id uuid references public.procedures(id) on delete set null,
  date date not null,
  time text,
  duration_minutes integer not null default 60,
  notes text,
  professional_name text,
  status text not null default 'agendada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  total numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  payment_method text,
  installments integer not null default 1,
  notes text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_integrations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, provider)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  table_name text not null,
  action text not null,
  user_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_terms (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  content text not null,
  version integer not null default 1,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_consents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  consent_type text not null default 'treatment',
  consented boolean not null default true,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_goals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  period text not null,
  target_amount numeric(12,2) not null default 0,
  professional_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (clinic_id, period, professional_name)
);

create table if not exists public.post_procedure_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  procedure_id uuid references public.procedures(id) on delete set null,
  name text not null,
  delay_hours integer not null default 24,
  message_template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  score integer not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_installments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  amount numeric(12,2) not null default 0,
  due_date date,
  paid_at timestamptz,
  status text not null default 'pendente',
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  type text not null,
  trigger_event text not null,
  delay_days integer not null default 0,
  message_template text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  nome_loja text not null,
  nome_assistente_ia text,
  especialidades text,
  tom_voz text,
  regras_personalidade text,
  horario_inicio text,
  horario_fim text,
  endereco text,
  link_google_maps text,
  formas_pagamento text,
  politica_troca text,
  prazo_entrega text,
  frete_gratis_acima numeric(12,2),
  montagem_disponivel boolean not null default false,
  url_base_checkout text,
  desconto_carrinho_abandonado numeric(5,2),
  desconto_promocao_nao_respondida numeric(5,2),
  plataforma_ecommerce text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  nome text not null,
  descricao text,
  categoria text,
  tags text,
  especificacoes text,
  preco_original numeric(12,2) not null default 0,
  preco_promocional numeric(12,2),
  variacoes text,
  estoque_disponivel boolean not null default true,
  foto_principal text,
  foto_detalhe text,
  video_url text,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  nome text,
  telefone text not null,
  etapa_pipeline public.lead_stage not null default 'novo',
  interesse text,
  ultima_interacao timestamptz,
  origem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.historico_mensagens (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  telefone text not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  tipo text not null,
  agendado_para timestamptz not null,
  enviado boolean not null default false,
  enviado_em timestamptz,
  mensagem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  data_visita timestamptz not null,
  status public.visita_status not null default 'agendada',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.midias_enviadas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  produto_id uuid references public.produtos(id) on delete set null,
  tipo text not null default 'foto',
  url text not null,
  legenda text,
  enviado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_clinic_id on public.patients(clinic_id);
create index if not exists idx_appointments_clinic_id on public.appointments(clinic_id);
create index if not exists idx_budgets_clinic_id on public.budgets(clinic_id);
create index if not exists idx_lojas_clinic_id on public.lojas(clinic_id);
create index if not exists idx_produtos_loja_id on public.produtos(loja_id);
create index if not exists idx_leads_loja_id on public.leads(loja_id);
create index if not exists idx_historico_mensagens_loja_id on public.historico_mensagens(loja_id);
create index if not exists idx_historico_mensagens_lead_id on public.historico_mensagens(lead_id);
create index if not exists idx_follow_ups_loja_id on public.follow_ups(loja_id);
create index if not exists idx_visitas_loja_id on public.visitas(loja_id);
create index if not exists idx_midias_enviadas_loja_id on public.midias_enviadas(loja_id);

create or replace function public.match_produtos(
  query_embedding vector(1536),
  loja_id_param uuid default null,
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  loja_id uuid,
  nome text,
  descricao text,
  categoria text,
  tags text,
  especificacoes text,
  preco_original numeric,
  preco_promocional numeric,
  variacoes text,
  estoque_disponivel boolean,
  foto_principal text,
  foto_detalhe text,
  video_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.loja_id,
    p.nome,
    p.descricao,
    p.categoria,
    p.tags,
    p.especificacoes,
    p.preco_original,
    p.preco_promocional,
    p.variacoes,
    p.estoque_disponivel,
    p.foto_principal,
    p.foto_detalhe,
    p.video_url,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.produtos p
  where p.embedding is not null
    and (loja_id_param is null or p.loja_id = loja_id_param)
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

alter table public.clinics enable row level security;
alter table public.user_roles enable row level security;
alter table public.patients enable row level security;
alter table public.procedures enable row level security;
alter table public.appointments enable row level security;
alter table public.budgets enable row level security;
alter table public.clinic_integrations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.consent_terms enable row level security;
alter table public.patient_consents enable row level security;
alter table public.revenue_goals enable row level security;
alter table public.post_procedure_templates enable row level security;
alter table public.nps_responses enable row level security;
alter table public.financial_installments enable row level security;
alter table public.automations enable row level security;
alter table public.lojas enable row level security;
alter table public.produtos enable row level security;
alter table public.leads enable row level security;
alter table public.historico_mensagens enable row level security;
alter table public.follow_ups enable row level security;
alter table public.visitas enable row level security;
alter table public.midias_enviadas enable row level security;

drop policy if exists "platform admins can manage clinics" on public.clinics;
create policy "platform admins can manage clinics" on public.clinics for all to authenticated using (public.has_role(auth.uid(), 'platform_admin')) with check (public.has_role(auth.uid(), 'platform_admin'));

drop policy if exists "users can view own roles" on public.user_roles;
create policy "users can view own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'platform_admin'));

drop policy if exists "platform admins can manage roles" on public.user_roles;
create policy "platform admins can manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'platform_admin')) with check (public.has_role(auth.uid(), 'platform_admin'));

create or replace function public.create_clinic_access_policy(_table_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format('drop policy if exists "%s clinic access" on public.%I', _table_name, _table_name);
  execute format('create policy "%s clinic access" on public.%I for all to authenticated using (public.has_clinic_access(auth.uid(), clinic_id)) with check (public.has_clinic_access(auth.uid(), clinic_id))', _table_name, _table_name);
end;
$$;

select public.create_clinic_access_policy('patients');
select public.create_clinic_access_policy('procedures');
select public.create_clinic_access_policy('appointments');
select public.create_clinic_access_policy('budgets');
select public.create_clinic_access_policy('clinic_integrations');
select public.create_clinic_access_policy('audit_logs');
select public.create_clinic_access_policy('consent_terms');
select public.create_clinic_access_policy('patient_consents');
select public.create_clinic_access_policy('revenue_goals');
select public.create_clinic_access_policy('post_procedure_templates');
select public.create_clinic_access_policy('nps_responses');
select public.create_clinic_access_policy('financial_installments');
select public.create_clinic_access_policy('automations');

drop function if exists public.create_clinic_access_policy(text);

create or replace function public.has_loja_access(_user_id uuid, _loja_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lojas l
    left join public.user_roles ur on ur.clinic_id = l.clinic_id
    where l.id = _loja_id
      and ur.user_id = _user_id
      and (ur.role = 'platform_admin' or ur.clinic_id = l.clinic_id)
  )
$$;

drop policy if exists "lojas access" on public.lojas;
create policy "lojas access" on public.lojas for all to authenticated using (public.has_loja_access(auth.uid(), id)) with check (public.has_loja_access(auth.uid(), id));

drop policy if exists "produtos access" on public.produtos;
create policy "produtos access" on public.produtos for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop policy if exists "leads access" on public.leads;
create policy "leads access" on public.leads for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop policy if exists "historico_mensagens access" on public.historico_mensagens;
create policy "historico_mensagens access" on public.historico_mensagens for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop policy if exists "follow_ups access" on public.follow_ups;
create policy "follow_ups access" on public.follow_ups for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop policy if exists "visitas access" on public.visitas;
create policy "visitas access" on public.visitas for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop policy if exists "midias_enviadas access" on public.midias_enviadas;
create policy "midias_enviadas access" on public.midias_enviadas for all to authenticated using (public.has_loja_access(auth.uid(), loja_id)) with check (public.has_loja_access(auth.uid(), loja_id));

drop trigger if exists set_updated_at_clinics on public.clinics;
create trigger set_updated_at_clinics before update on public.clinics for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_patients on public.patients;
create trigger set_updated_at_patients before update on public.patients for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_procedures on public.procedures;
create trigger set_updated_at_procedures before update on public.procedures for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_appointments on public.appointments;
create trigger set_updated_at_appointments before update on public.appointments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_budgets on public.budgets;
create trigger set_updated_at_budgets before update on public.budgets for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_clinic_integrations on public.clinic_integrations;
create trigger set_updated_at_clinic_integrations before update on public.clinic_integrations for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_consent_terms on public.consent_terms;
create trigger set_updated_at_consent_terms before update on public.consent_terms for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_revenue_goals on public.revenue_goals;
create trigger set_updated_at_revenue_goals before update on public.revenue_goals for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_post_procedure_templates on public.post_procedure_templates;
create trigger set_updated_at_post_procedure_templates before update on public.post_procedure_templates for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_financial_installments on public.financial_installments;
create trigger set_updated_at_financial_installments before update on public.financial_installments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_automations on public.automations;
create trigger set_updated_at_automations before update on public.automations for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_lojas on public.lojas;
create trigger set_updated_at_lojas before update on public.lojas for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_produtos on public.produtos;
create trigger set_updated_at_produtos before update on public.produtos for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_leads on public.leads;
create trigger set_updated_at_leads before update on public.leads for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_follow_ups on public.follow_ups;
create trigger set_updated_at_follow_ups before update on public.follow_ups for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_visitas on public.visitas;
create trigger set_updated_at_visitas before update on public.visitas for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('clinic-assets', 'clinic-assets', true)
on conflict (id) do nothing;

drop policy if exists "clinic assets public read" on storage.objects;
create policy "clinic assets public read" on storage.objects for select using (bucket_id = 'clinic-assets');

drop policy if exists "clinic assets authenticated write" on storage.objects;
create policy "clinic assets authenticated write" on storage.objects for insert to authenticated with check (bucket_id = 'clinic-assets');

drop policy if exists "clinic assets authenticated update" on storage.objects;
create policy "clinic assets authenticated update" on storage.objects for update to authenticated using (bucket_id = 'clinic-assets') with check (bucket_id = 'clinic-assets');