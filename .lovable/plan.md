

## Plano: Adicionar seção "Trabalhando Agora"

Adicionar uma seção destacada logo abaixo da barra de progresso geral, mostrando todos os itens com status `in_progress` do checklist. Isso deixa claro pro patrão exatamente no que você está focado neste momento.

### O que será feito

1. **Nova seção no Roadmap** (entre a barra de progresso e os gráficos)
   - Card com ícone de pulso/atividade e título "Trabalhando Agora"
   - Lista todos os itens `in_progress` extraídos automaticamente do `checklistBlocks`
   - Cada item mostra: ícone animado ⏳, número (#), nome, descrição curta, bloco de origem e prioridade
   - Visual com borda amber/amarela pra destacar que é trabalho ativo

2. **Lógica** — `useMemo` filtrando `checklistBlocks.flatMap(b => b.items).filter(i => i.status === "in_progress")` com referência ao bloco de origem

### Arquivos alterados
- `src/pages/Roadmap.tsx` — adicionar seção entre a barra de progresso e os gráficos

