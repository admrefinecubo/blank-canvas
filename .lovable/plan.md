

# Add silent handoff-toggle webhook after manual message send

## What
After a manual message is sent successfully in `WhatsApp.tsx`, silently call the N8N handoff webhook to pause the bot agent — but only if `agente_pausado` is not already `true`.

## Changes

### 1. Update `ConversationSummary` type (line ~20)
Add `agente_pausado` field to the type.

### 2. Update leads query (line ~74)
Add `agente_pausado` to the select: `"id, nome, telefone, etapa_pipeline, is_bot_active, bot_paused_until, agente_pausado"`.

### 3. Add handoff fetch in `sendMessageMutation` (after line 213)
After the `Promise.all` insert/update block and error checks, add:

```typescript
if (selectedLead.agente_pausado !== true) {
  fetch("https://n8n.refinecubo.com.br/webhook/handoff-toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefone: selectedLead.telefone,
      instance: lojaContext?.instance ?? "",
      loja_id: activeLojaId,
      action: "pause",
    }),
  }).catch(() => {});
}
```

No toast, no error handling — fire-and-forget.

