
Objetivo: corrigir os bugs pós-auditoria priorizando modelo operacional por `loja`, alinhar os nomes reais das colunas para o n8n, transformar o WhatsApp do cliente em inbox, refazer o dashboard admin/cliente e concluir a integração Evolution API com secrets do Supabase e webhook fixo.

Diagnóstico confirmado
- `lojas` hoje usa colunas reais `link_google_maps` e `url_base_checkout`, mas o n8n espera `maps_link` e `checkout_base_url`. Aqui há divergência real entre banco e integração.
- `Dashboard.tsx` ainda usa `clinicId` e tabelas de clínica (`patients`, `appointments`, `budgets`), não tabelas de loja.
- `WhatsApp.tsx` do cliente ainda é tela de conexão/configuração por `clinicId`, não inbox operacional.
- `AdminDashboard.tsx` ainda mistura contas/clínicas com operação de lojas.
- `leads` não possui `is_bot_active` nem `bot_paused_until`, então o status do atendimento pedido não pode ser exibido sem migration.
- `AppLayout.tsx` usa breadcrumb estático/genérico; rotas dinâmicas não resolvem nome real.
- Não há triggers no banco; `set_updated_at` e `validate_loja_clinic_link` existem, mas não estão ativos.
- Você decidiu:
  - credenciais Evolution em Supabase secrets
  - webhook n8n com URL fixa nesta fase
  - criar colunas de status do bot em `leads`

Plano de implementação

1. Alinhar schema de `lojas` com o que o n8n consome
- Criar migration para renomear:
  - `link_google_maps` -> `maps_link`
  - `url_base_checkout` -> `checkout_base_url`
- Revisar toda a UI/admin para ler e gravar exatamente nesses nomes.
- Fazer varredura em páginas e edge functions para eliminar os nomes antigos.
- Validar também o campo de assistente:
  - manter `nome_assistente` como campo principal do frontend
  - tratar `nome_assistente_ia` como legado, sem usar em novas telas
  - se necessário, prever backfill posterior para não perder dados antigos

2. Refazer o dashboard do cliente para operar por `activeLojaId`
- Substituir todas as queries clínicas do `/dashboard` por queries em:
  - `leads`
  - `historico_mensagens`
  - `follow_ups`
  - `visitas`
  - `produtos`
- KPIs:
  - Leads hoje
  - Conversas ativas hoje
  - Follow-ups pendentes
  - Visitas agendadas
  - Produtos no catálogo
- Bloco “Últimas conversas”:
  - buscar última mensagem por lead da loja atual
  - mostrar nome do lead, preview da mensagem, horário e papel (`user`/`assistant`)
- Garantir `enabled: !!activeLojaId` em tudo e remover dependência de `clinicId`.

3. Transformar o WhatsApp do cliente em inbox
- Reaproveitar o modelo operacional já existente no admin (`AdminLojaConversas` + leads) para criar a versão cliente.
- Estrutura:
  - coluna esquerda com lista de conversas/leads
  - painel direito com timeline cronológica
  - cabeçalho com status do atendimento
- Consultas:
  - lista de conversas baseada em `leads` da loja + subconsulta/merge da última mensagem
  - chat carregado por `lead_id`, ordenado por `created_at asc`
- Status do atendimento:
  - migration em `leads` para adicionar `is_bot_active boolean default true`
  - migration em `leads` para adicionar `bot_paused_until timestamptz null`
  - regra visual:
    - pausado se `bot_paused_until` futuro
    - bot ativo se `is_bot_active = true`
    - humano se `is_bot_active = false`
- A configuração Evolution deixa de ser tela principal do cliente; ela passa a ser foco do admin no detalhe da loja.

4. Refazer o dashboard admin para foco em lojas operacionais
- Substituir métricas centradas em `clinics/patients/appointments/budgets`.
- Novos KPIs:
  - lojas ativas
  - total de leads
  - conversas hoje
  - follow-ups enviados (% ou enviados/total)
  - faturamento apenas se existir fonte operacional confiável; caso não exista, remover esse card nesta fase
- Tabela principal:
  - Loja
  - Status
  - Leads
  - Conversas hoje
  - WhatsApp
  - Ações
- Ações:
  - Entrar/visualizar loja
  - Configurar loja
- Separar claramente “conta/clínica” de “loja operacional” para não repetir a confusão anterior.

5. Integrar Evolution API no detalhe admin da loja
- Mover a operação de conexão para a aba “Integrações” de `/admin/lojas/:id`.
- Não expor URL nem API key no frontend.
- Usar Supabase secrets para:
  - `EVOLUTION_API_URL`
  - `EVOLUTION_API_KEY`
  - `N8N_WEBHOOK_URL` (fixa nesta fase)
