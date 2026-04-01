import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Não autorizado");

    const body = await req.json();
    const { action, clinic_id, api_url, api_key, instance_name } = body;

    if (!clinic_id) throw new Error("clinic_id obrigatório");

    // Verify user belongs to clinic
    const { data: role } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("clinic_id", clinic_id)
      .maybeSingle();

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "platform_admin" });
    if (!role && !isAdmin) throw new Error("Sem permissão");

    if (action === "connect") {
      if (!api_url || !api_key || !instance_name) throw new Error("api_url, api_key e instance_name são obrigatórios");

      // Try to create instance and get QR code
      const createRes = await fetch(`${api_url}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: api_key },
        body: JSON.stringify({
          instanceName: instance_name,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        // Instance might already exist, try to get QR
        const connectRes = await fetch(`${api_url}/instance/connect/${instance_name}`, {
          method: "GET",
          headers: { apikey: api_key },
        });
        const connectData = await connectRes.json();

        // Save config
        await supabase.from("clinic_integrations").upsert({
          clinic_id,
          provider: "evolution_api",
          config: { api_url, api_key, instance_name },
          status: "pending",
        }, { onConflict: "clinic_id,provider" });

        return new Response(JSON.stringify({ 
          success: true, 
          qrcode: connectData?.base64 || connectData?.qrcode?.base64 || null,
          status: "pending",
          message: "Escaneie o QR Code com seu WhatsApp"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Save config
      await supabase.from("clinic_integrations").upsert({
        clinic_id,
        provider: "evolution_api",
        config: { api_url, api_key, instance_name },
        status: "pending",
      }, { onConflict: "clinic_id,provider" });

      return new Response(JSON.stringify({ 
        success: true, 
        qrcode: createData?.qrcode?.base64 || createData?.base64 || null,
        status: "pending",
        message: "Escaneie o QR Code com seu WhatsApp"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("provider", "evolution_api")
        .maybeSingle();

      if (!integration || !integration.config) {
        return new Response(JSON.stringify({ status: "disconnected" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cfg = integration.config as any;
      try {
        const statusRes = await fetch(`${cfg.api_url}/instance/connectionState/${cfg.instance_name}`, {
          headers: { apikey: cfg.api_key },
        });
        const statusData = await statusRes.json();
        const connected = statusData?.instance?.state === "open";

        if (connected && integration.status !== "connected") {
          await supabase.from("clinic_integrations").update({ status: "connected" }).eq("id", integration.id);
        }

        return new Response(JSON.stringify({ 
          status: connected ? "connected" : "pending",
          instance: cfg.instance_name,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ status: "error", message: "Não foi possível conectar à Evolution API" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "disconnect") {
      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("provider", "evolution_api")
        .maybeSingle();

      if (integration?.config) {
        const cfg = integration.config as any;
        try {
          await fetch(`${cfg.api_url}/instance/logout/${cfg.instance_name}`, {
            method: "DELETE",
            headers: { apikey: cfg.api_key },
          });
        } catch { /* ignore */ }
      }

      await supabase.from("clinic_integrations").update({ status: "disconnected", config: {} }).eq("clinic_id", clinic_id).eq("provider", "evolution_api");

      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_message") {
      const { phone, message } = body;
      if (!phone || !message) throw new Error("phone e message obrigatórios");

      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("provider", "evolution_api")
        .maybeSingle();

      if (!integration || integration.status !== "connected") {
        throw new Error("WhatsApp não conectado");
      }

      const cfg = integration.config as any;
      const sendRes = await fetch(`${cfg.api_url}/message/sendText/${cfg.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.api_key },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ""),
          text: message,
        }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData?.message || "Erro ao enviar mensagem");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
