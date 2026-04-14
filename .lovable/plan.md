

# Plano Unificado: Corrigir Handoff + Completar Checklist

## Status Atual

- **Horário da loja**: Já está `08:00`–`18:00` no banco. O bug de "loja fechada" não é do CRM — investigar no N8N se há cache ou se a loja em questão é outra.
- **handoff.ts**: Já atualiza `is_bot_active` + `agente_pausado` + webhook N8N corretamente.
- **WhatsApp.tsx**: NÃO usa handoff.ts — faz update inline só de `is_bot_active`, deixando `agente_pausado` dessincronizado. Também não inclui `instance` na query de leads.
- **LojaLeads.tsx**: Já importa `activateHandoff` do handoff.ts (correto), mas só tem botão de pausar, não de despausar.

---

## Etapa 1 — Corrigir Handoff (bug ativo, urgente)

### 1.1 WhatsApp.tsx — usar handoff.ts
- Importar `activateHandoff`, `deactivateHandoff` de `@/lib/handoff`
- Adicionar `instance` ao select da query de leads (linha 99)
- Adicionar `instance` ao tipo `ConversationSummary`
- **toggleBotMutation**: substituir update inline por:
  - `checked=true` (bot ativo) → `deactivateHandoff(params)` 
  - `checked=false` (bot pausado) → `activateHandoff(params)`
- **sendMessageMutation auto-pause**: substituir o bloco inline (linhas 254-265) por `activateHandoff(params)`

### 1.2 LojaLeads.tsx — adicionar botão "Devolver ao bot"
- Adicionar importação de `deactivateHandoff`
- Ao lado do botão "Pausar Bot", mostrar botão "Devolver ao Bot" quando `is_bot_active === false`

---

## Etapa 2 — Completar funcionalidades do checklist

### 2.1 Auto-indexar embeddings ao salvar produto (checklist #37)
- Verificar se `OPENAI_API_KEY` existe nos secrets
- Atualizar edge function `catalog-actions` para gerar embedding via `text-embedding-3-small` ao criar/editar produto
- Salvar no campo `embedding` da tabela `produtos`

### 2.2 UI de Campanhas Promocionais (checklist #63-66)
- Verificar e completar `LojaCampanhas.tsx` com formulário para:
  - Nome, segmento, template de mensagem, desconto
  - Botão "Disparar" que chama webhook do WF-13

### 2.3 UI de Follow-ups (checklist #56-62)
- Completar página de follow-ups com listagem da tabela `follow_ups`
- Mostrar status (enviado/pendente), tipo, data agendada
- WF-02 já executa o cron no N8N — a UI só precisa exibir e permitir criar

### 2.4 Página de Vendas (checklist #45/54)
- Criar listagem da tabela `vendas` com status, valor, link checkout
- Filtros por status e data

### 2.5 Atribuição de vendedor na visita (checklist #109)
- Adicionar campo de seleção de vendedor na UI de visitas (`vendedor_responsavel`)

---

## Fase 2 (requer N8N — fora do Lovable)
- WF-09 Gerar Orçamento PDF (precisa de `pdf_api_key`)
- Gateway de pagamento real (Stripe/Mercado Pago)
- Pós-venda automatizado (workflows #93-97)

---

## Ordem de execução
1. Corrigir handoff no WhatsApp.tsx (Etapa 1.1)
2. Adicionar "Devolver ao bot" no LojaLeads.tsx (Etapa 1.2)
3. Auto-indexar embeddings (Etapa 2.1)
4. UI de vendas (Etapa 2.4)
5. UI de campanhas (Etapa 2.2)
6. UI de follow-ups (Etapa 2.3)
7. Vendedor na visita (Etapa 2.5)

