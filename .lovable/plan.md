

# Diagnóstico: Referências "Clinic" e "CUBO" no projeto

## O que encontrei

### A tabela `clinics` NÃO é de clínicas médicas
A tabela `clinics` é usada como **camada de contas/tenants** do sistema multi-tenant. Cada "clinic" = uma **conta de cliente** (lojista) que possui lojas. A relação é:
- `clinics` → conta do lojista (nome, email, status)
- `lojas` → loja vinculada via `clinic_id`
- Todas as tabelas de negócio (patients, budgets, appointments, etc.) usam `clinic_id` para isolamento

**Não é seguro simplesmente deletar** — `clinic_id` é a chave de todo o sistema de permissões (RLS), autenticação e multi-tenancy.

### Tabelas que usam `clinic_id` (14 tabelas)
`appointments`, `audit_logs`, `automations`, `budgets`, `clinic_integrations`, `clinics`, `consent_terms`, `financial_installments`, `nps_responses`, `patients`, `post_procedure_templates`, `procedures`, `profiles`, `revenue_goals`

### Tabelas que parecem legado clínico (sem uso real no fluxo de lojas)
Estas tabelas existem no banco mas **não são usadas pelo fluxo de vendas/agente/loja**:
1. `appointments` — agendamentos médicos (o sistema de visitas real usa `visitas`)
2. `procedures` — procedimentos médicos (o catálogo real usa `produtos`)
3. `consent_terms` / `patient_consents` — termos de consentimento médico
4. `post_procedure_templates` — templates pós-procedimento médico
5. `patients` — usado como "clientes", mas duplica a funcionalidade de `leads`
6. `budgets` / `financial_installments` — orçamentos genéricos (vendas reais usam `vendas`)

### Referências "CUBO" (8 arquivos, 45 ocorrências)
- `index.html` — `cubo-theme` no localStorage
- `src/main.tsx` — `cubo-theme`
- `src/components/ThemeToggle.tsx` — `cubo-theme`
- `src/pages/Roadmap.tsx` — footer "CUBO Consultoria"
- `src/lib/handoff.ts` — URL `n8n.refinecubo.com.br`
- `supabase/functions/agent-tools/index.ts` — URL `evoapi.refinecubo.com.br`
- `supabase/functions/evolution-api/index.ts` — URL `evoapi.refinecubo.com.br`
- `PROJETO_DOCUMENTACAO.md` — `cubo-whitelabel`

### Resumo numérico
| Categoria | Quantidade |
|-----------|-----------|
| Tabelas com `clinic_id` | 14 |
| Tabelas legado clínico (candidatas a remoção) | 6 |
| Arquivos com referência "CUBO" | 8 |
| Arquivos com referência "clinic" | 30 |
| Páginas médicas (Patients, Procedures, etc.) | ~8 páginas |

## O que proponho fazer

### Fase 1 — Limpeza segura e imediata
1. **Renomear `cubo-theme` → `lojaads-theme`** em `index.html`, `main.tsx`, `ThemeToggle.tsx`
2. **Remover "CUBO Consultoria"** do footer do Roadmap, substituir por "LojaADS"
3. **Remover URLs hardcoded `refinecubo.com.br`** — usar as env vars que já existem (`EVOLUTION_API_URL`, `N8N_WEBHOOK_URL`)

### Fase 2 — Renomear conceito "clinic" → "conta" (refactor maior)
Renomear a tabela `clinics` para `contas` e `clinic_id` para `conta_id` em todo o sistema. Isso envolve:
- Migration SQL para renomear tabela e colunas
- Atualizar todas as funções RLS (`has_clinic_access` → `has_conta_access`)
- Atualizar AuthContext, todas as páginas, edge functions
- **Risco**: alto, afeta 30+ arquivos e toda a camada de segurança

### Fase 3 — Remover páginas/tabelas médicas não utilizadas
Remover as páginas e tabelas que não fazem sentido para loja de móveis:
- Páginas: `Patients.tsx`, `PatientDetail.tsx`, `PatientPipeline.tsx`, `Procedures.tsx`, `Agenda.tsx`, `BudgetPipeline.tsx`
- Tabelas (migration): `appointments`, `procedures`, `consent_terms`, `patient_consents`, `post_procedure_templates`
- Manter `patients` renomeada como tabela de backup (ou migrar dados para `leads`)

### Recomendação
**Fazer Fase 1 agora** (risco zero, limpeza rápida). Fases 2 e 3 são refactors grandes que devem ser feitos com cuidado para não quebrar o sistema em produção.

## Detalhes técnicos
- Fase 1: 6 arquivos editados, sem migration
- Fase 2: ~35 arquivos + 1 migration grande + atualizar edge functions
- Fase 3: ~8 páginas removidas + 1 migration para drop tables + atualizar App.tsx routes

