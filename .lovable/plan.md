
Diagnóstico rápido: o JSON que você testou ainda parece ser uma versão antiga do WF-01, porque o `_debug_horario.dias_func_db` veio `null`, enquanto o workflow corrigido que já está no projeto hoje retornaria esse campo preenchido de outro jeito. Então o problema não é só a lógica — falta deixar o editor como fonte única e rastreável do workflow corrigido.

### Plano
1. **Transformar o Workflows Editor em repositório de workflows**
   - Adicionar upload de `.json` + colar JSON
   - Salvar workflows no navegador com nome/slot (ex.: WF-01 atual, WF-01 corrigido)
   - Permitir abrir um workflow salvo direto no editor, sem depender do chat

2. **Criar patch específico e verificável do WF-01**
   - Aplicar fix no node `Code - Checar Horário + Montar Contexto do Agente`
   - Garantir `dentroHorario` + `dentro_horario` no retorno
   - Corrigir `dias_funcionamento` com parse robusto e debug mostrando o valor parseado de verdade
   - Corrigir o IF `Dentro do Horário` para validação booleana estrita

3. **Adicionar diagnóstico visual no editor**
   - Mostrar se o workflow carregado está “desatualizado”, “corrigido” ou “não reconhecido”
   - Exibir quais nodes foram encontrados e alterados
   - Mostrar um resumo do branch crítico: `Code horário -> IF dentro horário -> mensagem fora de horário`

4. **Deixar o WF-01 corrigido disponível dentro do próprio editor**
   - Atualizar o preset carregado na seção de workflows prontos
   - Incluir versão/assinatura do patch para você saber que está importando o JSON certo no n8n

5. **Evitar retrabalho no próximo envio**
   - Quando você mandar JSON no chat ou colar no editor, eu passo a deixar o resultado salvo lá no `/workflows-editor`, pronto para preview e cópia, em vez de responder com JSON no chat

### Arquivos que vou alterar
- `src/pages/WorkflowsEditor.tsx`
- `public/workflows/WF-01-fixed.json`
- possivelmente um helper novo para centralizar patches, ex.: `src/lib/workflow-patches.ts`
