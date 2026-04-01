
Objetivo: transformar o app em um SaaS multi-tenant com 2 experiências distintas — Admin (implantador) e Cliente (lojista) — sem quebrar a base atual nem enfraquecer a segurança do Supabase.

1. Decisão arquitetural obrigatória
- Não vou seguir literalmente a modelagem do prompt em 2 pontos, porque ela conflita com a arquitetura segura já existente:
  - não vou guardar `role` em `user_profiles`; os papéis devem continuar em `user_roles` (regra de segurança);
  - não vou migrar tudo para `loja_id`, porque hoje o CRM principal inteiro já é tenantado por `clinic_id`, e isso quebraria boa parte do sistema.
- Arquitetura alvo recomendada:
```text
auth.users
  -> profiles (metadados visuais do usuário, sem role)
  -> user_roles (role + clinic_id)

clinics
  -> conta/tenant do cliente

lojas
  -> loja operacional vinculada à conta via clinic_id
```
- Na experiência do produto:
  - `platform_admin` = Admin/dev
  - `clinic_owner` = Cliente/dono da loja
  - `clinic_staff` / `clinic_receptionist` = equipe do cliente

2. O que já existe e será reaproveitado
- `AuthContext` já carrega sessão, roles, `clinicId` e impersonação.
- `ProtectedRoute` já protege admin por `platform_admin`.
- `user_roles`, `has_role`, `has_clinic_access` e `has_loja_access` já existem.
- `lojas` já está vinculada a `clinic_id`.
- `AdminDashboard`, `AdminLojas`, `AdminLojaDetail` e `Settings` já cobrem parte importante do fluxo.

3. Fase 1 — consolidar auth e contexto de acesso
- Refatorar `AuthContext` para expor um modelo mais claro de sessão:
  - `appMode: 'admin' | 'client'`
  - `isClientOwner`
  - `activeClinicId`
  - `activeLojaId` (derivado da conta/logado)
- Manter `user_roles` como fonte oficial de autorização.
- Se necessário, usar `profiles` existente só para nome/avatar do usuário.
- Ajustar `signIn` e redirecionamento pós-login:
```text
platform_admin -> /admin
clinic_owner/staff/receptionist -> /dashboard
```

4. Fase 2 — separar layouts e navegação por papel
- Criar 2 experiências visuais:
  - `AdminLayout`: visão global, gestão de contas/lojas/implantação
  - `ClientLayout`: visão simplificada da loja do cliente
- Hoje o `AppLayout` mistura tudo; a refatoração vai separar sidebar, breadcrumbs e atalhos.
- Sidebar do cliente:
```text
Dashboard
Clientes / Leads
WhatsApp
Catálogo
Agenda / Visitas
Follow-ups
Configurações
```
- Sidebar do admin:
```text
Dashboard Admin
Contas
Lojas
Estatísticas
Implantação / Equipe
```

5. Fase 3 — roteamento e guards
- Reorganizar `App.tsx` com wrappers distintos:
  - `AdminRoute`
  - `ClientRoute`
- Regras:
  - `/admin/*` só para `platform_admin`
  - rotas do cliente só para usuários vinculados à própria conta
  - tentativa de acesso indevido redireciona para o dashboard correto
- Ajustar `/` para redirecionamento inteligente baseado no papel.
- Manter impersonação do admin para validar a experiência real do cliente.

6. Fase 4 — modelo de dados e RLS sem quebrar o sistema
- Não substituir o tenant principal por `loja_id`; aplicar a regra correta por domínio:
  - tabelas CRM (`patients`, `budgets`, `appointments`, `procedures`, `financial_*`, `automations`, etc.) continuam filtradas por `clinic_id`
  - tabelas operacionais/comerciais (`lojas`, `leads`, `produtos`, `historico_mensagens`, `follow_ups`, `visitas`, `midias_enviadas`) continuam filtradas por `loja_id`
- Revisões de banco:
  - reforçar helpers para contexto do usuário, se necessário (`get_user_role`, `get_active_clinic_id`, `get_active_loja_id`)
  - revisar políticas para garantir que cliente nunca veja dados fora da sua conta/loja
  - evitar políticas recursivas; usar funções `SECURITY DEFINER` quando necessário
