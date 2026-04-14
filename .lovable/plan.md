

## Plano: Página de Gestão de Workflows n8n

Criar uma página `/workflows-editor` pública (como o roadmap) onde você pode colar, editar e copiar JSONs dos workflows n8n. Foco no fix do bug de horário comercial.

### O que será feito

1. **Nova página `/workflows-editor`** — página pública sem login
   - Área de texto grande pra colar JSON do workflow
   - Botão "Colar JSON" e "Copiar JSON corrigido"
   - Validação de JSON com feedback visual
   - Seção com os fixes conhecidos pré-aplicáveis (checkbox):
     - **Fix Horário Comercial**: Corrige a lógica de comparação BRT — o bug provável é que `diasNumericos` mapeia "seg,ter,qua..." mas o campo pode estar em outro formato, ou a comparação de horário está usando string ao invés de número
   - Preview do JSON formatado com syntax highlight básico

2. **Fix automático do horário comercial** — botão que aplica o patch no JSON:
   - Localiza o node de checagem de horário no WF-01
   - Corrige a lógica de conversão UTC→BRT (garantir `getUTCHours() - 3` com wrap correto)
   - Corrige o mapeamento de dias (aceitar "seg", "segunda", "Segunda-feira" etc.)
   - Corrige comparação de horário (converter "08:00" pra minutos antes de comparar)

3. **Rota no App.tsx** — adicionar `/workflows-editor` como rota pública (igual `/roadmap`)

### Arquivos alterados
- `src/pages/WorkflowsEditor.tsx` — nova página
- `src/App.tsx` — nova rota pública

### Sobre o bug do horário comercial

Baseado na análise do WF-01, o problema mais provável é:
- A conversão UTC→BRT usa `new Date().getHours() - 3` ao invés de `getUTCHours() - 3`, que no servidor n8n pode já estar em outro timezone
- Ou o `dias_funcionamento` da loja está em formato diferente do esperado pelo mapeamento
- O fix vai normalizar ambos os lados da comparação

