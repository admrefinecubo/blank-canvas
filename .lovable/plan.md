

# Plan: Evolution API Fixes + 20 Strategic Updates/Features

## Problem Analysis

1. **Wrong bot responding**: You messaged +55 31 7245-0207 (registered in evo "lojaads") but got a response from "juliana" automation via +55 51 9238-1084. This means the N8N/automation workflow is routing messages to the wrong instance — likely the `instance` field on the `lojas` table doesn't match, or the N8N workflow uses a hardcoded instance instead of looking up by `instance` field.

2. **Evolution API defaults**: The edge function currently requires `api_url` and `api_key` per-request. Should use environment defaults: `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` (already in secrets).

3. **Auto-create instance when admin creates a store**: Currently manual. Should auto-provision on the Evolution API when a loja is created/configured.

4. **Missing Evolution API settings**: Need to configure `ignoreJids` (ignore groups), webhook events like `message-upsert`, etc.

---

## Implementation Steps

### Step 1 — Fix `evolution-api` Edge Function to use default credentials

Update `supabase/functions/evolution-api/index.ts`:
- Read `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` from `Deno.env` as defaults
- On `connect` action: if `api_url`/`api_key` not provided in body, use env defaults
- Save the actual URL/key used in `clinic_integrations.config`

### Step 2 — Add `create_instance` action to Evolution API edge function

New action that:
1. Creates instance on Evolution API with `instanceName` = loja's `instance` field
2. Sets settings: `rejectCall: true`, `ignoreJids` (groups), webhook URL pointing to N8N
3. Configures webhook events: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`
4. Saves integration record in `clinic_integrations`
5. Returns QR code for scanning

### Step 3 — Add `set_settings` action

Configures instance settings via Evolution API:
- `POST /settings/set/{instance}` with `ignoreJids`, `rejectCall`, etc.
- `POST /webhook/set/{instance}` with events: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`

### Step 4 — Auto-provision on AdminLojaDetail save

When admin saves a loja with an `instance` value, automatically call `create_instance` if no integration exists yet for that clinic.

### Step 5 — Update AdminLojaDetail Integrações tab

Add UI to:
- Show connection status
- Button "Criar Instância" / "Reconectar"
- Show QR code dialog
- Toggle for ignore groups, message-upsert webhook

---

## 10 Updates (Fixes/Improvements)

1. **Fix Evolution API default credentials** — use `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` from secrets instead of requiring per-request
2. **Auto-create Evolution instance** when admin configures a loja's `instance` field
3. **Configure instance settings** (ignoreJids for groups, rejectCall, webhook events like `message-upsert`)
4. **Fix instance routing** — ensure each loja's `instance` field maps correctly so the right bot responds
5. **AdminLojaDetail: WhatsApp status panel** — show connected/disconnected, QR code, reconnect button
6. **Settings WhatsApp tab** — client-side view of their own connection status (read-only)
7. **LojaLeads: bulk actions** — select multiple leads and change pipeline stage or assign
8. **Dashboard: real metrics** — replace placeholder data with real queries (leads this month, conversion rate, messages today)
9. **AdminDashboard: alert for disconnected bots** — highlight lojas with bot disconnected > 24h
10. **Fix `canal_origem`/`origem` sync** — ensure the trigger `sync_canal_origem` works bidirectionally and N8N webhook sends `origem`

## 10 Features (New Functionality)

1. **Auto-provision full AI pipeline from admin** — when admin creates loja + sets instance, auto-create Evolution instance, configure webhooks, and set up N8N workflow trigger
2. **WhatsApp template messages** — pre-defined message templates per loja that staff can send with one click
3. **Lead scoring system** — automatic scoring based on interactions, messages, time in pipeline
4. **Campaign manager** — create and send bulk WhatsApp campaigns to segmented leads (already have `promotional_campaigns` table)
5. **Automated follow-up scheduler** — visual builder for follow-up sequences (day 1, day 3, day 7)
6. **Multi-store dashboard for clients** — clients with multiple lojas see aggregated metrics
7. **Real-time notifications** — Supabase Realtime for new leads, new messages, bot disconnections
8. **Client onboarding wizard** — step-by-step guide when client first logs in (connect WhatsApp, add products, configure bot)
9. **Analytics & reports** — conversion funnel, response time metrics, best-performing products, lead source breakdown
10. **Role-based permissions UI** — admin can assign granular permissions (view-only, edit leads, manage catalog) per team member

---

## Priority Order

Start with Steps 1-3 (Evolution API fixes) since they directly fix the bug where the wrong bot responds. Then Step 4-5 for admin UX. The 20 items above serve as a roadmap.

### Technical Details

- **Evolution API endpoints used**:
  - `POST /instance/create` — create instance
  - `POST /settings/set/{instance}` — configure ignoreJids, rejectCall
  - `POST /webhook/set/{instance}` — set webhook URL + events
  - `GET /instance/connectionState/{instance}` — check status
  - `GET /instance/connect/{instance}` — get QR code
- **Default credentials** from secrets: `EVOLUTION_API_URL = https://evoapi.refinecubo.com.br`, `EVOLUTION_API_KEY = cubo_Rer0KZ...`
- **Webhook events to configure**: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`
- **ignoreJids**: filter `@g.us` (group messages) so bot only responds to direct messages

