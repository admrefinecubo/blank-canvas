

# Auditoria: Configurações Admin — Problemas Encontrados

## Diagnóstico

A página `/configuracoes` (Settings.tsx) é **compartilhada** entre admin e cliente. A lógica `showAdminControls = isPlatformAdmin && appMode === "admin"` decide quais tabs aparecem. Quando o admin acessa, ele vê: **Conta, Equipe, Metas, Pós-Venda, Integrações, LGPD, Auditoria**.

### Problemas identificados:

**1. Duplicação com AdminLojaDetail** — O admin tem `/admin/lojas/:id` (AdminLojaDetail.tsx) com abas completas: Configuração, Catálogo, Leads, Conversas, Follow-ups, Visitas. Porém a página `/configuracoes` TAMBÉM mostra controles admin (Equipe, Integrações, etc.) criando **duas interfaces diferentes para gerenciar a mesma coisa**. O admin não sabe onde ir.

**2. Integrações duplicadas e confusas** — A tab "Integrações" no Settings mostra: WhatsApp status, Google Calendar (com tutorial técnico de Google Cloud Console), e E-commerce. Mas o WhatsApp já é gerenciado em AdminLojaDetail. E o Google Calendar com tutorial de API Key/Calendar ID é **técnico demais** — e provavelmente não é algo que o cliente (lojista) precise configurar manualmente.

**3. Equipe no lugar errado** — A tab "Equipe" (criar/gerenciar membros) aparece SOMENTE para admin dentro de `/configuracoes`. Deveria estar dentro do fluxo de `/admin/lojas/:id` como uma sub-aba, já que cada loja tem sua equipe.

**4. Metas, Pós-Venda, LGPD, Auditoria — tabs admin que não fazem sentido aqui** — Estes são controles operacionais por loja. Deveriam estar em `/admin/lojas/:id` (AdminLojaDetail) ou em sub-páginas dedicadas, não na página de "Configurações" genérica.

**5. A tab "Conta" mostra campos confusos** — Para admin, mostra "Informações da Conta" com Nome da Loja, Telefone, Email da `clinics`. Mas o admin já edita isso em `/admin/lojas/:id`. Redundante.

---

## Plano de Limpeza

### Para a página `/configuracoes` (Settings.tsx):
- **Remover todas as tabs admin-only**: Equipe, Metas, Pós-Venda, Integrações, LGPD, Auditoria
- **Manter para o cliente**: Conta (somente leitura), Agente de IA, Horário de Funcionamento
- Se o admin acessar `/configuracoes`, redirecionar para `/admin` ou mostrar apenas dados básicos

### Para `/admin/lojas/:id` (AdminLojaDetail.tsx):
- **Adicionar novas abas** ao `AdminLojaSectionLayout`: Equipe, Metas, Pós-Venda, LGPD, Auditoria
- Mover os componentes `GoalsTab`, `PostProcedureTab`, `LgpdTab`, `AuditTab` de Settings.tsx para componentes reutilizáveis ou diretamente para novas sub-páginas admin
- A tab "Integrações" já existe no AdminLojaDetail — remover a duplicata do Settings

### Arquivos alterados:
1. **`src/pages/Settings.tsx`** — Remover tabs admin-only, simplificar para visão do cliente
2. **`src/pages/AdminLojaDetail.tsx`** — Adicionar tabs: Equipe, Metas, Pós-Venda, LGPD, Auditoria (mover código de Settings)
3. **`src/components/AdminLojaSectionLayout.tsx`** — Adicionar novas tabs ao menu de navegação

Nenhuma migration necessária.

