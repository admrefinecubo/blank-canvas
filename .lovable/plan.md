
Objetivo: eliminar a duplicidade visual no admin e parar o “recarregamento” do app ao trocar de abas/seções administrativas.

Diagnóstico
- O shell global admin já mostra:
  - logo + “Admin Console” na sidebar
  - breadcrumb “Dashboard Admin” no header
- `AdminDashboard.tsx` ainda renderiza mais um cabeçalho interno com:
  - “Admin Console”
  - “Painel Administrativo”
  - e títulos extras por aba
- Isso não cria mais um layout inteiro, mas mantém a sensação de “admin dentro do admin”.
- O recarregamento ao trocar de aba/seção acontece porque `App.tsx` cria um `ProtectedRoute + AppLayout` separado para cada rota `/admin*`. Ao navegar entre elas, o shell inteiro desmonta e monta de novo.

O que vou ajustar
1. Unificar as rotas admin sob um único shell
- Reestruturar `App.tsx` para ter um único grupo:
  - `/admin` com `ProtectedRoute + AppLayout`
  - filhas: index, `clinic/:id`, `stats`, `lojas`, `lojas/:id`, etc.
- Resultado:
  - sidebar/header do admin permanecem montados
  - navegação entre seções fica fluida
  - reduz sensação de refresh/reload

2. Limpar o cabeçalho interno do `AdminDashboard`
- Remover textos redundantes como:
  - “Admin Console”
  - “Painel Administrativo”
  - “Painel Administrativo CUBO”
- Manter só um topo de conteúdo simples, orientado por seção:
  - resumo curto
  - tabs/botões internos se ainda fizer sentido
- Evitar repetir informação que já está no `AppLayout`

3. Deixar a troca de abas do dashboard mais estável
- Manter as abas internas (`dashboard`, `clinics`, `metrics`, `activity`) locais ao componente, sem navegação que remonte shell.
- Se necessário, sincronizar a aba com query param para preservar estado sem parecer reload, mas só se isso ficar simples e consistente com o projeto.

4. Revisar páginas admin relacionadas
- Garantir que `AdminClinicDetail` continue usando apenas conteúdo de página.
- Validar que `AdminStats` e `AdminLojas` funcionem bem como filhas do mesmo layout compartilhado.

Resultado esperado
- Só haverá um contexto visual de admin por vez.
- O topo não vai repetir “Dashboard Admin” + “Admin Console” + “Painel Administrativo” de forma confusa.
- Ao navegar entre `/admin`, `/admin/stats`, `/admin/lojas` e detalhes, a sidebar e o header não serão recriados.
- A experiência ficará mais parecida com troca de seção do que recarregamento da aplicação.

Arquivos a ajustar
- `src/App.tsx`
- `src/pages/AdminDashboard.tsx`
- possível revisão leve em:
  - `src/pages/AdminClinicDetail.tsx`
  - `src/pages/AdminStats.tsx`
  - `src/pages/AdminLojas.tsx`

Validação após implementação
- Login com `admin@gmail.com`
- Abrir `/admin`
- Confirmar que não há duplicidade de títulos admin
- Navegar entre:
  - `/admin`
  - `/admin/stats`
  - `/admin/lojas`
  - `/admin/clinic/:id`
- Confirmar que sidebar/header permanecem estáveis sem “reload”
- Testar também no mobile para garantir que o menu lateral não pisque nem feche de forma estranha
