

# Refinamento Completo das Dashboards — UX/UI Premium + Dados Reais

## Escopo

Duas dashboards: **Client Dashboard** (`/dashboard`) e **Admin Dashboard** (`/admin`). Ambas precisam de melhorias visuais e melhor aproveitamento dos dados já disponíveis no banco.

---

## 1. Client Dashboard (`src/pages/Dashboard.tsx`)

### 1.1 Header com saudação contextual
- Substituir o header genérico por saudação: "Bom dia, [nome_loja]" baseado na hora do dia
- Mover badge "Operação por loja" para inline sutil

### 1.2 KPI Cards — Redesign visual
- Adicionar indicador de variação (trend) comparando hoje vs ontem para "Leads hoje" e "Conversas ativas"
- Query adicional: `leads` com `created_at >= ontem AND < hoje` para calcular delta percentual
- Micro-animação no número com `countUp` via CSS (font-variant-numeric: tabular-nums)
- Adicionar cor contextual: verde se positivo, vermelho se negativo, cinza se igual

### 1.3 Gráfico de Leads Semanal (novo)
- Mini area chart (recharts — já no projeto via shadcn/chart) mostrando leads dos últimos 7 dias
- Query: `leads` agrupados por dia nos últimos 7 dias
- Card com título "Evolução semanal" ao lado do resumo operacional

### 1.4 Pipeline Snapshot (novo)
- Horizontal bar ou mini donut mostrando distribuição dos leads por `etapa_pipeline`
- Query: `leads` por `loja_id` agrupados por `etapa_pipeline` (sem filtro de data — total ativo)
- Posicionar abaixo dos KPIs, acima das conversas

### 1.5 Conversas recentes — Polimento
- Adicionar avatar com iniciais coloridas (hash do nome → cor)
- Badge indicando se a última mensagem foi do bot ou do cliente
- Timestamp relativo ("há 5 min") em vez de data completa

### 1.6 Card "Resumo operacional" — Tornar actionable
- Trocar os cards estáticos por links rápidos: "Ver follow-ups" → `/followups`, "Abrir catálogo" → `/catalogo`
- Remover o card "Ranking de vendedores" com a nota sobre limitação técnica (informação negativa para o cliente)

### 1.7 Vendas do mês (novo card)
- Query em `vendas` com `loja_id` e `created_at >= startOfMonth`
- Soma de `valor_total` e contagem
- Card compacto: "R$ X.XXX em Y vendas este mês"

---

## 2. Admin Dashboard (`src/pages/AdminDashboard.tsx`)

### 2.1 Header — Consistência
- Mesmo padrão de saudação contextual com hora do dia
- Manter badges Admin + Operação por lojas

### 2.2 KPI Cards — Adicionar "Mensagens processadas"
- Usar a Edge Function `platform-metrics` que já retorna `total_mensagens_processadas`
- OU query direta em `mensagens_processadas` com `count`

### 2.3 Gráfico de crescimento semanal (novo)
- Reutilizar dados de `platform-metrics.growth[]` (já existe na Edge Function)
- Area chart com 12 semanas de leads
- Card dedicado acima da tabela de lojas

### 2.4 Alertas de WhatsApp desconectado (novo)
- Usar `platform-metrics.alerts[]` para mostrar banner ou card com lojas desconectadas
- Badge vermelha pulsante se houver alertas

### 2.5 Tabela de lojas — Melhorias
- Adicionar coluna "Bot status" (conectado/desconectado) usando `clinic_integrations`
- Adicionar indicador visual (dot verde/vermelho) no status
- Row hover com highlight mais pronunciado

---

## 3. Melhorias transversais (ambas dashboards)

### 3.1 Loading states
- Substituir "..." nos KPIs por Skeleton components do shadcn
- Skeleton para cards de conversa e tabela

### 3.2 Empty states
- Ilustrações/ícones maiores nos empty states com CTAs claros

### 3.3 Responsividade
- Grid de KPIs: 2 colunas no mobile, 5 no desktop (client), 4 no desktop (admin)
- Cards de conversa: stack vertical no mobile

---

## Arquivos alterados

1. **`src/pages/Dashboard.tsx`** — Redesign completo: saudação, KPIs com trend, gráfico semanal, pipeline snapshot, vendas do mês, remoção do ranking placeholder
2. **`src/pages/AdminDashboard.tsx`** — Saudação, gráfico de crescimento, alertas WhatsApp, coluna bot status na tabela
3. Possível criação de componentes auxiliares: `MiniAreaChart`, `PipelineBar`, `TrendBadge`

Nenhuma migration necessária — todos os dados já existem nas tabelas.

