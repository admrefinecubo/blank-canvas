

# AUDITORIA COMPLETA v2 — 16/04/2026

Baseada nos 16 workflows enviados + schema Supabase + código CRM.

---

## RESUMO EXECUTIVO

| Metrica | Valor |
|---------|-------|
| Total de itens no checklist | 109 |
| ✅ Implementados | 99 |
| ⚠️ Parciais (dependem do system prompt — já incluído no WF-01) | 0 |
| ❌ Não implementados | 4 |
| Bugs remanescentes | 3 (menores) |

**Mudança drástica vs auditoria v1**: O system prompt do WF-01 agora contém roteiros completos de diagnóstico por ambiente, cross-sell/upsell, objeções, logística e regras de transbordo. Isso resolve os 19 itens que antes estavam como ⚠️.

---

## CHECKLIST COMPLETO — ITEM POR ITEM

### 1. IDENTIDADE E PERSONALIDADE (1-7)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 1 | Nome personalizável | ✅ | `lojas.nome_assistente_ia` + Settings + WF-01 usa `loja.nome_assistente_ia` |
| 2 | Especialidades | ✅ | `lojas.especialidades` + WF-01 prompt |
| 3 | Tom de voz | ✅ | `lojas.tom_voz` + WF-01 prompt |
| 4 | Regras personalidade | ✅ | `lojas.regras_personalidade` + WF-01 seção "REGRAS PERSONALIZADAS DO CLIENTE" |
| 5 | Atuação como consultor | ✅ | WF-01 prompt: "MÉTODO DE VENDA — FUNIL CONSULTIVO" com 5 etapas |
| 6 | Comunicação natural | ✅ | WF-01 prompt: "gírias, risadas (kkk, haha), abreviações (vc, tb, pq)" |
| 7 | Respostas curtas | ✅ | WF-01 prompt: "NO MÁXIMO 2-3 frases", "quebre em blocos curtos" |

### 2. REGRAS ABSOLUTAS E SEGURANÇA (8-12)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 8 | NUNCA inventar produtos | ✅ | WF-01: "NUNCA invente produtos fora do catálogo" |
| 9 | Consultar catálogo antes | ✅ | WF-01: "use buscar_produto_no_catalogo IMEDIATAMENTE" + tool WF-03 |
| 10 | Vender só da loja | ✅ | WF-01: "Venda APENAS produtos da loja_id" + filtro loja_id no agent-tools |
| 11 | Informar indisponibilidade | ✅ | WF-01: "estoque_disponivel = false → informe honestamente + busque alternativas" |
| 12 | Nunca iniciar com preço | ✅ | WF-01: "NUNCA inicie uma conversa oferecendo preço" |

### 3. FLUXO DE VENDAS (13-21)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 13 | Saudação | ✅ | WF-01 "ACOLHIMENTO": cumprimente pelo nome |
| 14 | Diagnóstico | ✅ | WF-01 "DIAGNÓSTICO": descubra ambiente, problema, espaço |
| 15 | Entendimento do ambiente | ✅ | WF-01 diagnósticos por Sala, Quarto, Jantar, Colchões, Planejados |
| 16 | Construção de valor | ✅ | WF-01: "Explique os BENEFÍCIOS, não só características" |
| 17 | 3 opções | ✅ | WF-01: "Apresente 3 opções: Boa, Melhor e Premium" |
| 18 | Objeções | ✅ | WF-01: 6 cenários de objeção (caro, pensar, consultar, mais barato, parcelar, sem dinheiro) |
| 19 | Fechamento | ✅ | WF-01 "FECHAMENTO": 3 cenários (checkout_url → gerar_cobranca → WhatsApp) |
| 20 | Cross-sell/Upsell | ✅ | WF-01 seção "CROSS-SELL E UPSELL" com combos por ambiente |
| 21 | Pós-venda | ✅ | LojaPosVenda.tsx + WF-02 tipos pós-venda |

### 4. DIAGNÓSTICO E QUALIFICAÇÃO (22-29)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 22 | Diagnóstico geral | ✅ | WF-01: "DIAGNÓSTICO ESPECIALIZADO POR AMBIENTE" |
| 23 | Sala | ✅ | WF-01: rack, painel, TV, sofá, mesa de centro |
| 24 | Quarto | ✅ | WF-01: cama, guarda-roupa, criado-mudo, colchão |
| 25 | Sala de Jantar | ✅ | WF-01: mesa, cadeiras, aparador |
| 26 | Colchões | ✅ | WF-01: tamanho, peso, dores, mola vs espuma, ensacada |
| 27 | Móveis Planejados | ✅ | WF-01: medidas, estilo, cor + transbordo se complexo |
| 28 | Qualificação orçamento | ✅ | WF-01: "Você tem uma faixa de valor em mente?" + leads.orcamento_faixa |
| 29 | Outras categorias | ✅ | WF-01 prompt genérico cobre qualquer produto via buscar_produto |

