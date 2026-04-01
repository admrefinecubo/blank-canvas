
Objetivo: remover completamente o white label, fixar a marca LojaADS em toda a aplicação, reduzir remount/reload visual na navegação, padronizar scroll de modais e alinhar o detalhe da loja com os nomes reais das colunas da tabela `lojas`.

1. Remover white label e fixar a marca LojaADS
- Excluir o `WhiteLabelProvider` do `App.tsx`.
- Remover `src/contexts/WhiteLabelContext.tsx` do fluxo e parar de usar dados de branding vindos de `clinics`.
- Atualizar `AppLayout.tsx` e `Login.tsx` para usar branding fixo:
  - logo: bloco azul com “L”
  - título: `LojaADS`
  - subtítulo: `CRM`
- No cliente, adicionar abaixo da marca um bloco de contexto da loja:
  - `Loja: {nome_da_loja}`
- Parar de usar `clinicName`, `clinicSubtitle`, `logoUrl`, `faviconUrl`, `primaryColor` no frontend.
- Ajustar `document.title` para algo fixo/coerente com LojaADS.

2. Limpar a tela Configurações
- Remover totalmente a aba “White Label” e toda a UI de logo, favicon, cor primária, nome da marca e subtítulo.
- Remover uploads para `clinic-assets` dessa área.
- No modo cliente, deixar apenas:
  - nome da loja
  - telefone
  - e-mail
  - horário de funcionamento
- Aplicar sua decisão:
  - nome/telefone/e-mail em somente leitura
  - horário editável
- No modo admin, manter configurações operacionais e equipe, mas sem qualquer personalização visual da plataforma.

3. Corrigir o “recarregamento” ao trocar de abas/rotas
Diagnóstico encontrado no código:
- `AppLayout` ainda anima o conteúdo do `<Outlet />` com wrapper próprio (`animate-fade-in`), o que reforça sensação de reload a cada troca.
- React Query está sem `staleTime`, então várias páginas refazem fetch imediatamente ao remount.
- Há navegação com `window.location.href` em `Settings.tsx`, causando navegação dura.
Plano:
- Remover o wrapper animado ao redor do `<Outlet />` em `AppLayout.tsx`.
- Configurar `QueryClient` com defaults mais estáveis (`staleTime`, possivelmente `refetchOnWindowFocus: false`) para reduzir refetch agressivo.
- Trocar `window.location.href = "/whatsapp"` por navegação do router.
- Revisar queries críticas de admin/cliente para manter cache entre trocas de rota.
- Onde houver abas internas importantes, usar estado controlado/estável para não reinicializar desnecessariamente.

4. Garantir scroll em modais
Diagnóstico encontrado:
- Vários `DialogContent` ainda estão sem altura máxima e sem overflow.
Plano:
- Padronizar `DialogContent` base em `src/components/ui/dialog.tsx` para já nascer com comportamento seguro:
  - `max-h-[85vh]`
  - `overflow-y-auto`
- Revisar modais maiores que usam layout interno flex/scroll para não quebrar.
- Ajustar ocorrências mais críticas já mapeadas:
  - edição no `AdminDashboard`
  - criação/vínculo em `AdminLojas`
  - formulários em `LojaCatalogo`, `Procedures`, `NpsSatisfaction`, `Automations`, `Agenda`, `Settings`, `WhatsApp`

5. Expandir detalhe da loja admin com os campos reais do banco
Diagnóstico encontrado:
- `AdminLojaDetail.tsx` já cobre parte dos campos, mas está usando nomes errados em alguns pontos:
  - usa `maps_link`, mas a coluna real é `link_google_maps`
  - usa `checkout_base_url`, mas a coluna real é `url_base_checkout`
- Há campos extras não pedidos e ausência de foco na estrutura para n8n.
Plano:
- Reorganizar `AdminLojaDetail.tsx` em 4 abas:
  - Identidade
  - Operação
  - Integrações
  - Automações
