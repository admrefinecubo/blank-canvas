

# Fix: Tela branca na aba Integrações (Settings)

## Causa raiz

O componente `SelectItem` do Radix UI não aceita string vazia (`""`) como `value`. Na linha 32 de `Settings.tsx`, o array `ECOMMERCE_PLATFORMS` tem `{ value: "", label: "Nenhuma" }`. Quando o Select renderiza, o Radix lança um erro silencioso que quebra toda a árvore React → tela branca.

## Correção

1. **`src/pages/Settings.tsx`** — Alterar o value de "Nenhuma" de `""` para `"none"`:
   - Linha 33: `{ value: "none", label: "Nenhuma" }`
   - Ajustar a lógica de save para converter `"none"` de volta para `null` antes de salvar no banco
   - Ajustar o `useEffect` que popula o form para converter `null`/`""` para `"none"`
   - Ajustar a condição `showApiKey` e `instructions` para tratar `"none"` como sem plataforma

2. **`src/components/LojaOnboardingWizard.tsx`** — Verificar se o mesmo padrão existe no step 5 (E-commerce) e aplicar a mesma correção se necessário.

## Detalhes técnicos

- `ECOMMERCE_PLATFORMS[0].value` muda de `""` para `"none"`
- No `saveEcomMutation`: `plataforma_ecommerce: ecomForm.plataforma === "none" ? null : ecomForm.plataforma`
- No `useEffect` de `lojaEcom`: `plataforma: lojaEcom.plataforma_ecommerce || "none"`
- Condição `showApiKey`: checar `!= "none"` em vez de truthy
- Condição `instructions`: checar `ecomForm.plataforma && ecomForm.plataforma !== "none"`

