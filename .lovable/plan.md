

## Problema

O `FrozenRoute` no `AppLayout` já aplica `initial={{ opacity: 0, y: 10 }}` na página inteira, mas os cards internos têm sua própria animação CSS (`animate-fade-in [animation-fill-mode:both]`) que os força a começar invisíveis e animar independentemente com delays. Enquanto isso, textos como títulos e subtítulos não têm animação própria — então eles aparecem instantaneamente via a animação do parent, mas os cards ficam "atrasados".

O resultado: textos aparecem de uma vez, cards animam depois — fica desconexo.

## Solução

Remover as animações CSS individuais dos cards e elementos internos das páginas, deixando **apenas** a animação do `FrozenRoute` (Framer Motion) controlar a transição de toda a página de uma vez. Os cards mantêm apenas os efeitos de hover.

## Arquivos a editar

1. **`src/pages/Dashboard.tsx`**
   - `StatCard`: remover `animate-fade-in [animation-fill-mode:both]` e `style={{ animationDelay }}`
   - Links de conversas: remover `animate-fade-in [animation-fill-mode:both]` e `style={{ animationDelay }}`

2. **`src/pages/AdminDashboard.tsx`**
   - Mesma limpeza: remover `animate-fade-in`, `[animation-fill-mode:both]` e `animationDelay` de cards e linhas de tabela

3. **Outras páginas** (verificar rapidamente `LojaLeads.tsx`, `LojaCatalogo.tsx`, etc.) — remover o mesmo padrão se existir

Resultado: toda a página entra e sai como um bloco coeso, sem elementos "atrasados".

