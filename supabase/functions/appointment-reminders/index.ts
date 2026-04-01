import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Fetch tomorrow's appointments with patient data
    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select("*, patients(name, phone), procedures(name), clinic_id")
      .eq("date", tomorrowStr)
      .in("status", ["agendado", "confirmado"]);

    if (aptError) throw aptError;

    const results: any[] = [];

    for (const apt of (appointments || [])) {
      if (!apt.patients?.phone) continue;

      // Check if clinic has Evolution API connected
      const { data: integration } = await supabase
        .from("clinic_integrations")
        .select("config, status")
        .eq("clinic_id", apt.clinic_id)
        .eq("provider", "evolution_api")
        .eq("status", "connected")
        .single();

      if (!integration) continue;

      const config = integration.config as any;
      const instanceName = config?.instance_name;
      const apiUrl = config?.api_url;
      const apiKey = config?.api_key;

      if (!instanceName || !apiUrl || !apiKey) continue;

      // Format phone (remove non-digits, ensure country code)
      let phone = apt.patients.phone.replace(/\D/g, "");
      if (!phone.startsWith("55")) phone = "55" + phone;

      const procedureName = apt.procedures?.name || "consulta";
      const time = apt.time?.slice(0, 5) || "";
      const message = `Olá ${apt.patients.name}! 😊\n\nLembrete: você tem uma visita agendada para amanhã (${tomorrowStr.split("-").reverse().join("/")}) às ${time} — ${procedureName}.\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nObrigado! 🙏`;

      try {
        const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({ number: phone, text: message }),
        });

        results.push({
          appointment_id: apt.id,
          patient: apt.patients.name,
          phone,
          sent: response.ok,
        });
      } catch (sendError) {
        results.push({
          appointment_id: apt.id,
          patient: apt.patients.name,
          error: String(sendError),
        });
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
