

# Checklist do Claude — O que já foi feito e o que falta

Vou auditar cada item da lista que o Claude forneceu:

## Status de cada item

### 1. SQL Migration (`external_id`, `plataforma`, `onboarding_concluido`)
**NÃO FEITO** — Consultei o banco e nenhuma dessas 3 colunas existe na tabela `lojas`. A migration precisa ser criada.

### 2. Importar Workflows no n8n
**FORA DO ESCOPO LOVABLE** — Isso é feito manualmente no painel do n8n. Não é algo que eu possa executar.

### 3. Horário unificado + dias_funcionamento
**JÁ FEITO** — O `DaysSchedulePicker` já existe e está integrado em `Settings.tsx` e `AdminLojaDetail.tsx`.

### 4. Integrações E-commerce
**JÁ FEITO** — `AdminLojaDetail.tsx` já tem a tab de Integrações com campos de plataforma e-commerce, checkout URL, API key.

### 5. Promoções em Destaque
**NÃO FEITO** — Não existe UI para destacar produtos em promoção no catálogo ou dashboard do lojista.

### 6. Onboarding Wizard
**PARCIALMENTE FEITO** — O componente `LojaOnboardingWizard.tsx` existe mas usa a lógica antiga (verifica campos vazios). Precisa ser reescrito conforme a spec: full-screen, 5 passos com validação, salvar por passo, e usar a flag `onboarding_concluido` (que ainda não existe no banco).

### 7. Configurar credentials no n8n
**FORA DO ESCOPO LOVABLE** — Feito manualmente no painel do n8n.

### 8. Definir plataforma de pagamento
**DECISÃO PENDENTE** — Não implementado. Precisa de decisão sua (Stripe, Mercado Pago, etc.).

---

## Plano de implementação (itens que posso fazer)

### Passo 1 — Migration SQL
Adicionar à tabela `lojas`:
- `external_id TEXT` — ID externo para integração com plataformas
- `plataforma TEXT` — redundante com `plataforma_ecommerce`? Vou verificar se é algo diferente ou se é a mesma coisa. Se for a mesma, pulo.
- `onboarding_concluido BOOLEAN DEFAULT false`

### Passo 2 — Reescrever Onboarding Wizard
Reescrever `LojaOnboardingWizard.tsx` conforme a spec:
- Full-screen modal (não fechável com ESC/click fora)
- 5 passos lineares com progresso
- Passo 1: nome_loja, especialidades, nome_assistente_ia, tom_voz (obrigatórios)
- Passo 2: endereco, maps_link, horarios, dias_funcionamento
- Passo 3: formas_pagamento, prazo_entrega, frete_gratis_acima, montagem, politica_troca
- Passo 4: regras_personalidade, checkout_base_url, plataforma_ecommerce
- Passo 5: Tela de conclusão com check verde
- Salvar no Supabase a cada avanço de passo
- No passo 5: `UPDATE lojas SET onboarding_concluido = true`

### Passo 3 — Lógica de exibição
Alterar `Dashboard.tsx` para verificar `onboarding_concluido === false` em vez da lógica atual de campos vazios (`needsOnboarding`).

### Passo 4 — Promoções em Destaque (se desejado)
Criar seção no Dashboard do lojista mostrando produtos com `preco_promocional` ativo. Pode ser feito depois.

---

## Arquivos alterados
1. **Migration SQL** — `onboarding_concluido`, `external_id` (e `plataforma` se necessário)
2. **`src/components/LojaOnboardingWizard.tsx`** — Reescrita completa
3. **`src/pages/Dashboard.tsx`** — Trocar `needsOnboarding()` por check de `onboarding_concluido`

## Decisão necessária
- A coluna `plataforma` é diferente de `plataforma_ecommerce` que já existe? Se for a mesma coisa, não crio duplicada.
- Quer que eu implemente "Promoções em Destaque" neste mesmo ciclo?

