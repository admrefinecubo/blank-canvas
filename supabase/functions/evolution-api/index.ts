import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const DEFAULT_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") || "";

function getCredentials(body: any) {
  return {
    apiUrl: (body.api_url || DEFAULT_API_URL).replace(/\/+$/, ""),
    apiKey: body.api_key || DEFAULT_API_KEY,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !data?.claims) throw new Error("Não autorizado");
    const user = { id: data.claims.sub as string };

    const body = await req.json();
    const { action, clinic_id, loja_id, instance_name } = body;

    if (!clinic_id && !loja_id) throw new Error("clinic_id ou loja_id obrigatório");

    // Verify user access
    if (loja_id) {
      const { data: hasAccess } = await supabase.rpc("has_loja_access", { _loja_id: loja_id, _user_id: user.id });
      if (!hasAccess) throw new Error("Sem permissão");
    } else {
      const { data: role } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("clinic_id", clinic_id)
        .maybeSingle();

      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "platform_admin" });
      if (!role && !isAdmin) throw new Error("Sem permissão");
    }

    const { apiUrl, apiKey } = getCredentials(body);

    // ─── ACTION: create_instance ───
    if (action === "create_instance") {
      const instName = instance_name;
      if (!instName) throw new Error("instance_name obrigatório");

      // 1. Create instance
      const createRes = await fetch(`${apiUrl}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          instanceName: instName,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
          rejectCall: true,
          groupsIgnore: true,
        }),
      });
      const createData = await createRes.json();

      // If instance exists, just reconnect
      let qrcode = createData?.qrcode?.base64 || createData?.base64 || null;
      if (!createRes.ok) {
        const connectRes = await fetch(`${apiUrl}/instance/connect/${instName}`, {
          method: "GET",
          headers: { apikey: apiKey },
        });
        const connectData = await connectRes.json();
        qrcode = connectData?.base64 || connectData?.qrcode?.base64 || null;
      }

      // 2. Set settings (ignore groups, reject calls)
      try {
        await fetch(`${apiUrl}/settings/set/${instName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({
            rejectCall: true,
            groupsIgnore: true,
            alwaysOnline: true,
            readMessages: false,
            readStatus: false,
          }),
        });
      } catch (e) {
        console.error("Failed to set settings:", e);
      }

      // 3. Set webhook for N8N
      if (N8N_WEBHOOK_URL) {
        try {
          await fetch(`${apiUrl}/webhook/set/${instName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: apiKey },
            body: JSON.stringify({
              enabled: true,
              url: N8N_WEBHOOK_URL,
              webhookByEvents: false,
              webhookBase64: false,
              events: [
                "MESSAGES_UPSERT",
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED",
              ],
            }),
          });
        } catch (e) {
          console.error("Failed to set webhook:", e);
        }
      }

      // 4. Save integration
      await supabase.from("clinic_integrations").upsert({
        clinic_id,
        provider: "evolution_api",
        config: { api_url: apiUrl, instance_name: instName },
        status: "pending",
      }, { onConflict: "clinic_id,provider" });

      return new Response(JSON.stringify({
        success: true,
        qrcode,
        status: "pending",
        message: "Instância criada. Escaneie o QR Code.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── ACTION: set_settings ───
    if (action === "set_settings") {
      const instName = instance_name;
      if (!instName) throw new Error("instance_name obrigatório");

      const settings = body.settings || {};

      const settingsRes = await fetch(`${apiUrl}/settings/set/${instName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          rejectCall: settings.rejectCall ?? true,
          groupsIgnore: settings.groupsIgnore ?? true,
          alwaysOnline: settings.alwaysOnline ?? true,
          readMessages: settings.readMessages ?? false,
          readStatus: settings.readStatus ?? false,
        }),
      });

      if (!settingsRes.ok) {
        const err = await settingsRes.json();
        throw new Error(err?.message || "Erro ao configurar settings");
      }

      // Set webhook if provided
      if (settings.webhookUrl || N8N_WEBHOOK_URL) {
        await fetch(`${apiUrl}/webhook/set/${instName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({
            enabled: true,
            url: settings.webhookUrl || N8N_WEBHOOK_URL,
            webhookByEvents: false,
            webhookBase64: false,
            events: settings.events || [
              "MESSAGES_UPSERT",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED",
            ],
          }),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: connect ───
    if (action === "connect") {
      const instName = instance_name;
      if (!instName) throw new Error("instance_name obrigatório");

      const connectRes = await fetch(`${apiUrl}/instance/connect/${instName}`, {
        method: "GET",
        headers: { apikey: apiKey },
      });
      const connectData = await connectRes.json();

      await supabase.from("clinic_integrations").upsert({
        clinic_id,
        provider: "evolution_api",
        config: { api_url: apiUrl, instance_name: instName },
        status: "pending",
      }, { onConflict: "clinic_id,provider" });

      return new Response(JSON.stringify({
        success: true,
        qrcode: connectData?.base64 || connectData?.qrcode?.base64 || null,
        status: "pending",
        message: "Escaneie o QR Code com seu WhatsApp",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── ACTION: status ───
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
      const cfgUrl = cfg.api_url || apiUrl;
      const cfgKey = cfg.api_key || apiKey;
      const cfgInst = cfg.instance_name || instance_name;

      try {
        const statusRes = await fetch(`${cfgUrl}/instance/connectionState/${cfgInst}`, {
          headers: { apikey: cfgKey },
        });
        const statusData = await statusRes.json();
        const connected = statusData?.instance?.state === "open";

        if (connected && integration.status !== "connected") {
          await supabase.from("clinic_integrations").update({ status: "connected" }).eq("id", integration.id);
        }

        return new Response(JSON.stringify({
          status: connected ? "connected" : "pending",
          instance: cfgInst,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ status: "error", message: "Não foi possível conectar à Evolution API" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── ACTION: disconnect ───
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
          await fetch(`${(cfg.api_url || apiUrl)}/instance/logout/${cfg.instance_name}`, {
            method: "DELETE",
            headers: { apikey: cfg.api_key || apiKey },
          });
        } catch { /* ignore */ }
      }

      await supabase.from("clinic_integrations")
        .update({ status: "disconnected", config: {} })
        .eq("clinic_id", clinic_id)
        .eq("provider", "evolution_api");

      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: send_message ───
    if (action === "send_message") {
      const { phone, message } = body;
      if (!phone || !message) throw new Error("phone e message obrigatórios");

      let instName: string;
      let sendApiUrl = apiUrl;
      let sendApiKey = apiKey;

      if (loja_id) {
        // Loja-based: get instance directly from lojas table
        const { data: loja, error: lojaErr } = await supabase
          .from("lojas")
          .select("instance")
          .eq("id", loja_id)
          .single();
        if (lojaErr || !loja?.instance) throw new Error("Loja sem instância WhatsApp configurada");
        instName = loja.instance;
      } else {
        // Clinic-based: use clinic_integrations
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
        instName = cfg.instance_name;
        sendApiUrl = cfg.api_url || apiUrl;
        sendApiKey = cfg.api_key || apiKey;
      }

      const sendRes = await fetch(`${sendApiUrl}/message/sendText/${instName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: sendApiKey },
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

    // ─── ACTION: send_media ───
    if (action === "send_media") {
      const { phone, media_url, caption, media_type } = body;
      if (!phone || !media_url) throw new Error("phone e media_url obrigatórios");

      let instName: string;
      let sendApiUrl = apiUrl;
      let sendApiKey = apiKey;

      if (loja_id) {
        const { data: loja, error: lojaErr } = await supabase
          .from("lojas")
          .select("instance")
          .eq("id", loja_id)
          .single();
        if (lojaErr || !loja?.instance) throw new Error("Loja sem instância WhatsApp configurada");
        instName = loja.instance;
      } else {
        const { data: integration } = await supabase
          .from("clinic_integrations")
          .select("*")
          .eq("clinic_id", clinic_id)
          .eq("provider", "evolution_api")
          .maybeSingle();

        if (!integration || integration.status !== "connected") throw new Error("WhatsApp não conectado");

        const cfg = integration.config as any;
        instName = cfg.instance_name;
        sendApiUrl = cfg.api_url || apiUrl;
        sendApiKey = cfg.api_key || apiKey;
      }

      let mediaData = media_url;
      let fileName = "arquivo";

      if (media_url.startsWith("http")) {
        try {
          const res = await fetch(media_url);
          const blob = await res.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          mediaData = `data:${blob.type};base64,${base64}`;

          // Tentar extrair o nome do arquivo da URL
          const urlParts = media_url.split("/");
          fileName = urlParts[urlParts.length - 1] || "arquivo";
          if (!fileName.includes(".")) {
            const ext = blob.type.split("/")[1] || "png";
            fileName += `.${ext}`;
          }
        } catch (e) {
          console.error("Erro ao converter URL para base64:", e);
        }
      }

      const sendRes = await fetch(`${sendApiUrl}/message/sendMedia/${instName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: sendApiKey },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ""),
          mediatype: media_type === "video" ? "video" : "image",
          media: mediaData,
          fileName: fileName,
          caption: caption || "",
        }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData?.message || "Erro ao enviar mídia");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: profile_picture ───
    if (action === "profile_picture") {
      const { phone } = body;
      if (!phone) throw new Error("phone obrigatório");

      let instName: string;
      let ppApiUrl = apiUrl;
      let ppApiKey = apiKey;

      if (loja_id) {
        const { data: loja, error: lojaErr } = await supabase
          .from("lojas")
          .select("instance")
          .eq("id", loja_id)
          .single();
        if (lojaErr || !loja?.instance) throw new Error("Loja sem instância WhatsApp configurada");
        instName = loja.instance;
      } else {
        const { data: integration } = await supabase
          .from("clinic_integrations")
          .select("*")
          .eq("clinic_id", clinic_id)
          .eq("provider", "evolution_api")
          .maybeSingle();
        if (!integration) throw new Error("WhatsApp não conectado");
        const cfg = integration.config as any;
        instName = cfg.instance_name;
        ppApiUrl = cfg.api_url || apiUrl;
        ppApiKey = cfg.api_key || apiKey;
      }

      const number = phone.replace(/\D/g, "");

      // Fetch profile picture
      const picRes = await fetch(`${ppApiUrl}/chat/fetchProfilePictureUrl/${instName}?number=${number}`, {
        headers: { apikey: ppApiKey },
      });
      const picData = await picRes.json();
      const profilePictureUrl = picData?.profilePictureUrl || picData?.url || null;

      // Fetch contact info (pushName)
      let pushName: string | null = null;
      try {
        const contactRes = await fetch(`${ppApiUrl}/chat/findContacts/${instName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: ppApiKey },
          body: JSON.stringify({ where: { id: `${number}@s.whatsapp.net` } }),
        });
        const contactData = await contactRes.json();
        if (Array.isArray(contactData) && contactData.length > 0) {
          pushName = contactData[0].pushName || contactData[0].name || null;
        }
      } catch { /* ignore */ }

      return new Response(JSON.stringify({
        profilePictureUrl,
        pushName,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Ação desconhecida: ${action}`);

  } catch (error: any) {
    console.error("evolution-api error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
