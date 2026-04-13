

# Fix WhatsApp Message Sending for Lojas

## Problem
`WhatsApp.tsx` calls `supabase.functions.invoke("evolution-api")` with `clinic_id`, but lojas have their own `instance` field directly. The edge function was designed for clinics (uses `clinic_integrations` table), not lojas.

We cannot call the Evolution API directly from the browser because the API key (`EVOLUTION_API_KEY`) is a secret that must stay server-side.

## Solution
Update the `evolution-api` edge function to support a `loja_id` parameter. When `loja_id` is provided, it looks up the loja's `instance` field and uses that directly — no `clinic_integrations` lookup needed.

### Step 1 — Update edge function (`supabase/functions/evolution-api/index.ts`)

Add support for `loja_id` in the `send_message` action:
- If `loja_id` is provided (instead of `clinic_id`), query `lojas` table for `instance` field
- Use `instance` as the Evolution API instance name
- Use default `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` from env
- Verify user has loja access via `has_loja_access` RPC
- Skip `clinic_integrations` entirely for loja-based calls

Also add loja_id support for `status`, `connect`, `disconnect` actions.

### Step 2 — Update `WhatsApp.tsx`

Change `sendMessageMutation` (lines 175-224):
- Fetch loja's `instance` field in `lojaContext` query (add `instance` to select)
- Replace `supabase.functions.invoke("evolution-api")` call to pass `loja_id` instead of `clinic_id`
- Remove dependency on `activeClinicId` for the send button disabled state
- Pass `loja_id: activeLojaId` instead of `clinic_id: activeClinicId`

### Step 3 — Deploy edge function

Redeploy the updated `evolution-api` function.

### Technical Details

Edge function change for `send_message` with `loja_id`:
```typescript
if (action === "send_message") {
  let instName: string;
  
  if (loja_id) {
    // Verify access
    const { data: hasAccess } = await supabase.rpc("has_loja_access", { _user_id: user.id, _loja_id: loja_id });
    if (!hasAccess) throw new Error("Sem permissão");
    
    const { data: loja } = await supabase.from("lojas").select("instance").eq("id", loja_id).single();
    if (!loja?.instance) throw new Error("Loja sem instância WhatsApp configurada");
    instName = loja.instance;
  } else {
    // existing clinic_integrations logic
  }
  
  // send via Evolution API using instName + default credentials
}
```

WhatsApp.tsx lojaContext query adds `instance`:
```typescript
.select("nome_loja, nome_assistente, instance")
```

Send mutation uses `loja_id`:
```typescript
body: {
  action: "send_message",
  loja_id: activeLojaId,
  phone: selectedLead.telefone,
  message,
}
```

