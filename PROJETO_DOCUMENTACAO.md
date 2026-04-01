# Documentação Completa do Projeto — CRM SaaS Multi-Tenant

> **Última atualização:** 2026-03-28
> **Nicho:** Lojas de Colchões e Móveis (pivotado de clínicas odontológicas)
> **Nome comercial:** LojaADS — IA de Vendas

---

## 1. Visão Geral

CRM SaaS multi-tenant com white-label, projetado para lojas de colchões e móveis. Cada loja (tenant) tem seus próprios dados isolados via Row-Level Security (RLS). Um `platform_admin` gerencia todas as lojas.

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui (Radix) |
| Gráficos | Recharts |
| Roteamento | React Router DOM v6 |
| Estado servidor | TanStack React Query v5 |
| Backend | Supabase (Auth, Database, Edge Functions, Storage) |
| PWA | vite-plugin-pwa (instalável, service workers) |
| Deploy | Lovable Cloud |

### Dependências Principais

```
@supabase/supabase-js, @tanstack/react-query, react-router-dom,
recharts, react-hook-form, zod, @hookform/resolvers, date-fns,
lucide-react, sonner, framer-motion (via shadcn), cmdk, vaul,
vite-plugin-pwa
```

---

## 2. Arquitetura Multi-Tenant

### Conceito

- Cada **loja** é um registro na tabela `clinics` (nome legado do pivô de clínicas)
- Todos os dados (clientes, orçamentos, visitas, etc.) possuem `clinic_id` como FK
- RLS garante isolamento: usuários só acessam dados da sua loja
- `platform_admin` tem acesso total via função `has_role()`

### White-Label

Cada loja pode customizar:
- **Nome** exibido no sidebar
- **Logo** (upload para bucket `clinic-assets`)
- **Cor primária** (HSL string, ex: `"195 100% 50%"`)
- **Favicon** (opcional)

Implementado via `WhiteLabelContext` que aplica CSS variables dinâmicas:
```
--primary, --ring, --sidebar-primary, --sidebar-ring
```

---

## 3. Autenticação e Autorização

### Roles (Enum `app_role`)

| Role | Descrição | Permissões |
|---|---|---|
| `platform_admin` | Super admin da plataforma | Acesso total, gerencia lojas, impersona lojas |
| `clinic_owner` | Dono da loja | CRUD completo na sua loja |
| `clinic_staff` | Funcionário/Vendedor | CRUD na sua loja |
| `clinic_receptionist` | Recepcionista | CRUD na sua loja |

