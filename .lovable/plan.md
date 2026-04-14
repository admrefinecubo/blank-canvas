
# Plano: melhorar o campo de mensagem e corrigir o falso “disparado”

## O que vou alterar

### 1. Transformar placeholders em botões clicáveis
No modal de criação de campanha, abaixo do campo **Template de mensagem**, vou adicionar botões/chips com as variáveis disponíveis, por exemplo:

- `{{nome}}`
- `{{desconto}}`
- `{{interesse}}`

Ao clicar em um botão, a variável será inserida automaticamente no `Textarea`, em vez de ficar apenas no placeholder.

### 2. Deixar claro quais variáveis existem
Além dos botões, o texto de apoio do campo ficará explícito, algo como:
- “Clique para inserir no texto”

Isso melhora a usabilidade e evita o usuário ter que digitar manualmente.

### 3. Corrigir o disparo com sucesso falso
Hoje o edge function `campaign-dispatch` marca a campanha como `disparada` apenas porque o webhook respondeu `200`, mesmo sem garantia de processamento real.

Vou ajustar para que:

- o frontend só mostre sucesso quando receber confirmação útil da função
- a edge function valide melhor a resposta do webhook
- a campanha só seja marcada como `disparada` quando houver evidência real de aceitação/processamento

## Ajuste técnico no backend

### Problema identificado
Pelo código atual, a função:

- busca os leads corretamente
- envia `contatos` para o `N8N_WEBHOOK_URL`
- considera sucesso se `webhookRes.ok` for true
- depois já atualiza `promotional_campaigns.status = "disparada"`

Ou seja: se o n8n devolver 200 mas não executar nada de fato, o sistema mesmo assim marca como disparada.

### Correção proposta
Vou tornar o contrato mais rígido:

- ler o JSON retornado pelo webhook
- exigir uma flag de sucesso explícita, por exemplo `success: true`, `accepted: true` ou um identificador de execução
- se o webhook não devolver confirmação válida, retornar erro e **não** atualizar a campanha para `disparada`

## Arquivos envolvidos

- `src/pages/LojaCampanhas.tsx`
  - adicionar botões de variáveis abaixo do `Textarea`
  - criar helper para inserir token no texto atual
  - melhorar label/texto de apoio
  - opcionalmente mostrar erro mais claro quando o disparo falhar

- `supabase/functions/campaign-dispatch/index.ts`
  - validar melhor a resposta do webhook
  - só atualizar status quando houver confirmação real
  - retornar mensagem de erro mais específica quando o n8n apenas responder sem efetivar

## Observação importante
Se o webhook do n8n hoje **não retorna nenhum JSON de confirmação**, vou adaptar a função para falhar com mensagem clara até esse retorno existir. Assim o CRM para de mentir que disparou quando não disparou.

## Resultado esperado

### Na UI
```text
Template de mensagem
[ textarea ]

Variáveis disponíveis:
[nome] [desconto] [interesse]
```

Clique em uma variável:
```text
Olá {{nome}}! Temos uma promoção de {{desconto}}% em {{interesse}}.
```

### No disparo
- Se o webhook aceitar de verdade: campanha vira `disparada`
- Se o webhook só responder vazio/genérico: campanha continua sem disparo e mostra erro

## Ordem de execução
1. Ajustar UX do campo de mensagem com botões de variáveis
2. Endurecer validação da resposta do webhook no `campaign-dispatch`
3. Melhorar mensagens de erro para o usuário
4. Testar o fluxo de criação + confirmação + disparo real

## Detalhes técnicos
- Os botões podem usar `Button` com `variant="outline"` ou estilo de chip
- A inserção pode ser no fim do texto inicialmente, sem complicar com posição do cursor
- Variáveis sugeridas iniciais: `{{nome}}`, `{{desconto}}`, `{{interesse}}`
- Se houver outras variáveis aceitas pelo workflow, posso incluir também
