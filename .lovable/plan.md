

# Limpeza: Settings do Admin vs Lojista

## Problemas encontrados

1. **"Implantação / Equipe"** no sidebar do admin (`AppLayout.tsx` linha 36) aponta para `/settings` — que é a página do **lojista**. Admin não deveria ver essa página.

2. **"Agente de IA"** aparece em `/settings` (tab visível para todos, incluindo admin). Essa config é **exclusiva do lojista** — o admin já configura o agente dentro de `/admin/lojas/:id` na tab "Identidade".

3. **LGPD** — tab desnecessária. Remover de `AdminLojaDetail.tsx`.

4. **Metas** — deveria estar no CRM do lojista (`/configuracoes` ou como seção dedicada), não no admin. O admin não define metas, o lojista sim.

## Mudanças

### `src/components/AppLayout.tsx`
- Remover o item **"Implantação / Equipe"** do menu `adminLinks` (linha 36). O admin gerencia equipe dentro de `/admin/lojas/:id` tab Equipe.

### `src/pages/Settings.tsx` (página do lojista `/configuracoes`)
- Manter tab **Conta** (dados read-only + horário)
- **Remover tab "Agente de IA"** — o lojista não precisa configurar tom de voz, regras de personalidade, etc. Isso é responsabilidade do admin via `/admin/lojas/:id`
- **Adicionar tab "Metas"** — reutilizar `AdminTabMetas` passando o `clinicId` do lojista, para que ele defina suas próprias metas de receita

### `src/pages/AdminLojaDetail.tsx`
- **Remover tab LGPD** (não necessário)
- **Remover tab Metas** (migra pro lojista)
- Manter: Identidade, Operação, Integrações, Automações, Equipe, Pós-Venda, Auditoria

### Arquivos alterados
1. `src/components/AppLayout.tsx` — remover "Implantação / Equipe" do sidebar admin
2. `src/pages/Settings.tsx` — remover "Agente de IA", adicionar "Metas"
3. `src/pages/AdminLojaDetail.tsx` — remover tabs LGPD e Metas

