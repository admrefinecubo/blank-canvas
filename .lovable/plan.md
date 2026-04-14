

# Fix: Campanha marcada como disparada sem enviar nada

## Problemas identificados

1. **Validação ausente na criação**: O formulário permite criar campanha com `segment_type: "etapa_pipeline"` sem selecionar uma etapa — resultando em `segment_config: {}` vazio
2. **Edge function não envia os contatos**: O `campaign-dispatch` envia apenas o nome do segmento ao N8N, sem os telefones dos leads. O N8N recebe `segmento: null` e não sabe pra quem enviar
3. **Sucesso falso**: A edge function marca como "disparada" mesmo quando o webhook provavelmente não fez nada

## Correções

### 1. Validação no frontend (`LojaCampanhas.tsx`)
- Bloquear criação se `segment_type` != "todos" e `segment_value` estiver vazio
- Mostrar erro: "Selecione um valor para o segmento"

### 2. Edge function envia lista de telefones (`campaign-dispatch/index.ts`)
- Antes de chamar o webhook, buscar os leads filtrados pelo `segment_type` + `segment_config`
- Enviar array de `{nome, telefone}` no payload do webhook para o N8N
- Incluir `targeted_leads_count` real baseado na query

### 3. Validação na edge function
- Se nenhum lead for encontrado pelo filtro, retornar erro em vez de sucesso
- Só marcar como "disparada" se houver leads para enviar

## Arquivos alterados
- `src/pages/LojaCampanhas.tsx` — adicionar validação de segment_value obrigatório
- `supabase/functions/campaign-dispatch/index.ts` — buscar leads, enviar telefones no payload, validar que existem leads