### Tabela `user_roles`

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- referencia auth.users (sem FK explícita)
  role app_role NOT NULL,
  clinic_id uuid REFERENCES clinics(id)  -- NULL para platform_admin
);
```

**RLS:**
- Usuários podem ver seus próprios roles (`auth.uid() = user_id`)
- Platform admins podem gerenciar todos os roles

### Função `has_role()` (SECURITY DEFINER)

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

Usada em TODAS as RLS policies para verificar `platform_admin`.

### Impersonação

O `platform_admin` pode "impersonar" uma loja para ver o sistema como o dono veria:
- `impersonateClinic(clinicId)` — salva no `localStorage`
- `clearImpersonation()` — volta ao modo admin
- Banner amarelo aparece no topo quando impersonando

### Fluxo de Login

1. `signInWithPassword(email, password)`
2. Busca roles do usuário
3. Se NÃO é admin, verifica se a loja está ativa (status != `cancelada` ou `inativa`)
4. Se loja inativa → sign out automático + mensagem de erro
5. Se OK → redireciona para `/dashboard`

### AuthContext (valores expostos)

```typescript
{
  session, user, roles, loading,
  isPlatformAdmin, clinicId,
  impersonatedClinicId, impersonateClinic, clearImpersonation,
  signIn, signOut
}
```

---

## 4. Banco de Dados — Tabelas

### 4.1 `clinics` — Lojas

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| name | text | — | Nome da loja |
| owner_name | text | — | Nome do responsável |
| owner_email | text | — | Email do responsável |
| phone | text | null | Telefone |
| email | text | null | Email da loja |
| city | text | null | Cidade |
| state | text | null | Estado (UF) |
| status | text | 'ativa' | ativa, inativa, cancelada |
| primary_color | text | '24 95% 53%' | Cor HSL para white-label |
| logo_url | text | null | URL do logo no storage |
| notes | text | null | Observações internas |
| created_at | timestamptz | now() | — |

**RLS:**
- `clinic_owner` pode ver sua própria loja
- `platform_admin` pode tudo (ALL)

### 4.2 `patients` — Clientes / Leads

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| name | text | — | Nome completo |
| email | text | null | Email |
| phone | text | null | Telefone |
| cpf | text | null | CPF |
| gender | text | null | Gênero |
| birth_date | date | null | Data nascimento |
| source | text | 'manual' | Origem (manual, whatsapp, website, indicacao, instagram, facebook, google) |
| stage | text | 'lead' | Estágio no funil |
| tags | text[] | '{}' | Tags customizadas |
| notes | text | null | Observações |
| utm_source | text | null | UTM Source |
| utm_medium | text | null | UTM Medium |
| utm_campaign | text | null | UTM Campaign |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

**Stages do Funil (UI):**

| Key | Label UI |
|---|---|
| lead | Novo Lead |
| contacted | Contatado |
| visit_scheduled | Visita Agendada |
| measurement | Medição / Projeto |
| budget_sent | Orçamento Enviado |
| negotiation | Negociação |
| approved | Aprovado / Venda |
| lost | Perdido |

**Tags sugeridas na UI:** VIP, Reforma, Mudança, Colchão, Sala Planejada, Quarto, Escritório, Indicação

**RLS:** CRUD completo para usuários da mesma `clinic_id` + platform_admin

### 4.3 `appointments` — Visitas / Agendamentos

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| patient_id | uuid | — | FK → patients |
| procedure_id | uuid | null | FK → procedures |
| date | date | — | Data da visita |
| time | time | — | Horário |
| duration_minutes | integer | 60 | Duração em minutos |
| professional_name | text | null | Nome do vendedor |
| status | text | 'agendado' | agendado, confirmado, realizado, cancelado, no-show |
| notes | text | null | Observações |
| created_at | timestamptz | now() | — |

**RLS:** CRUD para mesma clinic_id + platform_admin

### 4.4 `procedures` — Catálogo de Produtos

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| name | text | — | Nome do produto |
| description | text | null | Descrição |
| category | text | null | Categoria (Colchões, Salas, Quartos, etc.) |
| price | numeric | 0 | Preço em R$ |
| duration_minutes | integer | 60 | Campo legado (não usado na UI moveleira) |
| active | boolean | true | Produto ativo? |
| created_at | timestamptz | now() | — |

**RLS:** CRUD para mesma clinic_id + platform_admin

### 4.5 `budgets` — Orçamentos

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| patient_id | uuid | — | FK → patients |
| total | numeric | 0 | Valor total bruto |
| discount | numeric | 0 | Desconto em R$ (absoluto, não %) |
| installments | integer | 1 | Número de parcelas |
| payment_method | text | null | Forma de pagamento |
| status | text | 'pendente' | pendente, enviado, negociacao, aprovado, recusado |
| loss_reason | text | null | Motivo da perda |
| notes | text | null | Observações |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

**RLS:** CRUD para mesma clinic_id + platform_admin

### 4.6 `budget_items` — Itens do Orçamento

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| budget_id | uuid | — | FK → budgets |
| procedure_id | uuid | null | FK → procedures |
| name | text | — | Nome do item |
| unit_price | numeric | 0 | Preço unitário |
| quantity | integer | 1 | Quantidade |
| created_at | timestamptz | now() | — |

**RLS:** Acesso via JOIN com budgets → clinic_id + platform_admin

### 4.7 `financial_installments` — Parcelas Financeiras

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| budget_id | uuid | — | FK → budgets |
| patient_id | uuid | — | FK → patients |
| installment_number | integer | 1 | Número da parcela |
| total_installments | integer | 1 | Total de parcelas |
| amount | numeric | 0 | Valor da parcela |
| due_date | date | — | Data de vencimento |
| status | text | 'pendente' | pendente, pago, atrasado |
| payment_method | text | null | Método de pagamento |
| paid_at | timestamptz | null | Data do pagamento |
| notes | text | null | Observações |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

**Geração automática:** Trigger `generate_installments_on_approval()` cria parcelas quando budget.status muda para 'aprovado'.

**RLS:** CRUD para mesma clinic_id + platform_admin

### 4.8 `automations` — Automações de Comunicação

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| name | text | — | Nome da automação |
| trigger_event | text | — | Evento gatilho |
| type | text | — | Tipo (whatsapp, email, sms) |
| message_template | text | null | Template da mensagem |
| delay_days | integer | 0 | Dias de atraso após trigger |
| active | boolean | true | Ativa? |
| created_at | timestamptz | now() | — |

**Triggers disponíveis na UI:**

| Key | Label |
|---|---|
| post_delivery | Pós-entrega |
| nps_request | Pesquisa Satisfação |
| reactivation | Reativação |
| birthday | Aniversário |
| follow_up_visit | Follow-up pós-visita |
| budget_reminder | Lembrete de orçamento |
| no_show | Visita não realizada |
| repurchase | Sugestão de recompra |

**RLS:** CRUD para mesma clinic_id + platform_admin

### 4.9 `nps_responses` — Pós-Venda / Satisfação

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| patient_id | uuid | — | FK → patients |
| score | integer | — | Nota 0-10 |
| comment | text | null | Comentário |
| created_at | timestamptz | now() | — |

**RLS:** INSERT + SELECT para mesma clinic_id (sem UPDATE/DELETE)

### 4.10 `revenue_goals` — Metas de Faturamento

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| period | text | — | Período (ex: "2026-03") |
| target_amount | numeric | 0 | Meta em R$ |
| professional_name | text | null | Meta por vendedor (opcional) |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

**RLS:** ALL para mesma clinic_id + platform_admin

### 4.11 `clinic_integrations` — Integrações Externas

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| provider | text | — | evolution_api, google_calendar |
| status | text | 'disconnected' | disconnected, pending, connected |
| config | jsonb | '{}' | Configurações (api_url, api_key, instance_name, etc.) |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

**RLS:** ALL para mesma clinic_id + platform_admin

### 4.12 `consent_terms` — Termos LGPD

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| title | text | 'Termo de Consentimento' | Título |
| content | text | — | Conteúdo do termo |
| version | integer | 1 | Versão |
| active | boolean | true | Ativo? |
| created_at | timestamptz | now() | — |

### 4.13 `patient_consents` — Consentimentos de Clientes

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| patient_id | uuid | — | FK → patients |
| consent_term_id | uuid | null | FK → consent_terms |
| consent_type | text | 'treatment' | Tipo |
| consented | boolean | false | Aceito? |
| consented_at | timestamptz | now() | Data do aceite |
| ip_address | text | null | IP |
| revoked_at | timestamptz | null | Data da revogação |

### 4.14 `audit_logs` — Logs de Auditoria

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | null | FK → clinics |
| user_id | uuid | null | Quem fez a ação |
| user_email | text | null | Email de quem fez |
| action | text | — | INSERT, UPDATE, DELETE |
| table_name | text | — | Nome da tabela |
| record_id | text | null | ID do registro |
| old_data | jsonb | null | Dados anteriores |
| new_data | jsonb | null | Dados novos |
| created_at | timestamptz | now() | — |

**RLS:** Apenas SELECT para mesma clinic_id + platform_admin

### 4.15 `post_procedure_templates` — Templates Pós-Entrega

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| clinic_id | uuid | — | FK → clinics |
| name | text | — | Nome do template |
| procedure_id | uuid | null | FK → procedures (opcional) |
| message_template | text | — | Template da mensagem |
| delay_hours | integer | 24 | Horas de atraso |
| active | boolean | true | Ativo? |
| created_at | timestamptz | now() | — |

**RLS:** ALL para mesma clinic_id + platform_admin

---

## 5. Database Functions & Triggers

### 5.1 `has_role(_user_id, _role)` → boolean
- **Tipo:** SECURITY DEFINER
- **Uso:** Todas as RLS policies para verificar platform_admin
- **Evita:** Recursão em RLS

### 5.2 `on_appointment_completed()` — Trigger
- **Quando:** UPDATE em `appointments`
- **Lógica:** Se `status` muda para `'realizado'`, atualiza `patients.stage` para `'em_tratamento'`
- **Nota:** Stage legado — na UI moveleira seria equivalente a "Em Negociação" ou similar

### 5.3 `update_updated_at_column()` — Trigger
- **Quando:** UPDATE em tabelas com `updated_at`
- **Lógica:** `NEW.updated_at = now()`

### 5.4 `audit_trigger_func()` — Trigger
- **Tipo:** SECURITY DEFINER
- **Quando:** INSERT, UPDATE, DELETE em tabelas auditadas
- **Lógica:** Registra ação, dados antigos/novos, user_id e email em `audit_logs`
- **Tabelas auditadas:** patients, appointments, budgets, financial_installments

### 5.5 `generate_installments_on_approval()` — Trigger
- **Quando:** UPDATE em `budgets`
- **Lógica:** 
  1. Se `status` muda para `'aprovado'`
  2. Remove parcelas anteriores (reaprovação)
  3. Calcula `net_total = total - discount` (desconto absoluto em R$)
  4. Divide em N parcelas iguais
  5. Vencimentos: D+0, D+30, D+60... (intervalos de 30 dias)
  6. Status inicial: `'pendente'`

---

## 6. Edge Functions (Supabase)

### 6.1 `evolution-api` — Integração WhatsApp

**Actions:**
| Action | Descrição | Parâmetros |
|---|---|---|
| `connect` | Cria instância e retorna QR Code | clinic_id, api_url, api_key, instance_name |
| `status` | Verifica estado da conexão | clinic_id |
| `disconnect` | Desconecta e limpa config | clinic_id |
| `send_message` | Envia mensagem de texto | clinic_id, phone, message |

**Autenticação:** Bearer token + verificação de pertencimento à loja ou platform_admin

### 6.2 `google-calendar` — Integração Google Calendar

**Actions:**
| Action | Descrição | Parâmetros |
|---|---|---|
| `connect` | Testa API Key + Calendar ID e salva | clinic_id, api_key, calendar_id |
| `status` | Retorna status da integração | clinic_id |
| `disconnect` | Remove config | clinic_id |
| `sync_events` | Busca eventos dos próximos 30 dias | clinic_id |

**Autenticação:** Mesma lógica da evolution-api

### 6.3 `manage-team` — Gestão de Equipe

**Restrição:** Apenas `platform_admin` pode usar.

**Actions:**
| Action | Descrição | Parâmetros |
|---|---|---|
| `list` | Lista usuários de uma loja | clinic_id |
| `create` | Cria usuário + role | email, password, role, clinic_id |
| `update_role` | Altera role de um usuário | role_id, new_role |
| `delete` | Remove role (não deleta auth user) | role_id |
| `ban_user` | Bloqueia login (ban 100 anos) | user_id |
| `unban_user` | Desbloqueia login | user_id |
| `ban_clinic` | Bloqueia todos da loja + status inativa | clinic_id |
| `unban_clinic` | Desbloqueia todos + status ativa | clinic_id |

### 6.4 `appointment-reminders` — Lembretes de Visitas

- **Trigger:** Chamada programada (cron ou manual)
- **Lógica:** Busca agendamentos de amanhã com status 'agendado' ou 'confirmado'
- **Envio:** Via Evolution API (WhatsApp) se a loja tiver integração conectada
- **Mensagem:** Template com nome, data, hora e produto de interesse

### 6.5 `create-test-users` — Criação de Usuários de Teste

- **Uso:** Desenvolvimento/staging
- **Lógica:** Para cada loja, cria usuário `owner_{id}@teste.com` com senha `teste123456`
- **Segurança:** Verificação de platform_admin no header

---

## 7. Contextos React

### 7.1 `AuthContext`

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];        // { role, clinic_id }[]
  loading: boolean;
  isPlatformAdmin: boolean;
  clinicId: string | null;  // resolved (impersonated ou natural)
  impersonatedClinicId: string | null;
  impersonateClinic: (id: string) => void;
  clearImpersonation: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}
```

