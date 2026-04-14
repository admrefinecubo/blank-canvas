

# Plano: Atualizar Roadmap com status real do projeto

## Análise do que está implementado

Baseado na análise do código (edge functions, migrations, páginas), aqui está o mapeamento real:

### Feito (done)
- **Bloco 1 (Identidade)**: #1-6 — AdminLojaDetail tem nome, tom de voz, especialidades, regras de personalidade configuráveis por loja
- **Bloco 2 (Regras)**: #8-12 — lógica no agent-tools (buscar_produto consulta catálogo real, filtra por loja_id)
- **Bloco 5 (Catálogo/RAG)**: #31 (schema completo com variações, specs, checkout_url, preços), #32 (foto_principal, foto_detalhe, video_url), #33 (tags), #34 (estoque_disponivel + stock-webhook), #35 (preco_promocional), #36 (multi-tenant por loja_id)
- **Bloco 6 (E-commerce)**: #43-44 (stock-webhook para sync estoque/preço em tempo real)
- **Bloco 7 (Tool Calling)**: #47 (buscar_produto), #49 (agendar_visita), #51 (agendar_follow_up), #52 (cadastrar_lead), #53 (mover_pipeline), #55 (transferir_para_humano)
- **Bloco 9 (Promoções)**: #63-64 — campaign-dispatch com segmentação por etapa, origem, interesse
- **Bloco 10 (CRM/Pipeline)**: #67-70 — leads com cadastro automático, canal_origem, histórico, pipeline
- **Bloco 12 (Regras Negócio)**: #78-85 — lojas table tem horário, endereço, maps_link, formas_pgto, politica_troca, prazo_entrega, frete_gratis, plataforma_ecommerce
- **Bloco 16 (Transbordo)**: #98-105 — transferir_humano com resumo, prioridade, agente_pausado, is_bot_active, logs
- **Bloco 17 (Drive-to-Store)**: #106-108 — visitas com data, endereço, maps, produtos_interesse

### Em progresso (in_progress)
- **Bloco 11 (Envio Mídias/Checkout)**: #48 (enviar_midia existe no agent-tools mas não está efetivando), #72-76 — a edge function envia mas o agente no N8N não está processando corretamente
- **Bloco 5**: #30 (RAG semântica — extension vector instalada, mas match_produtos não implementado ainda), #37 (re-indexação automática)
- **Bloco 7**: #50 (gerar_orcamento — retorna HTML, mas não PDF formal), #54 (gerar_cobranca — placeholder, sem gateway)

### Pendente
- **Bloco 3 (Fluxo Vendas)**: #13-21 — lógica de prompt/conversação no N8N, não no CRM
- **Bloco 4 (Diagnóstico)**: #22-29 — idem, prompt do agente
- **Bloco 6**: #38-42 (integrações Shopify/Nuvemshop/Tray/VTEX/VendiZap), #45-46 (checkout por variação, botão interativo)
- **Bloco 8 (Follow-up)**: #56-62 — tabela follow_ups existe, mas automação cron pendente
- **Bloco 9**: #65-66 (desconto configurável por tipo)
- **Bloco 13 (Cross-sell)**: #86-88 — pendente
- **Bloco 14 (Logística)**: #89-92 — campos existem mas sem fluxo no agente
- **Bloco 15 (Pós-Venda)**: #93-97 — pendente

## O que vou fazer

1. **Atualizar `src/data/roadmap-data.ts`** — mudar o status de cada item conforme a análise acima (done/in_progress/pending)
2. **Extrair o workflows-2.zip** — parsear os JSONs e atualizar a seção de workflows N8N com os dados atualizados
3. **Marcar explicitamente o bloco 11 como "em progresso"** conforme indicado pelo usuário (mídia e checkout não efetivando)

## Resumo de impacto
- ~35+ itens passam de `pending` para `done`
- ~6 itens passam para `in_progress`
- Workflows N8N atualizados com o novo zip
- Arquivo único alterado: `src/data/roadmap-data.ts`

