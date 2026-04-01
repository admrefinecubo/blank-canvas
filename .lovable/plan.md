
Objetivo: implementar os gaps do módulo WhatsApp sem tocar nas tabelas do CRM, mantendo acesso apenas para `platform_admin` e reaproveitando o padrão visual/arquitetural já existente.

1. Banco de dados
- Criar uma migration para a RPC `match_produtos` usando `vector(1536)` e retorno tabular compatível com o workflow RAG.
- Criar a tabela `midias_enviadas` com colunas:
  - `id`, `loja_id`, `lead_id`, `produto_id`, `tipo`, `url`, `legenda`, `enviado_em`, `created_at`
- Ativar RLS em `midias_enviadas`.
- Ajustar a policy proposta para uma versão segura e coerente com o projeto:
  - em vez de `loja_id IN (SELECT id FROM lojas)` (que não isola acesso de verdade),
  - usar acesso total apenas para `platform_admin`, igual às demais tabelas do módulo WhatsApp.
- Incluir índices úteis para uso administrativo/integrado:
  - `midias_enviadas(loja_id, enviado_em desc)`
  - `midias_enviadas(lead_id)`
  - `midias_enviadas(produto_id)`
- Após a migration, o schema tipado deverá refletir automaticamente a nova tabela/RPC; não vou depender de edição manual do client/types gerados.

2. Navegação do módulo da loja
- Extrair/criar uma navegação interna reutilizável da loja em formato de abas/links horizontais:
  - Configuração
  - Catálogo
  - Leads
  - Conversas
  - Follow-ups
  - Visitas
- Usar essa navegação tanto em `/admin/lojas/:id` quanto nas novas páginas para manter contexto e reduzir duplicação.
- Manter breadcrumbs:
  - `Lojas > [nome_loja]`
  - `Lojas > [nome_loja] > Catálogo`
  - etc.

3. Nova página `/admin/lojas/:id/leads`
- Query em `leads` filtrando por `loja_id`.
- Tabela com colunas:
  - Nome
  - Telefone
  - Etapa Pipeline
  - Interesse
  - Última Interação
  - Origem
- Select inline para atualizar `etapa_pipeline` com:
  - `novo`, `qualificado`, `orcamento`, `negociacao`, `fechado_ganho`, `fechado_perdido`
- Clique na linha abre drawer com histórico do lead:
  - query em `historico_mensagens` por `lead_id`
  - exibição cronológica em estilo conversa
- Estados de loading/empty/error no padrão atual do app.

4. Nova página `/admin/lojas/:id/conversas`
- Query principal em `historico_mensagens` filtrada por `loja_id`.
- Busca por:
  - telefone da mensagem
  - nome do lead (join via `lead_id`)
- Layout de chat:
  - `role = 'user'` à esquerda
  - `role = 'assistant'` à direita
- Ordenação cronológica ascendente.
- Estrutura visual com cards/bolhas aderente ao tema escuro do projeto.

5. Nova página `/admin/lojas/:id/followups`
- Query em `follow_ups` filtrada por `loja_id`, com join em `leads` para nome.
- Tabela com:
  - Nome do Lead
  - Tipo
  - Agendado Para
  - Enviado?
  - Enviado Em
- Filtros:
  - por tipo
  - por status (`pendente` / `enviado`)
- Ações:
  - marcar como enviado manualmente (`enviado = true`, `enviado_em = now`)
  - cancelar = excluir registro, conforme sua resposta
- Toasts de sucesso/erro e invalidação de cache com React Query.

6. Nova página `/admin/lojas/:id/visitas`
- Query em `visitas` filtrada por `loja_id`, com join em `leads`.
- Tabela com:
  - Nome do Lead
  - Data da Visita
  - Status
  - Observações
- Select inline para atualizar status:
  - `agendada`, `confirmada`, `realizada`, `cancelada`

7. Ajuste em `/admin/lojas/:id/catalogo`
- No create/update de produto:
  - manter INSERT/UPDATE em `produtos`
  - capturar `produto_id` salvo
  - se `VITE_WF06_WEBHOOK_URL` existir, disparar POST com:
    ```json
    { "loja_id": "...", "produto_id": "...", "action": "upsert" }
    ```
- O botão “Re-indexar Embeddings” continua existindo para reprocessamento em lote.
- Tratar webhook como etapa complementar:
  - sucesso do produto não deve depender do n8n responder perfeitamente
  - mostrar toast distinto se o produto salvar mas o webhook falhar

8. Rotas
- Adicionar ao `App.tsx`:
  - `/admin/lojas/:id/leads`
  - `/admin/lojas/:id/conversas`
  - `/admin/lojas/:id/followups`
  - `/admin/lojas/:id/visitas`
- Todas protegidas por `ProtectedRoute requiredRole="platform_admin"` dentro da árvore já existente de `/admin/lojas`.

9. Padrões de implementação
- Reusar:
  - `Table`, `Card`, `Badge`, `Select`, `Dialog`, `Drawer`, `AlertDialog`, `Input`, `Tabs`
  - `useQuery` / `useMutation`
  - `toast`
- Labels e mensagens 100% em português brasileiro.
- Datas formatadas em `pt-BR`.
- Layout responsivo pensando no viewport atual e telas menores:
  - tabelas com colunas secundárias escondidas em breakpoints menores
  - drawer para detalhe de mensagens

10. Observações técnicas importantes
- Não vou alterar tabelas do CRM.
- A policy SQL enviada para `midias_enviadas` precisa ser corrigida na implementação para não abrir acesso indevido; vou alinhar com o padrão seguro já usado nas tabelas `lojas`, `produtos`, `leads`, `historico_mensagens`, `follow_ups` e `visitas`.
- A RPC `match_produtos` ficará no banco para consumo pelos workflows n8n e/ou chamadas administrativas futuras.
- Se aprovado, implemento em duas frentes:
  1) migration do banco
  2) rotas/componentes/páginas do front + ajuste do webhook no catálogo
