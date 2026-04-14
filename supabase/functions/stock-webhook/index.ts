import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Simple API key auth for external webhooks
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("STOCK_WEBHOOK_API_KEY");
    if (expectedKey && apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    
    // Accept single item or array
    const items = Array.isArray(body) ? body : [body];
    const results: { produto_id: string; status: string }[] = [];

    for (const item of items) {
      const { produto_id, estoque, preco, preco_promocional, estoque_disponivel } = item;
      if (!produto_id) {
        results.push({ produto_id: "missing", status: "error: produto_id required" });
        continue;
      }

      const updates: Record<string, any> = {};
      if (estoque !== undefined) updates.estoque = estoque;
      if (preco !== undefined) updates.preco_original = preco;
      if (preco_promocional !== undefined) updates.preco_promocional = preco_promocional;
      if (estoque_disponivel !== undefined) updates.estoque_disponivel = estoque_disponivel;
      if (estoque !== undefined && estoque_disponivel === undefined) {
        updates.estoque_disponivel = estoque > 0;
      }

      if (Object.keys(updates).length === 0) {
        results.push({ produto_id, status: "skipped: no fields to update" });
        continue;
      }

      const { error } = await supabase
        .from("produtos")
        .update(updates)
        .eq("id", produto_id);

      results.push({ produto_id, status: error ? `error: ${error.message}` : "updated" });
    }

    return new Response(JSON.stringify({ results }), {
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
