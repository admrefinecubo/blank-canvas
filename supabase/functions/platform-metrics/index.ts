import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({}).passthrough();

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;

const startOfMonthUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
};

const startOfWeekUtc = (date: Date) => {
  const value = new Date(date);
  const day = value.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + diff);
  value.setUTCHours(0, 0, 0, 0);
  return value;
};

const toIsoDate = (date: Date) => date.toISOString();

const fetchAllRows = async <T>(runQuery: (from: number, to: number) => Promise<{ data: T[] | null; error: Error | null }>) => {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await runQuery(from, to);
    if (error) throw error;

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL não configurado");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurado");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const rawBody = await req.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: parsedBody.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Não autorizado");

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: authData.user.id,
      _role: "platform_admin",
    });

    if (roleError || !isAdmin) throw new Error("Sem permissão");

    const now = new Date();
    const monthStart = startOfMonthUtc();
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_IN_MS);
    const disconnectedLimit = new Date(now.getTime() - DAY_IN_MS);
    const growthStart = startOfWeekUtc(new Date(now.getTime() - 11 * 7 * DAY_IN_MS));

    const [stores, monthLeads, growthLeads, recentMessages, integrations, processedMessagesResult] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from("lojas")
          .select("id, nome_loja, ativo, clinic_id, created_at")
          .order("created_at", { ascending: false })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from("leads")
          .select("id, loja_id, created_at")
          .gte("created_at", toIsoDate(monthStart))
          .order("created_at", { ascending: true })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from("leads")
          .select("id, loja_id, created_at")
          .gte("created_at", toIsoDate(growthStart))
          .order("created_at", { ascending: true })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from("historico_mensagens")
          .select("lead_id, loja_id, created_at")
          .gte("created_at", toIsoDate(sevenDaysAgo))
          .order("created_at", { ascending: false })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from("clinic_integrations")
          .select("clinic_id, provider, status, updated_at")
          .eq("provider", "evolution_api")
          .order("updated_at", { ascending: false })
          .range(from, to),
      ),
      supabase.from("mensagens_processadas").select("message_id", { count: "exact", head: true }),
    ]);

    if (processedMessagesResult.error) throw processedMessagesResult.error;

    const integrationsByClinic = new Map(
      integrations.map((integration) => [integration.clinic_id, integration]),
    );

    const activeConversationsByStore = new Map<string, number>();
    const activeLeadSets = new Map<string, Set<string>>();

    recentMessages.forEach((message) => {
      if (!message.loja_id || !message.lead_id) return;
      const leadSet = activeLeadSets.get(message.loja_id) || new Set<string>();
      leadSet.add(message.lead_id);
      activeLeadSets.set(message.loja_id, leadSet);
    });

    activeLeadSets.forEach((leadSet, lojaId) => {
      activeConversationsByStore.set(lojaId, leadSet.size);
    });

    const leadsByStoreThisMonth = new Map<string, number>();
    monthLeads.forEach((lead) => {
      if (!lead.loja_id) return;
      leadsByStoreThisMonth.set(lead.loja_id, (leadsByStoreThisMonth.get(lead.loja_id) || 0) + 1);
    });

    const ranking = stores
      .map((store) => {
        const integration = integrationsByClinic.get(store.clinic_id);
        return {
          id: store.id,
          nome_loja: store.nome_loja,
          leads_mes: leadsByStoreThisMonth.get(store.id) || 0,
          conversas_ativas: activeConversationsByStore.get(store.id) || 0,
          bot_status: integration?.status === "connected" ? "conectado" : "desconectado",
          ativo: store.ativo,
          clinic_id: store.clinic_id,
        };
      })
      .sort((a, b) => b.leads_mes - a.leads_mes || b.conversas_ativas - a.conversas_ativas || a.nome_loja.localeCompare(b.nome_loja, "pt-BR"));

    const growthBuckets = Array.from({ length: 12 }, (_, index) => {
      const start = new Date(growthStart.getTime() + index * 7 * DAY_IN_MS);
      const end = new Date(start.getTime() + 6 * DAY_IN_MS);
      return {
        key: toIsoDate(start),
        label: `${String(start.getUTCDate()).padStart(2, "0")}/${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
        start,
        end,
        leads: 0,
      };
    });

    growthLeads.forEach((lead) => {
      const createdAt = new Date(lead.created_at);
      const weekStart = startOfWeekUtc(createdAt);
      const bucket = growthBuckets.find((item) => item.key === toIsoDate(weekStart));
      if (bucket) bucket.leads += 1;
    });

    const alerts = stores
      .map((store) => {
        const integration = integrationsByClinic.get(store.clinic_id);
        if (!integration) return null;

        const disconnectedLongEnough = integration.status !== "connected" && new Date(integration.updated_at) <= disconnectedLimit;
        if (!disconnectedLongEnough) return null;

        const disconnectedHours = Math.max(24, Math.floor((now.getTime() - new Date(integration.updated_at).getTime()) / (60 * 60 * 1000)));

        return {
          loja_id: store.id,
          nome_loja: store.nome_loja,
          status: integration.status,
          horas_desconectado: disconnectedHours,
        };
      })
      .filter((item): item is { loja_id: string; nome_loja: string; status: string; horas_desconectado: number } => Boolean(item))
      .sort((a, b) => b.horas_desconectado - a.horas_desconectado);

    return new Response(
      JSON.stringify({
        summary: {
          total_lojas_ativas: stores.filter((store) => store.ativo).length,
          total_leads_mes: monthLeads.length,
          total_mensagens_processadas: processedMessagesResult.count || 0,
        },
        ranking,
        growth: growthBuckets.map((bucket) => ({ semana: bucket.label, leads: bucket.leads })),
        alerts,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});