- Garantir edição dos campos com nomes exatos da tabela `lojas`:
  - `nome_loja`
  - `nome_assistente`
  - `tom_voz`
  - `especialidades`
  - `regras_personalidade`
  - `instance`
  - `horario_inicio`
  - `horario_fim`
  - `endereco`
  - `link_google_maps`
  - `formas_pagamento`
  - `politica_troca`
  - `prazo_entrega`
  - `frete_gratis_acima`
  - `montagem_disponivel`
  - `plataforma_ecommerce`
  - `url_base_checkout`
  - `desconto_carrinho_abandonado`
  - `desconto_promocao_nao_respondida`
- Corrigir labels para os nomes que você quer mostrar, mas persistindo exatamente nas colunas do Supabase.
- Remover ou rebaixar campos não citados por você se não forem essenciais nessa tela.

6. Ajustar a experiência visual do cliente
- Em `AppLayout.tsx`, usar a mesma marca fixa LojaADS para admin e cliente.
- Exibir contexto da loja do cliente abaixo da marca, sem substituir a marca da plataforma.
- Garantir que a cor principal e destaques permaneçam azuis do tema global do `index.css`.
- Revisar se algo ainda está puxando cor/nome da clínica e eliminar essa dependência.

7. Alinhar a página Admin Lojas com o detalhe/configuração
- Manter a listagem de lojas operacionais em `AdminLojas.tsx`.
- Atualizar criação rápida para usar campos coerentes com o detalhe da loja.
- Ajustar o modal de criação para scroll seguro.
- Se útil, mostrar um resumo dos campos de integração principais na tabela/lista sem expor configuração demais.

8. Validação após implementação
- Login admin:
  - conferir sidebar com `LojaADS / CRM`
  - entrar em `/admin/lojas`
  - abrir `/admin/lojas/:id`
  - editar todos os campos e confirmar persistência
- Login cliente:
  - conferir sidebar com `LojaADS / CRM`
  - conferir bloco `Loja: Conforto`
  - conferir que nome/telefone/e-mail ficam somente leitura
  - conferir que horário pode ser editado
- Navegação:
  - trocar entre `/admin`, `/admin/lojas`, `/admin/stats`, detalhe da loja e páginas do cliente
  - confirmar ausência de flash branco/reload perceptível
- Modais:
  - abrir modais longos em viewport menor e validar scroll até o final
- Integração n8n:
  - confirmar que o frontend salva nas colunas exatas de `lojas`, especialmente `link_google_maps` e `url_base_checkout`

Detalhes técnicos
```text
Problemas concretos encontrados no código:
- White label ativo em:
  - src/App.tsx
  - src/contexts/WhiteLabelContext.tsx
  - src/components/AppLayout.tsx
  - src/pages/Login.tsx
  - src/pages/Settings.tsx
- Sensação de reload reforçada por:
  - wrapper animate-fade-in no Outlet em AppLayout
  - QueryClient sem staleTime global
  - uso de window.location.href em Settings
- Nomes incorretos no detalhe da loja:
  - maps_link -> correto: link_google_maps
  - checkout_base_url -> correto: url_base_checkout
- Dialog base sem proteção global de max-height/overflow
```

Arquivos principais a ajustar
- `src/App.tsx`
- `src/contexts/WhiteLabelContext.tsx`
- `src/components/AppLayout.tsx`
- `src/pages/Login.tsx`
- `src/pages/Settings.tsx`
- `src/pages/AdminLojas.tsx`
- `src/pages/AdminLojaDetail.tsx`
- `src/components/ui/dialog.tsx`
- possivelmente páginas com modais longos:
  - `src/pages/LojaCatalogo.tsx`
  - `src/pages/AdminDashboard.tsx`
  - `src/pages/Procedures.tsx`
  - `src/pages/NpsSatisfaction.tsx`
  - `src/pages/Automations.tsx`
  - `src/pages/Agenda.tsx`
  - `src/pages/WhatsApp.tsx`
