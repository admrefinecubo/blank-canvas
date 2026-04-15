

# Plano: Gerar Fila de Prompts para Sincronizar Workflows ↔ Supabase ↔ CRM

Vou gerar um arquivo `/mnt/documents/FILA_PROMPTS.md` com dois blocos:

## Bloco A — Prompts para Claude (alterações nos workflows n8n)

São prompts que você cola no Claude que tem acesso à pasta `workflows/`. Cada prompt é autocontido e referencia o workflow específico.

### Prompt Claude #1: Segurança — Migrar keys hardcoded para Credentials
- Em TODOS os workflows, trocar headers/campos com `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `EVOLUTION_API_KEY` hardcoded por **Predefined Credential Type** (Supabase API, Header Auth p/ OpenAI, Header Auth p/ Evolution)
- Remover campos `supabase_key`, `openai_key` dos inputs de sub-workflows

### Prompt Claude #2: WF-01 — Corrigir on_conflict do Lead Upsert
- Trocar `on_conflict=telefone,instance` por `on_conflict=loja_id,telefone`

### Prompt Claude #3: WF-02 — Corrigir query do Follow-up com JOIN
- A query Supabase precisa fazer `select=*,leads(*),lojas(*)` ou equivalente
- O Code node precisa referenciar `item.leads.nome`, `item.leads.telefone`, etc.

### Prompt Claude #4: WF-01 — Enriquecer System Prompt
- Adicionar roteiros de diagnóstico por ambiente (sala, quarto, jantar, colchões, planejados)
- Regras de cross-sell, objeções, logística, nunca inventar produtos
- Todas as regras comportamentais dos itens 5-7, 8, 11-29 do checklist

### Prompt Claude #5: Anti-spam — Delay entre envios de mídia
- No WF-04 ou no WF-01, adicionar Wait node de 1.5s entre envios de mídia consecutivos

### Prompt Claude #6: Descontinuar WF-06 e WF-07 RAG
- Marcar como inativos ou remover da pasta
- Garantir que WF-01 usa apenas WF-03 (RAG) e WF-04 (mídia)

## Bloco B — Prompts para Lovable (alterações no CRM/Supabase)

São prompts que você me envia aqui no Lovable, em fila.

### Prompt Lovable #1: Migration `external_id` + `plataforma`
- Adicionar colunas + unique index na tabela `produtos`

### Prompt Lovable #2: Unificar `nome_assistente` / `nome_assistente_ia`
- Deprecar `nome_assistente`, usar apenas `nome_assistente_ia` em todo o CRM

### Prompt Lovable #3: Onboarding Wizard
- Criar wizard de 4-5 passos pós-primeiro-login para loja preencher campos essenciais

### Prompt Lovable #4: Implementar `gerar_cobranca` funcional
- Integrar edge function agent-tools com checkout_url do produto como fallback

### Prompt Lovable #5: Atualizar auditoria e roadmap
- Marcar itens concluídos conforme formos resolvendo

## Implementação
- Um único arquivo `.md` em `/mnt/documents/FILA_PROMPTS.md`
- Cada prompt é copiar-colar direto, autocontido
- Instruções claras de qual enviar primeiro

