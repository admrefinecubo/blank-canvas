

# Plan: Complete AI Agent Checklist for WhatsApp (109 items)

## Analysis

This checklist has 109 items across 17 blocks. After auditing the codebase and database, here's the reality:

**Three categories of work:**

1. **CRM/Frontend (this project)** -- UI pages, database schema, edge functions
2. **AI Agent Prompts (N8N)** -- the system prompt and behavior rules fed to the LLM in N8N workflows
3. **N8N Automation Workflows** -- tool calling, follow-up triggers, media sending, webhook handlers

Items in categories 2 and 3 live in N8N, not in this Lovable project. What we CAN do here is ensure the database schema, admin UI, and edge functions support everything the N8N agent needs.

---

## What's Already Done (DB + UI)

| # | Item | Status |
|---|------|--------|
| 1-4 | Name, specialties, tone, personality rules | DB columns + AdminLojaDetail UI exist |
| 30-37 | Catalog with RAG, schema, media, tags, stock, promo price, multi-tenant, re-index | `produtos` table + `catalog-actions` edge function |
| 52 | cadastrar_lead | LojaLeads create form |
| 53 | mover_pipeline | LojaLeads stage selector |
| 55 | transferir_para_humano | handoff-toggle webhook call |
| 65-66 | Discount configs (cart abandoned, promo not replied) | `lojas` columns + AdminLojaDetail Automacoes tab |
| 67 | Auto lead registration | `auto_set_lead_loja_id` trigger |
| 68 | Origin channel | `origem` field on leads |
| 69 | Customer history | `historico_mensagens` table + WhatsApp inbox |
| 71 | Product view tracking | `midias_enviadas` table |
| 78-85 | Business rules per store | All columns exist in `lojas` + AdminLojaDetail Operacao tab |
| 91 | Assembly service | `montagem_disponivel` column |
| 106-107 | Visit scheduling | `visitas` table + AdminLojaVisitas page |

---

## What Needs to Be Built (Phased)

### Phase 1 -- Database Schema Additions (migrations)

1. **`visitas` table**: add `produtos_interesse` (text), `vendedor_responsavel` (text) for items #108-109
2. **`follow_ups` table**: ensure `tipo` supports all needed values: `carrinho_abandonado`, `promocao_nao_respondida`, `orcamento_pendente`, `pos_visita`, `medidas_ambiente`, `pos_venda`, `interacao_inicial`
3. **`leads` table**: add `nps_comentario` (text) if not exists, ensure `pos_venda_status` covers post-sale flow
4. **`lojas` table**: add `dias_funcionamento` (text) for business days config

### Phase 2 -- Admin UI Enhancements (AdminLojaDetail)

5. **Identidade tab**: Add field for `descricao_loja` (already in DB, not in UI). Add `nome_assistente_ia` field (exists in DB). Add preset personality templates (consultant mode, short responses rule).
6. **Operacao tab**: Add `dias_funcionamento` field. 
7. **Automacoes tab**: Expand with follow-up type configuration cards (7 follow-up types with message templates and delay configs per type).
8. **New "Prompt Preview" section**: Read-only card showing the assembled system prompt that N8N will use (pulls all loja fields into a formatted prompt preview).

### Phase 3 -- Client CRM Pages

9. **LojaLeads enhancements**: 
   - Add `orcamento_faixa` column display
   - Add bulk actions (select multiple leads, change stage, assign)
   - Show `agente_pausado` status badge
   
10. **LojaFollowups enhancements**: 
    - Add create follow-up form (type, scheduled date, message)
    - Filter by follow-up type
    - Show campaign link if campaign_id exists

11. **New page: LojaVisitas** (client-side, route `/visitas`):
    - List visits for the client's loja
    - Create visit with lead selection, date/time, products of interest
    - Status badges (agendada, confirmada, realizada, cancelada)

12. **Dashboard real metrics**: Replace placeholder data with actual queries from leads, historico_mensagens, follow_ups tables.

### Phase 4 -- Edge Functions for Agent Tools

13. **New edge function `agent-tools`**: Single function with actions that N8N calls:
    - `buscar_produto` -- wraps `match_produtos` RPC (already exists) + filters by category/price/size
    - `enviar_midia` -- calls Evolution API `sendMedia` endpoint with delay support
    - `agendar_visita` -- inserts into `visitas` table with Google Maps link from loja config
    - `gerar_orcamento` -- generates PDF with items, discounts, payment terms (returns URL)
    - `agendar_followup` -- inserts into `follow_ups` table
    - `cadastrar_lead` -- inserts into `leads` table
    - `mover_pipeline` -- updates `etapa_pipeline` on leads
    - `gerar_cobranca` -- generates payment link (placeholder, needs payment provider)
    - `transferir_humano` -- sets `agente_pausado=true`, `is_bot_active=false`, sends summary to admin

14. **Update `evolution-api` edge function**: Add `send_media` action for photos/videos with caption support.

### Phase 5 -- Promotions & Campaigns UI

15. **New page: LojaCampanhas** (client route `/campanhas`):
    - List promotional campaigns from `promotional_campaigns` table
    - Create campaign: name, segment type, discount, message template
    - Segment by interest, pipeline stage, origin
    - Show targeted leads count

### Phase 6 -- Post-Sale Flow

16. **Post-sale status tracking**: 
    - Add post-sale dashboard section showing leads in `pos_venda_status`
    - Follow-up templates for post-delivery, post-mattress, post-furniture messages

---

## Items That Are N8N/Prompt-Only (no CRM changes needed)

These 50+ items are AI agent behavior rules that go into the N8N system prompt. The CRM already has all the data fields they need:

- #5-7: Consultant behavior, natural communication, short responses
- #8-12: Safety rules (never invent products, always search catalog first)
- #13-21: Sales flow steps (greeting, diagnosis, value building, objection handling, closing)
- #22-29: Diagnosis questions per room type
- #86-88: Cross-sell/upsell rules
- #89-90, 92: Logistics info rules
- #93-97: Post-sale message templates
- #98-105: Human handoff trigger rules

These need a well-crafted system prompt in N8N, not code changes here. The `regras_personalidade` field and loja config fields feed into that prompt.

## Items Requiring External Integration (future)

- #38-42: E-commerce platform sync (Shopify, Nuvemshop, Tray, VTEX, VendiZap) -- requires webhook receivers per platform
- #43-44: Real-time stock/price webhook sync -- N8N workflow
- #46, 76: Interactive "Buy Now" button -- requires WhatsApp Business API (not Baileys)
- #54: Payment link generation -- requires payment provider integration (Stripe, Mercado Pago)

---

## Implementation Order

1. DB migrations (Phase 1) -- 1 migration
2. AdminLojaDetail UI updates (Phase 2) -- expand existing tabs
3. Client pages (Phase 3) -- LojaLeads, LojaFollowups, LojaVisitas, Dashboard
4. `agent-tools` edge function (Phase 4) -- core tooling for N8N
5. Evolution API `send_media` (Phase 4) -- media sending
6. Campaigns page (Phase 5)
7. Post-sale flow (Phase 6)

### Technical Details

- All new edge functions use `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `N8N_WEBHOOK_URL` from existing secrets
- PDF generation for quotes uses a simple HTML-to-PDF approach in the edge function
- Media sending uses Evolution API `POST /message/sendMedia/{instance}` endpoint
- Follow-up scheduling writes to `follow_ups` table; N8N polls/triggers from there
- The system prompt assembly reads all `lojas` fields and formats them for the LLM context

