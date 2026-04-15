

# Plano: Auditoria Completa — Checklist + Workflows + CRM

Vou gerar um `.md` detalhado em `/mnt/documents/` com a auditoria completa cobrindo:

## O que o documento vai conter

### 1. Checklist dos 109 itens com status atualizado
Cruzamento de cada item do checklist com:
- O que já existe no Supabase (tabelas, colunas, RLS)
- O que já existe nos workflows N8N (WF-00 a WF-14)
- O que já existe no CRM/frontend (Settings, LojaLeads, etc.)

### 2. Problemas encontrados nos workflows

**Bugs/Riscos identificados:**
- **WF-07 (Sync E-commerce)**: Faz upsert usando `external_id`, mas a tabela `produtos` no Supabase **não tem coluna `external_id` nem `plataforma`** — o upsert vai falhar. Migration necessária.
- **WF-06 vs WF-04**: Dois workflows de envio de mídia com abordagens diferentes. WF-04 é o principal (usado pelo WF-01). WF-06 é legado (busca por `produto_id` com `supabase_key` vinda do input — frágil). WF-06 deve ser descontinuado.
- **WF-07 vs WF-03**: Dois workflows de busca RAG. WF-03 é o principal (usado pelo WF-01, com embedding real). WF-07 é legado (espera `openai_key` e `supabase_key` no input). WF-07 deve ser descontinuado.
- **Service role key exposta**: Vários workflows têm a service_role_key hardcoded no JSON. Risco de segurança se os JSONs forem versionados.
- **OpenAI API key exposta**: WF-03, WF-07, WF-11 têm API key hardcoded.
- **WF-02 (Follow-up Cron)**: Busca `follow_ups` mas o Code node referencia campos como `tipo_followup`, `mensagem_template`, `nome`, `interesse`, `instance`, `telefone` — estes vêm da tabela `follow_ups` que **não tem** esses campos (precisaria JOIN com `leads` + `lojas`). O workflow provavelmente falha silenciosamente.
- **WF-01 Lead Upsert**: Usa `on_conflict=telefone,instance` mas a constraint única real na tabela `leads` é `loja_id,telefone` — possível conflito.

### 3. O que falta no CRM/Frontend
- **Onboarding wizard**: Não existe fluxo de onboarding para loja preencher todos os campos do Supabase (endereço, maps_link, formas_pagamento, etc.)
- **Campo webhook read-only na aba Integrações** com URL dinâmica do sync
- **Página de Pós-Venda** (`LojaPosVenda.tsx`) — verificar se tem conteúdo funcional
- **NPS pelo WhatsApp** — a coluna `nps_score`/`nps_comentario` existe em leads mas não há trigger automático

### 4. O que está duplicado
- `WF-06` e `WF-04`: mesma função (enviar mídia)
- `WF-07` e `WF-03`: mesma função (buscar produto RAG)
- `nome_assistente` e `nome_assistente_ia` na tabela `lojas` — confuso

### 5. Otimizações sugeridas
- Adicionar `external_id` e `plataforma` à tabela `produtos` (necessário pro WF-07)
- Criar unique constraint `(external_id, loja_id)` para upsert funcionar
- Wizard de onboarding pós-cadastro da loja
- Limpar workflows legados (WF-06, WF-07 antigo)

## Implementação
1. Gerar o arquivo `/mnt/documents/AUDITORIA_COMPLETA.md` via script Python
2. Incluir todas as 109 linhas do checklist com ✅/⚠️/❌
3. Seções separadas para Bugs, Duplicatas, Gaps do CRM, Otimizações

Não vou alterar nenhum arquivo do projeto — apenas gerar o documento de auditoria.