### 7.2 `WhiteLabelContext`

```typescript
interface WhiteLabelSettings {
  clinicName: string;      // Default: "Loja"
  clinicSubtitle: string;  // Default: "CRM"
  logoUrl: string | null;
  primaryColor: string;    // HSL: "195 100% 50%"
  faviconUrl: string | null;
}
```

- Busca dados de `clinics` quando `clinicId` muda
- Aplica CSS variables dinâmicas
- Cache em `localStorage` (key: `cubo-whitelabel`)

---

## 8. Rotas e Páginas

### Públicas

| Rota | Página | Descrição |
|---|---|---|
| `/login` | Login.tsx | Email/senha, validação de loja ativa |

### Protegidas (requer autenticação)

| Rota | Página | Descrição |
|---|---|---|
| `/dashboard` | Dashboard.tsx | KPIs: leads, visitas hoje, faturamento, conversão, parcelas vencidas |
| `/patients` | Patients.tsx | CRUD de clientes com filtros por stage/source/tags, busca, paginação |
| `/patients/:id` | PatientDetail.tsx | Detalhe do cliente, timeline, orçamentos, visitas |
| `/pipeline/patients` | PatientPipeline.tsx | Kanban de clientes (8 colunas do funil) |
| `/pipeline/budgets` | BudgetPipeline.tsx | Kanban de orçamentos (5 status) |
| `/budgets` | Budgets.tsx | Lista de orçamentos, criação com itens e parcelas |
| `/procedures` | Procedures.tsx | Catálogo de produtos (CRUD) |
| `/agenda` | Agenda.tsx | Agenda de visitas (dia/semana/mês) |
| `/financial` | Financial.tsx | Controle de parcelas (marcar pago, filtros) |
| `/automations` | Automations.tsx | Configuração de cadências automáticas |
| `/reports` | Reports.tsx | Relatórios com gráficos (Recharts) |
| `/nps` | NpsSatisfaction.tsx | Pesquisa pós-venda NPS |
| `/whatsapp` | WhatsApp.tsx | Integração WhatsApp, envio de mensagens |
| `/settings` | Settings.tsx | Aparência, equipe, integrações, metas, LGPD, auditoria |

