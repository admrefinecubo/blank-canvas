import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function generateEmbedding(text: string): Promise<number[] | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    console.warn("OPENAI_API_KEY not set — skipping embedding generation");
    return null;
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI embedding error:", err);
    return null;
  }

  const json = await res.json();
  return json.data?.[0]?.embedding ?? null;
}

function buildEmbeddingText(produto: Record<string, unknown>): string {
  const parts = [
    produto.nome,
    produto.descricao,
    produto.categoria,
    produto.especificacoes,
    produto.tags,
    produto.variacoes,
  ].filter(Boolean);
  return parts.join(" | ");
}

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
    const { action, loja_id, produto_id } = body;

    if (!loja_id) throw new Error("loja_id obrigatório");

    const { data: hasAccess, error: accessError } = await supabase.rpc("has_loja_access", {
      _user_id: authData.user.id,
      _loja_id: loja_id,
    });

    if (accessError || !hasAccess) throw new Error("Sem permissão para esta loja");

    if (action === "upload_product_image") {
      const { file_name, content_type, base64, target_field } = body;
      if (!file_name || !content_type || !base64 || !target_field) {
        throw new Error("Dados do upload incompletos");
      }

      if (!["foto_principal", "foto_detalhe"].includes(target_field)) {
        throw new Error("target_field inválido");
      }

      if (!content_type.startsWith("image/")) {
        throw new Error("Tipo de arquivo inválido");
      }

      const safeName = sanitizeFileName(file_name);
      const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
      const path = `lojas/${loja_id}/produtos/${target_field}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("clinic-assets")
        .upload(path, decodeBase64(base64), {
          contentType: content_type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("clinic-assets").getPublicUrl(path);

      return new Response(JSON.stringify({ success: true, publicUrl: data.publicUrl, path }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reindex_embeddings") {
      if (!n8nWebhookUrl) throw new Error("Webhook de embeddings não configurado");

      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "WF-11",
          action: "reindex_embeddings",
          loja_id,
          produto_id: produto_id ?? null,
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook retornou erro ${webhookResponse.status}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_embedding") {
      if (!produto_id) throw new Error("produto_id obrigatório para gerar embedding");

      const { data: produto, error: produtoError } = await supabase
        .from("produtos")
        .select("nome, descricao, categoria, especificacoes, tags, variacoes")
        .eq("id", produto_id)
        .single();

      if (produtoError || !produto) throw new Error("Produto não encontrado");

      const text = buildEmbeddingText(produto);
      const embedding = await generateEmbedding(text);

      if (!embedding) {
        return new Response(JSON.stringify({ success: false, reason: "embedding_unavailable" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embeddingStr = `[${embedding.join(",")}]`;
      const { error: updateError } = await supabase
        .from("produtos")
        .update({ embedding: embeddingStr })
        .eq("id", produto_id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