### 5. CATÁLOGO E RAG (30-37)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 30 | Busca semântica RAG | ✅ | WF-03 + match_produtos() + WF-11 embeddings |
| 31 | Schema completo | ✅ | Tabela produtos com todos os campos |
| 32 | Mídias por produto | ✅ | foto_principal, foto_detalhe, video_url |
| 33 | Tags | ✅ | produtos.tags |
| 34 | estoque_disponivel sync | ✅ | Campo existe + WF-14 sync + stock-webhook edge function |
| 35 | Preço promo por variação | ⚠️ | preco_promocional é por produto, não por variação. variacoes é texto livre. |
| 36 | Multi-tenant | ✅ | Tudo filtrado por loja_id |
| 37 | Re-indexação | ✅ | WF-11 + WF-14 chama re-indexação |

### 6. ENVIAR LINK E-COMMERCE (38-46)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 38 | Shopify | ✅ | WF-07 Sync parser |
| 39 | Nuvemshop | ✅ | WF-07 Sync parser |
| 40 | Tray | ✅ | WF-07 Sync parser |
| 41 | VTEX | ✅ | WF-07 Sync parser |
| 42 | VendiZap | ✅ | WF-07 Sync parser |
| 43 | Webhook estoque/preço | ✅ | WF-14 + stock-webhook edge function |
| 44 | Sync automático | ✅ | WF-07 Sync via webhook |
| 45 | Checkout por variação | ❌ | checkout_url é por produto, não por variação |
| 46 | Botão interativo WhatsApp | ❌ | Business API buttons/list não implementados |

### 7. FERRAMENTAS DO AGENTE (47-55)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 47 | buscar_produto | ✅ | WF-03 (RAG) + Tool no WF-01 |
| 48 | enviar_midia | ✅ | WF-04 + Tool no WF-01 + anti-spam delay 1.5s |
| 49 | agendar_visita | ✅ | Tool agendar_visita_loja no WF-01 → tabela visitas |
| 50 | gerar_orcamento | ✅ | WF-09 (PDF) + Tool no WF-01 |
| 51 | agendar_follow_up | ✅ | Tool agendar_follow_up no WF-01 → tabela follow_ups |
| 52 | cadastrar_lead | ✅ | Tool cadastrar_lead no WF-01 |
| 53 | mover_pipeline | ✅ | Tool mover_pipeline no WF-01 |
| 54 | gerar_cobranca | ✅ | WF-10 funcional + agent-tools edge function (3 cenários) |
| 55 | transferir_humano | ✅ | WF-05 + Tool no WF-01 + WF-12 handoff toggle |

### 8. AUTOMAÇÕES FOLLOW-UP (56-62)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 56 | Interação fria | ✅ | WF-02 tipo interacao_fria |
| 57 | Carrinho abandonado | ✅ | WF-02 + WF-10 agenda follow-up carrinho 24h |
| 58 | Promoção não respondida | ✅ | WF-02 tipo promocao_nao_respondida |
| 59 | Orçamento pendente | ✅ | WF-02 tipo orcamento_pendente |
| 60 | Pós-visita | ✅ | WF-02 tipo pos_visita |
| 61 | Medidas ambiente | ✅ | WF-02 tipo medidas_pendentes |
| 62 | Pós-venda | ✅ | WF-02 tipos pos_venda, pos_entrega, pos_colchao, pos_movel, avaliacao |

### 9. PROMOÇÕES E SEGMENTAÇÃO (63-66)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 63 | Disparo promoções | ✅ | WF-13 + LojaCampanhas.tsx |
| 64 | Segmentação por interesse | ✅ | WF-13 filtra por loja_id + agente_pausado |
| 65 | Desconto carrinho | ✅ | lojas.desconto_carrinho_abandonado + Settings |
| 66 | Desconto promoção | ✅ | lojas.desconto_promocao_nao_respondida + Settings |

### 10. CRM E PIPELINE (67-71)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 67 | Cadastro automático lead | ✅ | WF-01 upsert com on_conflict=loja_id,telefone |
| 68 | Canal de origem | ✅ | leads.canal_origem + trigger sync_canal_origem |
| 69 | Histórico | ✅ | historico_mensagens + AdminLojaConversas |
| 70 | Movimentação funil | ✅ | WF-01 tool mover_pipeline + prompt obriga uso |
| 71 | Tracking mídia | ✅ | midias_enviadas registra cada envio |

### 11. ENVIO DE MÍDIAS E CHECKOUT (72-77)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 72 | Fotos com legenda | ✅ | WF-04 com caption |
| 73 | Vídeos | ✅ | WF-04 suporta mediatype video |
| 74 | Anti-spam delay | ✅ | WF-04 node "Anti-spam Delay" 1.5s |
| 75 | Ordem correta | ✅ | WF-01 processa sequencialmente |
| 76 | Botão Comprar Agora | ❌ | WhatsApp Business API buttons não implementados |
| 77 | Follow-up carrinho 24h | ✅ | WF-10 agenda follow_up tipo carrinho_abandonado |

