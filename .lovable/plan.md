
# Fix: WhatsApp Status Auto-Check + Lógica Inteligente de Botões

## Problemas identificados

1. **Status mostra "Desconectado" mesmo quando a instância está online** — o check só roda uma vez no load e pode falhar silenciosamente
2. **Botão "Criar Instância" aparece mesmo quando a instância já existe** — deveria mostrar "Reconectar" se `form.instance` já tem valor
3. **Não há auto-refresh periódico** — o admin precisa clicar manualmente no refresh

## Mudanças em `src/pages/AdminLojaDetail.tsx`

### 1. Auto-check periódico
- Adicionar polling a cada 15s enquanto o status for `pending` (aguardando scan do QR)
- Rodar check automático ao abrir a aba "Integrações" e ao carregar a loja

### 2. Lógica de botões inteligente
- Se `form.instance` já tem valor E status é `disconnected`/`error`: mostrar **"Reconectar"** (action: `connect`) em vez de "Criar Instância"
- Se `form.instance` está vazio: mostrar **"Criar Instância e Conectar"** (action: `create_instance`)
- Se status é `pending`: mostrar "Obter QR Code" (como está)
- Se status é `connected`: mostrar "Desconectar" (como está)

### 3. Botão de check manual com auto-correção
- Manter o botão RefreshCw existente mas adicionar tooltip "Verificar status"
- Quando o check detecta `connected`, atualizar automaticamente o `clinic_integrations` via a Edge Function (já faz isso no backend)

### 4. Polling inteligente
- `useEffect` com `setInterval` de 15s quando status === "pending"
- Limpar interval quando status muda para `connected` ou `disconnected`

## Nenhum arquivo novo. Apenas `src/pages/AdminLojaDetail.tsx` é editado.
