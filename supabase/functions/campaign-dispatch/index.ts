import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Não autorizado");

    const body = await req.json();
    const { campaign_id, loja_id } = body;

    if (!campaign_id || !loja_id) throw new Error("campaign_id e loja_id obrigatórios");

    const { data: hasAccess, error: accessError } = await supabase.rpc("has_loja_access", {
      _user_id: authData.user.id,
      _loja_id: loja_id,
    });
    if (accessError || !hasAccess) throw new Error("Sem permissão para esta loja");

    const { data: campaign, error: campError } = await supabase
      .from("promotional_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("loja_id", loja_id)
      .single();

    if (campError || !campaign) throw new Error("Campanha não encontrada");

    if (!n8nWebhookUrl) throw new Error("Webhook N8N não configurado");

    // Build leads query based on segment
    const segmentConfig = campaign.segment_config as Record<string, string> | null;
    let leadsQuery = supabase
      .from("leads")
      .select("nome, telefone")
      .eq("loja_id", loja_id);

    if (campaign.segment_type === "etapa_pipeline" && segmentConfig?.etapa_pipeline) {
      leadsQuery = leadsQuery.eq("etapa_pipeline", segmentConfig.etapa_pipeline);
    } else if (campaign.segment_type === "origem" && segmentConfig?.origem) {
      leadsQuery = leadsQuery.eq("origem", segmentConfig.origem);
    } else if (campaign.segment_type === "interesse" && segmentConfig?.interesse) {
      leadsQuery = leadsQuery.ilike("interesse", `%${segmentConfig.interesse}%`);
    }

    const { data: leads, error: leadsError } = await leadsQuery.limit(500);
    if (leadsError) throw new Error("Erro ao buscar leads: " + leadsError.message);

    if (!leads || leads.length === 0) {
      throw new Error("Nenhum lead encontrado para este segmento. Campanha não disparada.");
    }

    const contatos = leads.map((l) => ({
      nome: l.nome || "Sem nome",
      telefone: l.telefone,
    }));

    const segmentValue = segmentConfig ? Object.values(segmentConfig)[0] ?? null : null;

    const webhookRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: "WF-13",
        action: "disparar_campanha",
        loja_id,
        campanha_id: campaign_id,
        segmento: segmentValue,
        orcamento_faixa: null,
        mensagem: campaign.message_template,
        desconto: campaign.discount_percent ?? 0,
        contatos,
        total_contatos: contatos.length,
      }),
    });

    if (!webhookRes.ok) throw new Error(`Webhook retornou erro ${webhookRes.status}`);

    // Validate webhook response - require explicit confirmation
    let webhookResult: Record<string, unknown> = {};
    try {
      webhookResult = await webhookRes.json();
    } catch {
      // If n8n returns empty or non-JSON, treat as unconfirmed
      throw new Error(
        "O webhook não retornou confirmação de processamento. " +
        "O disparo não foi efetivado. Verifique a configuração do N8N."
      );
    }

    // Accept if webhook returned success/accepted flag or an execution ID
    const confirmed =
      webhookResult.success === true ||
      webhookResult.accepted === true ||
      !!webhookResult.executionId ||
      !!webhookResult.execution_id;

    if (!confirmed) {
      throw new Error(
        "O webhook respondeu mas não confirmou o processamento. " +
        "Resposta: " + JSON.stringify(webhookResult).slice(0, 200)
      );
    }

    const { error: updateError } = await supabase
      .from("promotional_campaigns")
      .update({
        status: "disparada",
        launched_at: new Date().toISOString(),
        targeted_leads_count: contatos.length,
      })
      .eq("id", campaign_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, total_contatos: contatos.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