### Admin (requer `platform_admin`)

| Rota | Página | Descrição |
|---|---|---|
| `/admin` | AdminDashboard.tsx | Lista de lojas, métricas globais, criar loja |
| `/admin/clinic/:id` | AdminClinicDetail.tsx | Detalhe da loja, equipe, status, impersonação |

### Sidebar (navItems)

```
Dashboard → Clientes/Leads → Pipeline (Clientes | Orçamentos) → WhatsApp →
Agenda/Visitas → Financeiro → Orçamentos → Catálogo de Produtos →
Automações → Relatórios → Pós-Venda → Configurações → [Painel Admin]
```

---

## 9. Storage

### Bucket: `clinic-assets`
- **Público:** Sim
- **Uso:** Logos das lojas
- **Upload:** Via Settings → Aparência

---

## 10. Integrações

### 10.1 WhatsApp (Evolution API)

**Fluxo:**
1. Loja configura: API URL, API Key, Instance Name
2. Edge function cria instância e retorna QR Code
3. Usuário escaneia QR com WhatsApp
4. Status muda para "connected"
5. Pode enviar mensagens via edge function

**Config armazenada em:** `clinic_integrations.config` (jsonb)
```json
{
  "api_url": "https://...",
  "api_key": "...",
  "instance_name": "..."
}
```

