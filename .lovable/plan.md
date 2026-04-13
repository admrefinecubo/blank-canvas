
Objetivo
- Eliminar o efeito “conteúdo aparece primeiro e só depois anima” ao trocar os módulos da sidebar.

Causa provável
- Hoje o `AnimatePresence` está envolvendo um `<Outlet />` direto.
- Quando a rota muda, o container antigo começa a sair, mas o `Outlet` já pode renderizar o conteúdo novo dentro dele por um frame.
- Isso gera exatamente o flash que você está vendo.

Plano de implementação

1. Congelar a rota anterior durante a saída
- Em `src/components/AppLayout.tsx`, substituir o uso direto de `<Outlet />` por um wrapper com `useOutlet()` + `useState`.
- Esse wrapper vai “congelar” o módulo atual no momento do mount, então a página antiga termina a animação de saída sem ser trocada pelo conteúdo novo no meio.
- Manter `AnimatePresence mode="wait"`.

2. Ajustar a chave e a transição do container principal
- Usar uma `key` única por rota, baseada em `pathname` (e `search`, se necessário).
- Aplicar no container principal:
  - `initial={{ opacity: 0, y: 10 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `exit={{ opacity: 0, y: 10 }}`
  - `transition={{ duration: 0.3, ease: "easeInOut" }}`
- Isso garante que o novo módulo já monte invisível e só apareça animando.

3. Garantir consistência em páginas com loading
- Revisar primeiro as páginas mais sensíveis:
  - `src/pages/LojaLeads.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/AdminDashboard.tsx`
- Se o loading interno ainda causar “pop-in”, envolver loading e conteúdo final no mesmo shell visual ou usar skeletons para manter a transição constante desde o primeiro frame.

4. Validar a navegação entre módulos
- Conferir a troca entre dashboard, leads, whatsapp, catálogo, follow-ups, visitas, campanhas e admin.
- Validar que:
  - o conteúdo antigo some completamente antes do novo entrar
  - não existe flash
  - não há salto de layout
  - a animação acontece desde o mount, e não depois

Detalhes técnicos
- O problema central não é apenas timing de animação; é a troca prematura do conteúdo do `Outlet`.
- `AnimatePresence` com `mode="wait"` funciona melhor aqui se o elemento da rota anterior for preservado até o fim do `exit`.
- A correção principal será no `AppLayout`; os ajustes nas páginas entram só se algum loading ainda estiver aparecendo “seco”.

Arquivos previstos
- `src/components/AppLayout.tsx`
- Possivelmente também:
  - `src/pages/LojaLeads.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/AdminDashboard.tsx`
