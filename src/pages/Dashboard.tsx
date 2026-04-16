import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  MessageSquareText,
  Package,
  ShoppingBag,
  Store,
  Users,
  Workflow,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getLeadName } from "@/lib/whatsapp-admin";
import LojaOnboardingWizard from "@/components/LojaOnboardingWizard";
import { TrendBadge } from "@/components/TrendBadge";
import { PipelineBar } from "@/components/PipelineBar";
import { MiniAreaChart } from "@/components/MiniAreaChart";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  isLoading,
  trend,
}: {
  title: string;
  value: string;
  icon: ElementType;
  href?: string;
  isLoading?: boolean;
  trend?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                {value}
              </p>
            )}
            {!isLoading && trend && <div className="pt-0.5">{trend}</div>}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href && (
          <div className="mt-3">
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-0 text-primary hover:text-primary active:scale-95 transition-transform duration-100">
              <Link to={href}>
                Ver detalhe
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = [
    "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  ];

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colors[hash % colors.length]}`}>
      {initials || "?"}
    </div>
  );
}

export default function Dashboard() {
  const { activeLojaId, activeClinicId } = useAuth();

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const startOfYesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const last24Hours = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d.toISOString();
  }, []);

  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const { data: lojaContext } = useQuery({
    queryKey: ["loja-onboarding", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("*")
        .eq("id", activeLojaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const [wizardDismissed, setWizardDismissed] = useState(false);
  const showWizard = !wizardDismissed && lojaContext && lojaContext.onboarding_concluido === false;

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["dashboard-kpis-v2", activeLojaId, activeClinicId, startOfToday, startOfYesterday, todayDate, last24Hours, nowIso],
    queryFn: async () => {
      const [
        leadsToday,
        leadsYesterday,
        activeConvos,
        activeConvosYesterday,
        followUps,
        visitas,
        produtos,
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).gte("created_at", startOfToday),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).gte("created_at", startOfYesterday).lt("created_at", startOfToday),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("is_bot_active", true).gte("ultima_interacao", last24Hours),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("is_bot_active", true).gte("ultima_interacao", startOfYesterday).lt("ultima_interacao", startOfToday),
        supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("enviado", false).lte("agendado_para", nowIso),
        activeClinicId
          ? supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", activeClinicId).eq("date", todayDate).eq("status", "agendado")
          : Promise.resolve({ count: 0, error: null }),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!).eq("estoque_disponivel", true),
      ]);

      return {
        leadsHoje: leadsToday.count ?? 0,
        leadsOntem: leadsYesterday.count ?? 0,
        conversasAtivas: activeConvos.count ?? 0,
        conversasOntem: activeConvosYesterday.count ?? 0,
        followUpsPendentes: followUps.count ?? 0,
        visitasAgendadas: visitas.count ?? 0,
        produtosCatalogo: produtos.count ?? 0,
      };
    },
    enabled: !!activeLojaId,
  });

  // Weekly leads chart
  const { data: weeklyLeads } = useQuery({
    queryKey: ["dashboard-weekly-leads", activeLojaId, sevenDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .eq("loja_id", activeLojaId!)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const buckets: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (data ?? []).forEach((l) => {
        const key = l.created_at.slice(0, 10);
        if (key in buckets) buckets[key]++;
      });
      return Object.entries(buckets).map(([date, count]) => ({
        label: format(new Date(date + "T12:00:00"), "EEE", { locale: ptBR }),
        value: count,
      }));
    },
    enabled: !!activeLojaId,
  });

  // Pipeline snapshot
  const { data: pipelineData } = useQuery({
    queryKey: ["dashboard-pipeline", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("etapa_pipeline")
        .eq("loja_id", activeLojaId!);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((l) => {
        counts[l.etapa_pipeline] = (counts[l.etapa_pipeline] || 0) + 1;
      });
      return counts;
    },
    enabled: !!activeLojaId,
  });

  // Vendas do mês
  const { data: vendasMes } = useQuery({
    queryKey: ["dashboard-vendas-mes", activeLojaId, startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("valor_total")
        .eq("loja_id", activeLojaId!)
        .gte("created_at", startOfMonth);
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.reduce((s, v) => s + (v.valor_total ?? 0), 0),
        count: rows.length,
      };
    },
    enabled: !!activeLojaId,
  });

  // Latest conversations
  const { data: latestConversations = [], isLoading: convosLoading } = useQuery({
    queryKey: ["dashboard-latest-conversations", activeLojaId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from("historico_mensagens")
        .select("id, lead_id, content, created_at, role, telefone")
        .eq("loja_id", activeLojaId!)
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;

      const unique = (messages ?? []).reduce<any[]>((acc, m) => {
        const key = m.lead_id || m.telefone;
        if (!key || acc.some((i) => (i.lead_id || i.telefone) === key)) return acc;
        acc.push(m);
        return acc;
      }, []).slice(0, 5);

      const leadIds = unique.map((m) => m.lead_id).filter(Boolean);
      const leadMap = new Map<string, { nome: string | null; telefone: string }>();
      if (leadIds.length) {
        const { data: leads } = await supabase.from("leads").select("id, nome, telefone").in("id", leadIds);
        (leads ?? []).forEach((l) => leadMap.set(l.id, { nome: l.nome, telefone: l.telefone }));
      }

      return unique.map((m) => {
        const lead = m.lead_id ? leadMap.get(m.lead_id) : undefined;
        return { ...m, leadName: getLeadName(lead?.nome, lead?.telefone || m.telefone) };
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

  const assistantName = lojaContext?.nome_assistente_ia || "Assistente";
  const greeting = getGreeting();
  const lojaName = lojaContext?.nome_loja || "Loja";

  return (
    <div className="space-y-6">
      {showWizard && lojaContext && (
        <LojaOnboardingWizard loja={lojaContext} open={showWizard} onClose={() => setWizardDismissed(true)} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}, {lojaName}</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs">{assistantName} ativo</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Leads hoje"
          value={String(kpis?.leadsHoje ?? 0)}
          icon={Users}
          href="/leads"
          isLoading={kpisLoading}
          trend={kpis && <TrendBadge current={kpis.leadsHoje} previous={kpis.leadsOntem} />}
        />
        <StatCard
          title="Conversas ativas"
          value={String(kpis?.conversasAtivas ?? 0)}
          icon={MessageSquareText}
          href="/whatsapp"
          isLoading={kpisLoading}
          trend={kpis && <TrendBadge current={kpis.conversasAtivas} previous={kpis.conversasOntem} />}
        />
        <StatCard title="Follow-ups pendentes" value={String(kpis?.followUpsPendentes ?? 0)} icon={Workflow} href="/followups" isLoading={kpisLoading} />
        <StatCard title="Visitas agendadas" value={String(kpis?.visitasAgendadas ?? 0)} icon={CalendarDays} href="/visitas" isLoading={kpisLoading} />
        <StatCard title="Produtos no catálogo" value={String(kpis?.produtosCatalogo ?? 0)} icon={Package} href="/catalogo" isLoading={kpisLoading} />
      </div>

      {/* Charts row: Weekly + Pipeline + Sales */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads — últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyLeads ? (
              <MiniAreaChart data={weeklyLeads} />
            ) : (
              <Skeleton className="h-[120px] w-full rounded-lg" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline de leads</CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineData ? (
              <PipelineBar data={pipelineData} />
            ) : (
              <Skeleton className="h-[80px] w-full rounded-lg" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do mês</CardTitle>
          </CardHeader>
          <CardContent>
            {vendasMes ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    R$ {vendasMes.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{vendasMes.count} venda{vendasMes.count !== 1 ? "s" : ""} este mês</p>
                </div>
              </div>
            ) : (
              <Skeleton className="h-12 w-48" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversations + Quick actions */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr,1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">Últimas conversas</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary active:scale-95 transition-transform duration-100">
                <Link to="/whatsapp">
                  Abrir inbox
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {convosLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : !latestConversations.length ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Ainda não há conversas registradas.
              </div>
            ) : (
              latestConversations.map((c) => (
                <Link
                  key={c.id}
                  to="/whatsapp"
                  className="flex items-start gap-3 rounded-2xl border border-border p-4 transition-all duration-200 hover:bg-accent/40 hover:shadow-sm"
                >
                  <AvatarInitials name={c.leadName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{c.leadName}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={c.role === "assistant" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {c.role === "assistant" ? assistantName : "Cliente"}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground mt-1">{c.content}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { label: "Ver follow-ups", href: "/followups", icon: Workflow },
                { label: "Abrir catálogo", href: "/catalogo", icon: ShoppingBag },
                { label: "Gerenciar leads", href: "/leads", icon: Users },
                { label: "Ver visitas", href: "/visitas", icon: CalendarDays },
              ].map((item) => (
                <Button key={item.href} asChild variant="outline" className="justify-start gap-2 h-10">
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Dica do dia</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {(kpis?.followUpsPendentes ?? 0) > 0
                  ? `Você tem ${kpis?.followUpsPendentes} follow-ups pendentes. Priorize-os para não perder oportunidades!`
                  : "Tudo em dia! Acompanhe as conversas ativas no inbox."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