### 10.2 Google Calendar

**Fluxo:**
1. Loja configura: API Key do Google + Calendar ID
2. Edge function testa conexão
3. Pode sincronizar eventos dos próximos 30 dias

**Config armazenada em:** `clinic_integrations.config` (jsonb)
```json
{
  "api_key": "...",
  "calendar_id": "..."
}
```

---

## 11. Lógica de Negócio Importante

### Desconto
- Desconto é em **valor absoluto (R$)**, não percentual
- `net_total = total - discount`

### Parcelas Automáticas
- Trigger no banco gera parcelas quando orçamento é aprovado
- Parcelas iguais, vencimento a cada 30 dias
- Remove parcelas anteriores em caso de reaprovação

### Audit Logs
- Automático via trigger `audit_trigger_func()`
- Tabelas auditadas: patients, appointments, budgets, financial_installments
- Registra: quem (user_id/email), o quê (action), dados antigos/novos

### Bloqueio de Loja
- Admin pode desativar loja (status → `inativa`)
- Edge function `ban_clinic` bloqueia login de todos os usuários da loja
- Login verifica status da loja e bloqueia acesso se inativa/cancelada

### Stage do Cliente
- Trigger `on_appointment_completed` muda stage para `em_tratamento` quando visita é realizada
- Stages são gerenciados pela UI (drag & drop no pipeline)