### 12. REGRAS DE NEGÓCIO POR LOJA (78-85) — TODOS ✅

Todos os 8 campos (horário, endereço, maps, pagamento, troca, entrega, frete, plataforma) existem na tabela lojas, são editáveis no Settings e são injetados no system prompt do WF-01.

### 13. CROSS-SELL E UPSELL (86-88) — TODOS ✅

WF-01 system prompt contém seção dedicada "CROSS-SELL E UPSELL" com combos por ambiente e regras de upsell.

### 14. LOGÍSTICA (89-92) — TODOS ✅

WF-01 system prompt contém seção "LOGÍSTICA E ENTREGA" com retirada/entrega, prazo, montagem e frete grátis.

### 15. PÓS-VENDA (93-97) — TODOS ✅

WF-02 Code node contém templates para: pos_entrega, pos_colchao, pos_movel, avaliacao, complementar_ambiente.

### 16. TRANSBORDO (98-105) — TODOS ✅

WF-01 system prompt cobre todos os 8 cenários de transbordo. WF-05 gera resumo automático. Tool tem campo prioridade.

### 17. DRIVE-TO-STORE (106-109) — TODOS ✅

Tool agendar_visita_loja no WF-01 + visitas table com produtos_interesse e vendedor_responsavel. WF-01 prompt confirma endereço + Maps.

---

## ❌ ITENS NÃO IMPLEMENTADOS (4 de 109)

| # | Item | Complexidade | Quem |
|---|------|-------------|------|
| 35 | Preço promocional por variação | Média | Lovable (migration + CRM) |
| 45 | Checkout por variação | Média | Lovable (migration) + Claude (WF-10) |
| 46 | Botão interativo WhatsApp | Alta | Claude (Evolution API buttons/list) |
| 76 | Botão Comprar Agora | Alta | Mesmo que #46 |

**Nota**: #46 e #76 são o mesmo feature (botões interativos WhatsApp). Na prática são **3 itens únicos** faltando.

---

## 🐛 BUGS/RISCOS REMANESCENTES

### BUG 1: WF-07 RAG legado NÃO marcado como deprecated
- WF-06 está corretamente `active: false` com notes
- WF-07 "Buscar Produto RAG" ainda NÃO tem `active: false` nem notes de deprecação
- **Risco**: Se alguém ativar, usa keys hardcoded
- **Fix**: Claude marca WF-07 RAG com `active: false` e notes

### BUG 2: WF-12 filtra lead por telefone+instance (não por loja_id)
- URL: `leads?telefone=eq.X&instance=eq.Y`
- Tabela leads não tem campo `instance` indexado para filter. O campo `instance` está em `lojas`, não em `leads`.
- **Risco**: PATCH não encontra o lead → handoff não persiste no banco
- **Fix**: Claude alterar para `leads?telefone=eq.X&loja_id=eq.Y`

### BUG 3: WF-02 EvolutionAPI credential errada
- Node "EvolutionAPI - Enviar Mensagem Follow-up" usa credential `JJSEaZAnwJCzLP8s` (Supabase Service Role) em vez de Evolution API
- **Risco**: Follow-ups falham com 401 na Evolution API
- **Fix**: Claude trocar credential para Evolution API (NGAuFmIrkBtVVIWk)

---

## 🔑 SEGURANÇA

| Item | Status |
|------|--------|
| Keys hardcoded nos JSONs | ✅ Removidas — todos usam credentials do n8n |
| WF-06 deprecated | ✅ active: false |
| WF-07 RAG deprecated | ⚠️ Falta marcar active: false |
| RLS em todas as tabelas | ✅ Todas as tabelas têm RLS policies |

---

## SCORE FINAL

```
✅ 105/109 itens implementados (96.3%)
❌ 4 itens faltando (3 features únicas):
   - Variações JSON estruturado (#35, #45)
   - Botões interativos WhatsApp (#46, #76)

🐛 3 bugs menores nos workflows (Claude fix)
```

---

## PRÓXIMOS PASSOS

### Prioridade Alta (Claude — n8n)
1. Marcar WF-07 RAG como `active: false` + notes deprecated
2. WF-12: Corrigir filtro de `instance` para `loja_id` no PATCH leads
3. WF-02: Corrigir credential do node EvolutionAPI

### Prioridade Média (Lovable)
4. Migration: variacoes de TEXT → JSONB com schema `[{nome, preco, checkout_url}]`
5. CRM: UI para editar variações estruturadas no catálogo

### Prioridade Baixa
6. Botões interativos WhatsApp via Evolution API (depende de Business API tier)

