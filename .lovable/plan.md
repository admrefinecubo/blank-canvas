

# Plano: Auditoria e Ajustes de Visibilidade Admin vs Cliente

## Contexto

Três problemas identificados:

1. **Checkout URL duplicado** — O produto tem `checkout_url` próprio E a loja tem `checkout_base_url`. O agente WhatsApp pode ficar confuso sobre qual usar.
2. **Conteúdo técnico exposto ao cliente** — A aba "Integrações" mostra tutoriais do Google Calendar, campos de API Key, instruções de plataforma e-commerce. Isso deveria ser visível APENAS para o admin (platform_admin), não para clinic_owner/clinic_staff.
3. **Auditoria geral** — Garantir que o admin configura tudo e o cliente vê apenas o que é relevante para sua operação.

## Solução de Checkout URL

**Lógica de prioridade no agente**: O `checkout_url` do produto tem prioridade. Se não existir, usa `checkout_base_url + produto_id/slug`. Não há conflito real — o campo do produto é um override opcional.

**Mudança na UI**: Adicionar um texto explicativo no campo `checkout_url` do produto no catálogo: _"Se vazio, será usado a URL base da loja + identificador do produto."_ Isso elimina confusão para o admin que configura.

## Mudanças na aba Integrações (Settings.tsx)

**Para o cliente (clinic_owner/clinic_staff)**: A aba "Integrações" será **removida** do TabsList. Clientes não precisam ver WhatsApp (Evolution API), Google Calendar, plataforma e-commerce, API Keys — tudo isso é configurado pelo admin.

**Para o admin (platform_admin)**: A aba "Integrações" permanece com tudo visível — tutoriais, API keys, configuração de plataforma, etc.

## Mudanças nas Tabs visíveis por role

### Cliente vê:
- **Conta** (somente leitura: nome, telefone, email)
- **Agente de IA** (identidade, regras comerciais, descontos — o que o cliente pode personalizar)

### Admin vê (no /settings via admin mode):
- **Conta** (editável)
- **Equipe** (gerenciar membros)
- **Metas**
- **Pós-Venda**
- **Integrações** (WhatsApp, Google Calendar, E-commerce — tudo técnico)
- **LGPD**
- **Auditoria**

## Mudanças no Catálogo (LojaCatalogo.tsx)

Adicionar helper text no campo `Checkout URL` do formulário de produto:
_"Opcional. Se vazio, usa a URL base configurada pelo administrador."_

## Detalhes técnicos

### Arquivos alterados:

1. **`src/pages/Settings.tsx`**
   - Mover a tab "Integrações" para `{showAdminControls && ...}` (linha 860)
   - Mover o `<TabsContent value="integrations">` para dentro do bloco admin-only
   - Remover a exposição de tutoriais e campos técnicos para clientes

2. **`src/pages/LojaCatalogo.tsx`**
   - Adicionar `<p className="text-xs text-muted-foreground">` abaixo do campo checkout_url no dialog de produto

3. **`src/components/LojaOnboardingWizard.tsx`**
   - Verificar se a etapa 5 (E-commerce) mostra tutoriais técnicos — se sim, simplificar para o cliente

Nenhuma migration necessária.

