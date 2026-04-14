import { supabase } from "@/integrations/supabase/client";

const N8N_HANDOFF_URL = "https://n8n.refinecubo.com.br/webhook/handoff-toggle";

interface HandoffParams {
  leadId: string;
  telefone: string;
  lojaId: string;
  instance?: string | null;
}

/**
 * Ativa atendimento humano: desabilita o bot e notifica N8N.
 */
export async function activateHandoff({ leadId, telefone, lojaId, instance }: HandoffParams) {
  const { error } = await supabase
    .from("leads")
    .update({ is_bot_active: false, agente_pausado: true })
    .eq("id", leadId);

  if (error) throw error;

  fetch(N8N_HANDOFF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefone,
      instance: instance ?? "",
      loja_id: lojaId,
      action: "pause",
    }),
  }).catch(() => {});
}

/**
 * Remove atendimento humano: reativa o bot e notifica N8N.
 */
export async function deactivateHandoff({ leadId, telefone, lojaId, instance }: HandoffParams) {
  const { error } = await supabase
    .from("leads")
    .update({ is_bot_active: true, agente_pausado: false, bot_paused_until: null })
    .eq("id", leadId);

  if (error) throw error;

  fetch(N8N_HANDOFF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefone,
      instance: instance ?? "",
      loja_id: lojaId,
      action: "resume",
    }),
  }).catch(() => {});
}

/**
 * Toggle handoff: se botAtivo=true → desativa handoff, se false → ativa.
 */
export async function toggleHandoff(activate: boolean, params: HandoffParams) {
  if (activate) {
    await activateHandoff(params);
  } else {
    await deactivateHandoff(params);
  }
}
