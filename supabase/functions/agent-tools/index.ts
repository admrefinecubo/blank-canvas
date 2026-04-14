import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, loja_id } = body;

    if (!action) throw new Error("action obrigatório");
    if (!loja_id) throw new Error("loja_id obrigatório");

    // ─── buscar_produto ───
    if (action === "buscar_produto") {
      const { query, categoria, preco_max, preco_min, limit } = body;

      if (query) {
        // Use semantic search via match_produtos if we have an embedding
        // For now, do text-based search
        let q = supabase
          .from("produtos")
          .select("id, nome, descricao, categoria, preco_original, preco_promocional, estoque_disponivel, foto_principal, foto_detalhe, video_url, checkout_url, variacoes, especificacoes, tags")
          .eq("loja_id", loja_id)
          .eq("estoque_disponivel", true);

        if (categoria) q = q.eq("categoria", categoria);
        if (preco_max) q = q.lte("preco_original", preco_max);
        if (preco_min) q = q.gte("preco_original", preco_min);

        // Text search on nome + descricao + tags
        q = q.or(`nome.ilike.%${query}%,descricao.ilike.%${query}%,tags.ilike.%${query}%`);
        q = q.limit(limit || 5);

        const { data, error } = await q;
        if (error) throw error;
        return json({ produtos: data });
      }

      // No query - just filter
      let q = supabase
        .from("produtos")
        .select("id, nome, descricao, categoria, preco_original, preco_promocional, estoque_disponivel, foto_principal, checkout_url, variacoes")
        .eq("loja_id", loja_id)
        .eq("estoque_disponivel", true);

      if (categoria) q = q.eq("categoria", categoria);
      if (preco_max) q = q.lte("preco_original", preco_max);
      if (preco_min) q = q.gte("preco_original", preco_min);
      q = q.limit(limit || 10);

      const { data, error } = await q;
      if (error) throw error;
      return json({ produtos: data });
    }

    // ─── enviar_midia ───
    if (action === "enviar_midia") {
      const { phone, media_url, caption, media_type, instance } = body;
      if (!phone || !media_url) throw new Error("phone e media_url obrigatórios");

      const instName = instance || await getLojaInstance(supabase, loja_id);

      const endpoint = media_type === "video"
        ? `${EVOLUTION_API_URL}/message/sendMedia/${instName}`
        : `${EVOLUTION_API_URL}/message/sendMedia/${instName}`;

      let mediaData = media_url;
      if (media_url.startsWith("http")) {
        try {
          const res = await fetch(media_url);
          const blob = await res.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          mediaData = `data:${blob.type};base64,${base64}`;
        } catch (e) {
          console.error("Erro ao converter URL para base64:", e);
          // Fallback para a URL original se falhar
        }
      }

      const sendRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ""),
          mediatype: media_type === "video" ? "video" : "image",
          media: mediaData,
          caption: caption || "",
        }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData?.message || "Erro ao enviar mídia");

      // Track in midias_enviadas
      await supabase.from("midias_enviadas").insert({
        loja_id,
        lead_id: body.lead_id || null,
        produto_id: body.produto_id || null,
        url: media_url,
        tipo: media_type || "foto",
        legenda: caption || null,
      });

      return json({ success: true });
    }

    // ─── agendar_visita ───
    if (action === "agendar_visita") {
      const { lead_id, data_visita, observacoes, produtos_interesse } = body;
      if (!data_visita) throw new Error("data_visita obrigatório");

      const { data, error } = await supabase.from("visitas").insert({
        loja_id,
        lead_id: lead_id || null,
        data_visita,
        observacoes: observacoes || null,
        produtos_interesse: produtos_interesse || null,
      }).select("id").single();
      if (error) throw error;

      // Get loja config for maps link
      const { data: loja } = await supabase
        .from("lojas")
        .select("endereco, maps_link")
        .eq("id", loja_id)
        .single();

      return json({
        success: true,
        visita_id: data.id,
        endereco: loja?.endereco,
        maps_link: loja?.maps_link,
      });
    }

    // ─── agendar_followup ───
    if (action === "agendar_followup") {
      const { lead_id, tipo, agendado_para, mensagem } = body;
      if (!tipo || !agendado_para) throw new Error("tipo e agendado_para obrigatórios");

      const { error } = await supabase.from("follow_ups").insert({
        loja_id,
        lead_id: lead_id || null,
        tipo,
        agendado_para,
        mensagem: mensagem || null,
      });
      if (error) throw error;
      return json({ success: true });
    }

    // ─── cadastrar_lead ───
    if (action === "cadastrar_lead") {
      const { telefone, nome, email, interesse, origem, canal_origem } = body;
      if (!telefone) throw new Error("telefone obrigatório");

      const { data, error } = await supabase.from("leads").upsert({
        loja_id,
        telefone,
        nome: nome || null,
        email: email || null,
        interesse: interesse || null,
        origem: origem || canal_origem || "whatsapp",
        canal_origem: canal_origem || origem || "whatsapp",
      }, { onConflict: "loja_id,telefone", ignoreDuplicates: false }).select("id, etapa_pipeline").single();
      if (error) throw error;
      return json({ success: true, lead: data });
    }

    // ─── mover_pipeline ───
    if (action === "mover_pipeline") {
      const { lead_id, etapa } = body;
      if (!lead_id || !etapa) throw new Error("lead_id e etapa obrigatórios");

      const { error } = await supabase.from("leads").update({ etapa_pipeline: etapa }).eq("id", lead_id);
      if (error) throw error;
      return json({ success: true });
    }

    // ─── transferir_humano ───
    if (action === "transferir_humano") {
      const { lead_id, resumo, prioridade } = body;
      if (!lead_id) throw new Error("lead_id obrigatório");

      const { error } = await supabase.from("leads").update({
        agente_pausado: true,
        is_bot_active: false,
      }).eq("id", lead_id);
      if (error) throw error;

      // Log the transfer
      await supabase.from("logs_execucao").insert({
        loja_id,
        lead_id,
        evento: "transbordo_humano",
        detalhes: { resumo: resumo || null, prioridade: prioridade || "media" },
      });

      return json({ success: true, message: "Lead transferido para atendimento humano" });
    }

    // ─── gerar_orcamento ───
    if (action === "gerar_orcamento") {
      const { lead_id, itens, desconto, forma_pagamento, parcelas, validade_dias } = body;
      if (!itens || !itens.length) throw new Error("itens obrigatórios");

      const total = itens.reduce((sum: number, item: any) => sum + (item.preco * (item.quantidade || 1)), 0);
      const totalComDesconto = total * (1 - (desconto || 0) / 100);

      // Build simple HTML quote
      const itemsHtml = itens.map((item: any) =>
        `<tr><td>${item.nome}</td><td>${item.quantidade || 1}</td><td>R$ ${item.preco.toFixed(2)}</td></tr>`
      ).join("");

      const html = `
        <h2>Orçamento</h2>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr><th>Produto</th><th>Qtd</th><th>Preço</th></tr>
          ${itemsHtml}
        </table>
        <p><strong>Subtotal:</strong> R$ ${total.toFixed(2)}</p>
        ${desconto ? `<p><strong>Desconto:</strong> ${desconto}%</p>` : ""}
        <p><strong>Total:</strong> R$ ${totalComDesconto.toFixed(2)}</p>
        ${forma_pagamento ? `<p><strong>Pagamento:</strong> ${forma_pagamento}${parcelas ? ` em ${parcelas}x` : ""}</p>` : ""}
        <p><em>Válido por ${validade_dias || 7} dias</em></p>
      `;

      return json({
        success: true,
        orcamento_html: html,
        total: totalComDesconto,
        itens_count: itens.length,
      });
    }

    // ─── gerar_cobranca (placeholder) ───
    if (action === "gerar_cobranca") {
      return json({
        success: false,
        message: "Integração com gateway de pagamento ainda não configurada. Use o link de checkout do produto.",
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (error: any) {
    console.error("agent-tools error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getLojaInstance(supabase: any, loja_id: string): Promise<string> {
  const { data, error } = await supabase
    .from("lojas")
    .select("instance")
    .eq("id", loja_id)
    .single();
  if (error || !data?.instance) throw new Error("Loja sem instância WhatsApp configurada");
  return data.instance;
}
