

# Plano: Melhorar Dias de Funcionamento com Checkboxes e Horários por Dia

## O que muda

Substituir o campo de texto "Dias de Funcionamento" por checkboxes com nomes completos dos dias da semana, e permitir horários personalizados por dia (ex: Domingo das 10:00 às 14:00).

## Onde será alterado

1. **Constante WEEKDAYS compartilhada** — extrair para um arquivo utilitário (`src/lib/constants.ts`) com nomes completos:
   - `{ value: "dom", label: "Domingo" }`, `{ value: "seg", label: "Segunda-feira" }`, etc.

2. **`src/components/LojaOnboardingWizard.tsx`** (Etapa 2):
   - Substituir o `<Input>` de `dias_funcionamento` por checkboxes com os 7 dias (nomes completos)
   - Manter `horario_inicio` e `horario_fim` como horário padrão
   - Adicionar campo opcional de horário diferente por dia: ao marcar um dia, permitir clicar em "Horário especial" para definir horário específico (ex: Domingo 10:00-14:00)
   - Armazenar horários especiais como JSON em um campo `horarios_especiais` (ex: `{"dom": {"inicio": "10:00", "fim": "14:00"}}`)

3. **`src/pages/Settings.tsx`**:
   - Atualizar WEEKDAYS para usar nomes completos
   - Adicionar a mesma lógica de horários especiais por dia (inputs de horário que aparecem ao lado de cada dia marcado)

4. **`src/pages/AdminLojaDetail.tsx`**:
   - Aplicar o mesmo padrão de checkboxes com nomes completos + horários por dia

5. **Migration Supabase**: Adicionar coluna `horarios_especiais JSONB DEFAULT '{}'` na tabela `lojas` para guardar horários diferenciados por dia.

## Formato de dados

- `dias_funcionamento`: continua como texto CSV (`"seg,ter,qua,qui,sex,sab"`) — sem quebra de compatibilidade com workflows
- `horarios_especiais`: novo campo JSONB — `{"dom": {"inicio": "10:00", "fim": "14:00"}}` — só dias com horário diferente do padrão

## UX

- Cada dia é um checkbox com nome completo (Segunda-feira, Terça-feira...)
- Ao marcar um dia, aparece opcionalmente dois inputs de horário inline (se diferente do padrão)
- Os horários padrão (`horario_inicio`/`horario_fim`) continuam existindo como "Horário geral"
- Label: "Horário especial" com toggle para expandir os campos de hora naquele dia

