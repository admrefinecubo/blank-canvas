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
    const { action, clinic_id, calendar_id, api_key } = body;

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
      if (!api_key || !calendar_id) throw new Error("api_key e calendar_id obrigatórios");

      // Test the connection
      const testRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar_id)}/events?maxResults=1&key=${api_key}`
      );

      if (!testRes.ok) {
        const errData = await testRes.json();
        throw new Error(errData?.error?.message || "Não foi possível conectar ao Google Calendar. Verifique a API Key e o Calendar ID.");
      }

      await supabase.from("clinic_integrations").upsert({
        clinic_id,
        provider: "google_calendar",
        config: { api_key, calendar_id },
        status: "connected",
      }, { onConflict: "clinic_id,provider" });

      return new Response(JSON.stringify({ success: true, status: "connected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("provider", "google_calendar")
        .maybeSingle();

      return new Response(JSON.stringify({ 
        status: integration?.status || "disconnected",
        calendar_id: (integration?.config as any)?.calendar_id || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase.from("clinic_integrations")
        .update({ status: "disconnected", config: {} })
        .eq("clinic_id", clinic_id)
        .eq("provider", "google_calendar");

      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_events") {
      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("provider", "google_calendar")
        .maybeSingle();

      if (!integration || integration.status !== "connected") throw new Error("Google Calendar não conectado");

      const cfg = integration.config as any;
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString();

      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendar_id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&key=${cfg.api_key}`
      );

      if (!eventsRes.ok) throw new Error("Erro ao buscar eventos do Google Calendar");

      const eventsData = await eventsRes.json();
      const events = (eventsData.items || []).map((e: any) => ({
        id: e.id,
        summary: e.summary || "Sem título",
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        description: e.description || "",
      }));

      return new Response(JSON.stringify({ success: true, events }), {
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
