import type { ElementType } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MessageSquareText,
  Package,
  Store,
  Users,
  Workflow,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

function StatCard({ title, value, icon: Icon, href }: { title: string; value: string; icon: ElementType; href?: string }) {
  return (
    <Card className="overflow-hidden transition-colors hover:bg-accent/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href ? (
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-0 text-primary hover:text-primary">
              <Link to={href}>
                Ver detalhe
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { activeLojaId, activeClinicId } = useAuth();

  const startOfToday = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value.toISOString();
  }, []);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const last24Hours = useMemo(() => {
    const value = new Date();
    value.setHours(value.getHours() - 24);
    return value.toISOString();
  }, []);

  const startOfMonth = useMemo(() => {
    const value = new Date();
    value.setDate(1);
    value.setHours(0, 0, 0, 0);
    return value.toISOString();
  }, []);

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const { data: lojaContext } = useQuery({
    queryKey: ["dashboard-loja-context", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("nome_loja, nome_assistente")
        .eq("id", activeLojaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis", activeLojaId, activeClinicId, startOfToday, todayDate, last24Hours, nowIso],
    queryFn: async () => {
      const [leadsResult, activeConversationsResult, followUpsResult, visitasResult, produtosResult] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).gte("created_at", startOfToday),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("is_bot_active", true).gte("ultima_interacao", last24Hours),
        supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("enviado", false).lte("agendado_para", nowIso),
        activeClinicId
          ? supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", activeClinicId).eq("date", todayDate).eq("status", "agendado")
          : Promise.resolve({ count: 0, error: null }),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("estoque_disponivel", true),
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (activeConversationsResult.error) throw activeConversationsResult.error;
      if (followUpsResult.error) throw followUpsResult.error;
      if (visitasResult.error) throw visitasResult.error;
      if (produtosResult.error) throw produtosResult.error;

      return {
        leadsHoje: leadsResult.count ?? 0,
        conversasAtivas: activeConversationsResult.count ?? 0,
        followUpsPendentes: followUpsResult.count ?? 0,
        visitasAgendadas: visitasResult.count ?? 0,
        produtosCatalogo: produtosResult.count ?? 0,
      };
    },
    enabled: !!activeLojaId,
  });

  const { data: monthlyConversions } = useQuery({
    queryKey: ["dashboard-monthly-conversions", activeLojaId, startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id")
        .eq("loja_id", activeLojaId!)
        .eq("etapa_pipeline", "fechado_ganho")
        .gte("created_at", startOfMonth);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeLojaId,
  });

  const { data: latestConversations = [] } = useQuery({
    queryKey: ["dashboard-latest-conversations", activeLojaId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from("historico_mensagens")
        .select("id, lead_id, content, created_at, role, telefone")
        .eq("loja_id", activeLojaId!)
        .order("created_at", { ascending: false })
        .limit(150);

      if (error) throw error;

      const uniqueMessages = (messages ?? []).reduce<any[]>((acc, message) => {
        const key = message.lead_id || message.telefone;
        if (!key || acc.some((item) => (item.lead_id || item.telefone) === key)) return acc;
        acc.push(message);
        return acc;
      }, []).slice(0, 5);

      const leadIds = uniqueMessages
        .map((message) => message.lead_id)
        .filter((leadId): leadId is string => Boolean(leadId));

      const leadMap = new Map<string, { nome: string | null; telefone: string }>();

      if (leadIds.length) {
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id, nome, telefone")
          .in("id", leadIds);

        if (leadsError) throw leadsError;

        (leads ?? []).forEach((lead) => {
          leadMap.set(lead.id, { nome: lead.nome, telefone: lead.telefone });
        });
      }

      return uniqueMessages.map((message) => {
        const lead = message.lead_id ? leadMap.get(message.lead_id) : undefined;
        return {
          ...message,
          leadName: getLeadName(lead?.nome, lead?.telefone || message.telefone),
        };
      });
    },
    enabled: !!activeLojaId,
  });

  if (!activeLojaId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <Store className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-lg font-semibold">Nenhuma loja ativa vinculada</p>
            <p className="mt-1 text-sm text-muted-foreground">Peça ao admin para vincular sua conta a uma loja operacional.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const assistantName = lojaContext?.nome_assistente || "Assistente";
  const currentMonth = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{currentMonth} · {lojaContext?.nome_loja || "Loja ativa"}</p>
        </div>
        <Badge variant="outline" className="w-fit">Operação por loja</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Leads hoje" value={String(kpis?.leadsHoje ?? 0)} icon={Users} href="/leads" />
        <StatCard title="Conversas ativas" value={String(kpis?.conversasAtivas ?? 0)} icon={MessageSquareText} href="/whatsapp" />
        <StatCard title="Follow-ups pendentes" value={String(kpis?.followUpsPendentes ?? 0)} icon={Workflow} href="/followups" />
        <StatCard title="Visitas agendadas" value={String(kpis?.visitasAgendadas ?? 0)} icon={CalendarDays} href="/visitas" />
        <StatCard title="Produtos no catálogo" value={String(kpis?.produtosCatalogo ?? 0)} icon={Package} href="/catalogo" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr,1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">Últimas 5 conversas</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary">
                <Link to="/whatsapp">
                  Abrir inbox
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latestConversations.length ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Ainda não há conversas registradas para esta loja.
              </div>
            ) : (
              latestConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to="/whatsapp"
                  className="flex flex-col gap-2 rounded-2xl border border-border p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{conversation.leadName}</p>
                      <p className="text-xs text-muted-foreground">{conversation.role === "assistant" ? assistantName : "Cliente"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(conversation.created_at)}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{conversation.content}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Loja</p>
                <p className="mt-2 text-lg font-semibold">{lojaContext?.nome_loja || "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Assistente</p>
                <p className="mt-2 text-lg font-semibold">{assistantName}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Próximo foco</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Priorize os {kpis?.followUpsPendentes ?? 0} follow-ups pendentes e acompanhe as conversas ativas do inbox.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking de vendedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Conversões no mês</p>
                <p className="mt-2 text-2xl font-semibold">{monthlyConversions?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                O sistema já mede conversões da loja no mês, mas ainda não atribui um vendedor diretamente ao lead na tabela <code>leads</code>. Por isso, o ranking individual não é exibido para evitar números incorretos.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}