---

## 12. Secrets Necessários (Supabase)

| Secret | Descrição |
|---|---|
| SUPABASE_URL | URL do projeto Supabase |
| SUPABASE_ANON_KEY | Chave anon (pública) |
| SUPABASE_SERVICE_ROLE_KEY | Chave admin (usada em edge functions) |
| SUPABASE_DB_URL | Connection string PostgreSQL |
| SUPABASE_PUBLISHABLE_KEY | Mesma que anon key |
| LOVABLE_API_KEY | API key do Lovable (para AI features) |

---

## 13. Configuração do Ambiente (.env)

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=<project_id>
```

**Nota:** O arquivo `.env` é gerado automaticamente pelo Lovable Cloud.

---

## 14. Como Replicar em Outro Ambiente

### Passo 1: Criar Projeto Supabase
1. Criar projeto no Supabase
2. Executar todas as migrações SQL (ver `/supabase/migrations/`)

### Passo 2: Criar Tabelas e Funções
Executar na ordem:
1. Enum `app_role`
2. Tabelas (clinics, user_roles, patients, procedures, appointments, budgets, budget_items, financial_installments, automations, nps_responses, revenue_goals, clinic_integrations, consent_terms, patient_consents, audit_logs, post_procedure_templates)
3. Funções (has_role, on_appointment_completed, update_updated_at_column, audit_trigger_func, generate_installments_on_approval)
4. Triggers para cada tabela
5. RLS policies para cada tabela

### Passo 3: Storage
1. Criar bucket `clinic-assets` (público)

### Passo 4: Edge Functions
1. Deploy de: evolution-api, google-calendar, manage-team, appointment-reminders, create-test-users
2. Configurar secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

### Passo 5: Usuário Inicial
1. Criar usuário admin via Supabase Auth
2. Inserir role `platform_admin` em `user_roles` (com clinic_id = NULL)

### Passo 6: Frontend
1. `npm install`
2. Configurar `.env` com URL e anon key do Supabase
3. `npm run dev`

### Passo 7: Auth Settings
- Email confirmation: habilitada por padrão
- Para desenvolvimento: pode desabilitar via `configure_auth`

---

## 15. Arquivos-Chave do Projeto

| Arquivo | Descrição |
|---|---|
| `src/App.tsx` | Rotas e providers |
| `src/contexts/AuthContext.tsx` | Autenticação, roles, impersonação |
| `src/contexts/WhiteLabelContext.tsx` | White-label (nome, cor, logo) |
| `src/components/AppLayout.tsx` | Layout principal (sidebar + header) |
| `src/components/ProtectedRoute.tsx` | Guard de rota (auth + role check) |
| `src/integrations/supabase/client.ts` | Cliente Supabase (auto-gerado) |
| `src/integrations/supabase/types.ts` | Tipos do DB (auto-gerado) |
| `supabase/functions/*/index.ts` | Edge functions |
| `supabase/config.toml` | Config do projeto Supabase |
| `.lovable/plan.md` | Plano de migração de nicho |

---

## 16. Nota sobre Nomes Legados

O banco de dados mantém nomes do CRM original de clínicas:
- `clinics` → Na UI = "Lojas"
- `patients` → Na UI = "Clientes / Leads"
- `procedures` → Na UI = "Catálogo de Produtos"
- `appointments` → Na UI = "Visitas / Agendamentos"
- `clinic_owner` → Na UI = "Dono da Loja"
- `clinic_staff` → Na UI = "Vendedor"
- `clinic_receptionist` → Na UI = "Recepcionista"

**Nenhuma migração de banco foi feita** — apenas a camada de apresentação (UI) foi adaptada para o nicho moveleiro.
