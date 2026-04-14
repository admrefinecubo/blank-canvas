

# O que falta no CRM (com base no checklist)

## Já implementado no CRM

| # | Item | Onde |
|---|------|------|
| 1-7 | Identidade (nome, tom, especialidades, regras) | AdminLojaDetail.tsx — tab Identidade |
| 37 | Re-indexação embeddings | catalog-actions → WF-11 webhook |
| 47-55 | Tools do agente | agent-tools edge function |
| 56-62 | Follow-ups | LojaFollowups.tsx (listagem + criação) |
| 63-66 | Campanhas/Promoções | LojaCampanhas.tsx + campaign-dispatch |
| 67-71 | CRM e Pipeline | LojaLeads.tsx + WhatsApp.tsx |
| 78-85 | Regras de negócio | AdminLojaDetail.tsx — tab Operação |
| 106-109 | Drive-to-Store | LojaVisitas.tsx (com vendedor_responsavel) |
| Vendas | Listagem de vendas | LojaVendas.tsx |
| Handoff | Toggle bot/humano | handoff.ts + WhatsApp.tsx |

## Pendente — pode fazer aqui no CRM

### 1. Pós-venda (#93-97) — Tabela + UI
A tabela `post_sale_contacts` existe mas não tem UI. Criar página para:
- Listar contatos pós-venda por lead
- Criar templates de mensagens pós-venda (pós-entrega, pós-colchão, pós-móvel, avaliação)
- Agendar como follow-ups com tipo específico (`pos_venda_entrega`, `pos_venda_colchao`, etc.)
- Exibir `pos_venda_status` do lead

### 2. Descontos configuráveis por tipo de follow-up (#65-66)
A tab Automações do AdminLojaDetail já tem desconto de carrinho abandonado e promoção não respondida. Falta:
- Adicionar campo `desconto_followup_orcamento` (desconto para follow-up de orçamento pendente)
- Precisa de migration para adicionar coluna na tabela `lojas`

### 3. NPS / Avaliação pós-venda (#96)
A tabela `nps_responses` existe e a página `NpsSatisfaction.tsx` existe. Verificar se está funcional para lojas (atualmente parece vinculada a clinics). Adaptar para funcionar com `loja_id`.

### 4. Histórico completo do cliente (#69)
Na tela de WhatsApp/Conversas já temos histórico de mensagens, mas falta um "perfil do lead" que mostre:
- Produtos vistos (via `midias_enviadas`)
- Follow-ups agendados
- Visitas marcadas
- Vendas/orçamentos
- Pipeline atual
Criar um painel lateral ou drawer no WhatsApp.tsx que agregue tudo isso

### 5. Webhook receptor de estoque (#43-44)
Criar edge function `stock-webhook` que recebe atualizações de estoque de plataformas e-commerce e atualiza a tabela `produtos`. O WF-14 já faz sync ativo, mas falta o receptor passivo (webhook).

### 6. Logs de execução visíveis (#transversal)
A tabela `logs_execucao` existe mas não tem UI. Criar página simples para admin ver logs de eventos do agente (transbordo, erros, etc.)

## Implementação

### Etapa 1 — Perfil completo do lead no WhatsApp (checklist #69)
- Adicionar drawer/painel lateral no WhatsApp.tsx
- Ao clicar num lead, mostrar: dados do lead, mídias enviadas, follow-ups, visitas, vendas
- Queries separadas por tabela, lazy-loaded

### Etapa 2 — UI de pós-venda (checklist #93-97)
- Criar página `LojaPosVenda.tsx`
- Listar leads com vendas pagas + status pós-venda
- Botão para agendar follow-up de tipo pós-venda
- Rota no App.tsx

### Etapa 3 — Adaptar NPS para lojas (checklist #96)
- Verificar NpsSatisfaction.tsx e adaptar query para usar `loja_id`

### Etapa 4 — Webhook de estoque (checklist #43-44)
- Criar edge function `stock-webhook/index.ts`
- Recebe POST com `{produto_id, estoque, preco}` e atualiza tabela `produtos`
- Sem auth (webhook externo) mas com API key simples

### Etapa 5 — Página de logs (admin)
- Criar `AdminLojaLogs.tsx` listando `logs_execucao` por loja
- Filtros por evento e data

### Etapa 6 — Migration para desconto extra
- Adicionar `desconto_followup_orcamento` na tabela `lojas`
- Adicionar campo na tab Automações do AdminLojaDetail

## Ordem de execução
1. Perfil do lead no WhatsApp (#69)
2. Pós-venda UI (#93-97)
3. NPS adaptado para lojas (#96)
4. Webhook de estoque (#43-44)
5. Logs de execução (admin)
6. Desconto extra (#65-66)

