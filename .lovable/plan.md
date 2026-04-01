
Objetivo: corrigir o problema de “2 admin juntas” removendo a duplicidade de layout no fluxo admin.

Diagnóstico
- O problema não está no login em si.
- A rota `/admin` já renderiza `AppLayout`.
- Dentro dessa rota, `AdminDashboard` também renderiza outro layout completo próprio, com sidebar + header + conteúdo.
- Resultado: a interface mostra o shell global do app e, dentro dele, um segundo shell admin.
- O mesmo padrão duplicado existe em `AdminClinicDetail`, então ele também precisa ser alinhado.

O que vou ajustar
1. Unificar o layout do admin
- Manter `AppLayout` como shell principal para páginas administrativas protegidas.
- Remover de `AdminDashboard` a estrutura full-screen própria:
  - sidebar lateral interna
  - header interno redundante
  - wrappers `h-screen`, `overflow-hidden`, etc.
- Transformar `AdminDashboard` em conteúdo de página normal dentro do `<Outlet />`.

2. Preservar a navegação admin sem duplicar shell
- Migrar a navegação interna do dashboard admin para componentes de conteúdo da própria página:
  - abas/seções (“Dashboard”, “Lojas”, “Métricas”, “Atividade”) continuam existindo
  - mas sem criar uma segunda sidebar estrutural
- Manter os links principais do admin no menu do `AppLayout`.

3. Corrigir páginas admin fora do padrão
- Refatorar `AdminClinicDetail` para também usar o shell principal em vez de desenhar uma tela administrativa separada.
- Revisar se a experiência de “Entrar no CRM” e “Voltar” continua funcionando após a padronização.

4. Revisar rotas administrativas
- Validar a organização atual das rotas `/admin`, `/admin/stats`, `/admin/lojas` e `/admin/clinic/:id`.
- Se necessário, consolidar mais rotas sob um padrão único com layout compartilhado, para evitar novos casos de tela duplicada.

Resultado esperado
- Ao entrar como admin, haverá apenas:
  - 1 sidebar principal
  - 1 header principal
  - 1 área de conteúdo
- A página `/admin` deixará de parecer “uma tela dentro de outra”.
- O fluxo admin ficará consistente com o restante do app.

Detalhes técnicos
```text
Hoje:
ProtectedRoute(admin)
  -> AppLayout
      -> AdminDashboard
          -> Sidebar própria
          -> Header próprio
          -> Conteúdo

Depois:
ProtectedRoute(admin)
  -> AppLayout
      -> AdminDashboard
          -> Conteúdo/abas/cards apenas
```

Arquivos a ajustar
- `src/pages/AdminDashboard.tsx`
- `src/pages/AdminClinicDetail.tsx`
- possivelmente `src/App.tsx` para consolidar melhor as rotas admin, se necessário

Validação após implementação
- Login com `admin@gmail.com`
- Abrir `/admin`
- Confirmar que só existe um layout admin visível
- Navegar para lojas, detalhe da loja e stats
- Testar responsividade básica para garantir que nada quebrou no mobile