- Não criar `role` em tabela de perfil.
- Não sair removendo `clinic_id`, `patient_id` e nomes legados nesta etapa; isso entra como refatoração posterior de nomenclatura/interface, não de estrutura crítica.

7. Fase 5 — fluxo profissional de implantação pelo admin
- Expandir o admin para um onboarding único:
```text
Criar conta (clinic)
-> criar loja vinculada
-> criar usuário dono
-> configurar branding
-> configurar operação
-> configurar integrações
-> validar via impersonação
```
- Evoluções em páginas existentes:
  - `AdminDashboard`: KPIs globais + visão de contas/implantação
  - `AdminLojas`: manter como gestão operacional da loja
  - `AdminLojaDetail`: expandir para refletir as abas do prompt
  - `Settings`: deixar só admin gerenciar branding/equipe/integrações sensíveis
- O botão “Nova Loja” deve evoluir para wizard de implantação, não só cadastro simples.

8. Fase 6 — experiência do cliente
- Reaproveitar páginas atuais com foco na loja/conta do cliente:
  - `Dashboard` -> resumo da loja
  - `Patients` -> Leads/Clientes
  - `WhatsApp` -> conversas
  - `Procedures` ou nova página -> Catálogo
  - `Agenda` -> visitas/agenda
  - `Settings` -> leitura parcial + edição limitada
- Permissões do cliente:
  - pode editar: nome visível da loja, telefone, horário, alguns dados operacionais
  - não pode editar: branding estratégico, credenciais, instance, integrações sensíveis, equipe global
- O frontend sempre consulta normalmente; o isolamento real continua no RLS.

9. Ajustes técnicos específicos que entram no escopo
- `src/contexts/AuthContext.tsx`
  - simplificar leitura de papel ativo
  - expor modo admin/cliente
  - resolver `activeLojaId`
- `src/components/ProtectedRoute.tsx`
  - ampliar para guardas de admin e cliente
- `src/App.tsx`
  - separar rotas por experiência
- `src/components/AppLayout.tsx`
  - dividir ou substituir por layouts específicos
- `src/pages/Login.tsx`
  - redirecionamento pós-login por papel
- `src/pages/Settings.tsx`
  - virar página contextual por papel
- `src/pages/AdminDashboard.tsx`, `src/pages/AdminLojas.tsx`, `src/pages/AdminLojaDetail.tsx`
  - consolidar implantação/administração
- `supabase/functions/manage-team/index.ts`
  - adaptar para onboarding mais completo de cliente e gestão do dono da conta

10. Entrega em ordem recomendada
1. Refatorar contexto de auth + guards + redirect pós-login
2. Separar layout admin vs cliente
3. Revisar RLS/helpers sem trocar `clinic_id` por `loja_id` no sistema todo
4. Adaptar telas do cliente para visão exclusiva da própria loja
5. Expandir admin para fluxo de implantação completo
6. Padronizar nomenclatura visual (“conta”, “loja”, “cliente”) e esconder termos legados da UI

11. Resultado esperado
- Admin vê tudo e implanta clientes com segurança
- Cliente entra e vê apenas a própria operação
- Branding, equipe e integrações estratégicas ficam com o admin
- CRM principal continua estável porque o tenant base permanece em `clinic_id`
- módulo `lojas` passa a funcionar como loja operacional da conta, sem registros órfãos

12. Detalhes técnicos e ressalvas
- O prompt original pede `user_profiles.role`; isso não será implementado por segurança.
- O prompt original pede mover toda filtragem para `loja_id`; isso não é viável sem reescrever o CRM inteiro. O caminho correto é híbrido: `clinic_id` para CRM principal e `loja_id` para o módulo comercial.
- Como não há signup público, não depende de trigger novo em `auth.users` para a entrega principal; o fluxo de criação de usuários deve partir do admin.
- Assumirei nesta fase a experiência “1 cliente logado = 1 conta principal = 1 loja operacional padrão”, mantendo espaço para múltiplas lojas no banco sem expor essa complexidade ao cliente.
