

# Plano: Melhorar UX de Campanhas

## Duas alterações

### 1. Filtro de segmentação com opções clicáveis (não digitação livre)

Quando o usuário seleciona "Por etapa do funil", mostrar um `Select` com as etapas já conhecidas (`LEAD_STAGE_OPTIONS` de `whatsapp-admin.ts`): Novo Lead, Qualificado, Orçamento, Negociação, Fechado, Perdido.

Quando seleciona "Por origem", buscar valores distintos de `leads.origem` no banco e popular um `Select`.

Quando seleciona "Por interesse", buscar valores distintos de `leads.interesse` no banco e popular um `Select`.

Assim o usuário só clica, sem digitar.

### 2. Listar contatos no aviso de disparo

Ao clicar "Disparar" numa campanha, antes de confirmar:
- Buscar os leads que serão atingidos (usando `segment_type` + `segment_config` da campanha)
- Mostrar a lista com nome e telefone no `AlertDialog` (com scroll, max ~10 visíveis)
- Exibir o total no topo: "X leads receberão esta campanha"

### Arquivos alterados

- `src/pages/LojaCampanhas.tsx`:
  - Adicionar query para buscar valores distintos de `origem` e `interesse` da tabela `leads`
  - Substituir `Input` do filtro por `Select` condicional (etapa_pipeline usa constante local, origem/interesse usam dados do banco)
  - Adicionar query que carrega leads do segmento quando `confirmDispatch` é setado
  - Renderizar lista de leads (nome + telefone) dentro do `AlertDialogDescription`

### Detalhes técnicos

```
Segmentação "etapa_pipeline" → Select com LEAD_STAGE_OPTIONS (constante)
Segmentação "origem"         → Select com distinct leads.origem WHERE loja_id = X
Segmentação "interesse"      → Select com distinct leads.interesse WHERE loja_id = X

Disparo confirm → query leads filtrados pelo segment_config da campanha
                → ScrollArea com lista de nomes/telefones
```

Nenhuma migration necessária. Apenas alteração de UI no `LojaCampanhas.tsx`.