- Atualizar a edge function `evolution-api` para:
  - validar JWT em código
  - receber `loja_id` ou resolver pela loja atual
  - buscar `clinic_id` pela loja
  - usar secrets internos, sem receber `api_url`/`api_key` do cliente
  - ler `instance` diretamente da tabela `lojas`
  - suportar ações:
    - `connect`
    - `status`
    - `disconnect`
    - `configure_webhook`
- Na UI admin:
  - campo `instance`
  - status conectado/desconectado
  - botão “Conectar WhatsApp”
  - modal com QR Code
  - botão “Verificar status”
  - botão “Configurar webhook”
  - webhook URL exibida readonly
- Manter o estado da integração em `clinic_integrations` por `clinic_id` + provider, já que essa estrutura já existe.

6. Ativar triggers úteis do banco
- Criar migration para aplicar `set_updated_at` em todas as tabelas `public` com coluna `updated_at`.
- Criar trigger em `public.lojas` para `validate_loja_clinic_link`.
- Não anexar trigger em `auth.users` nesta fase, porque as regras deste projeto não permitem alterações em schema reservado `auth`.
- Resultado: timestamps e validação de vínculo da loja passam a funcionar sem intervenção manual.

7. Adicionar filtro por etapa em Leads do cliente
- Em `LojaLeads.tsx`, adicionar select:
  - todas
  - novo
  - qualificado
  - proposta_enviada
  - negociacao
  - venda_fechada
  - perdido
- Aplicar filtro no dataset/query mantendo escopo por `activeLojaId`.
- Preservar edição inline da etapa já existente.

8. Melhorar breadcrumbs dinâmicos
- Substituir o breadcrumb textual simples do `AppLayout` por resolução baseada na rota atual.
- Resolver nomes reais para rotas dinâmicas existentes:
  - `/admin/lojas/:id` -> `Admin > Lojas > {nome_loja}`
  - `/admin/lojas/:id/catalogo` -> `Admin > Lojas > {nome_loja} > Catálogo`
  - `/admin/lojas/:id/leads` -> `Admin > Lojas > {nome_loja} > Leads`
  - `/admin/lojas/:id/conversas` -> `Admin > Lojas > {nome_loja} > Conversas`
  - `/admin/lojas/:id/followups` -> `Admin > Lojas > {nome_loja} > Follow-ups`
  - `/admin/lojas/:id/visitas` -> `Admin > Lojas > {nome_loja} > Visitas`
- Observação importante:
  - hoje não existe rota `/leads/:id`; o detalhe é drawer.
  - então a parte “Leads > João Silva” só entra se criarmos rota dedicada depois. Nesta entrega, deixo a base preparada para rotas dinâmicas existentes.

Arquivos e áreas principais
- `src/pages/AdminLojaDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/WhatsApp.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/LojaLeads.tsx`
- `src/components/AppLayout.tsx`
- `src/contexts/AuthContext.tsx` (se precisar expor mais contexto da loja)
- `supabase/functions/evolution-api/index.ts`
- migrations em `supabase/migrations/*`

Detalhes técnicos
```text
Schema atual confirmado:
- lojas.link_google_maps
- lojas.url_base_checkout
- leads sem is_bot_active
- leads sem bot_paused_until
- triggers: nenhum ativo

Mudanças de schema propostas:
1) rename lojas.link_google_maps -> maps_link
2) rename lojas.url_base_checkout -> checkout_base_url
3) add leads.is_bot_active boolean not null default true
4) add leads.bot_paused_until timestamptz null
5) add trigger validate_loja_clinic_link on lojas
6) add triggers updated_at nas tabelas públicas com updated_at

Estratégia Evolution:
- secrets no Supabase
- webhook fixa agora
- edge function recebe contexto da loja/admin
- frontend nunca envia API key
```

Validação após implementar
- Admin:
  - abrir `/admin`
  - confirmar KPIs por loja
  - abrir `/admin/lojas/:id`
  - editar `maps_link` e `checkout_base_url`
  - conectar WhatsApp, visualizar QR e checar status/webhook
- Cliente:
  - abrir `/dashboard` e confirmar KPIs por `activeLojaId`
  - abrir `/whatsapp` e validar inbox, timeline e status do atendimento
  - abrir `/leads` e validar filtro por etapa
- Banco/n8n:
  - confirmar que `SELECT * FROM lojas` retorna `maps_link` e `checkout_base_url`
  - confirmar que frontend grava exatamente nessas colunas
- Navegação:
  - conferir breadcrumbs dinâmicos nas rotas `/admin/lojas/:id/*`
