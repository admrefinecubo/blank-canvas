import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, MessageSquareText, Settings2, Store, Users, Workflow } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { MiniAreaChart } from "@/components/MiniAreaChart";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function AdminStatCard({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType; isLoading?: boolean }) {
  return (
    <Card className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          {isLoading ? <Skeleton className="mt-2 h-9 w-16" /> : (
            <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-rose-500"}`} />
    </span>
  );
}

export default function AdminDashboard() {
  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  // Platform metrics from edge function
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin-platform-metrics"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await supabase.functions.invoke("platform-metrics", {
        body: {},
      });
      if (res.error) throw res.error;
      return res.data as {
        summary: { total_lojas_ativas: number; total_leads_mes: number; total_mensagens_processadas: number };
        ranking: Array<{ id: string; nome_loja: string; leads_mes: number; conversas_ativas: number; bot_status: string; ativo: boolean; clinic_id: string }>;
        growth: Array<{ semana: string; leads: number }>;
        alerts: Array<{ loja_id: string; nome_loja: string; status: string; horas_desconectado: number }>;
      };
    },
    staleTime: 60_000,
  });

  // Fallback direct queries for follow-ups and today messages
  const { data: extraKpis, isLoading: extraLoading } = useQuery({
    queryKey: ["admin-extra-kpis", startOfToday],
    queryFn: async () => {
      const [msgs, followUps] = await Promise.all([
        supabase.from("historico_mensagens").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
        supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("enviado", false),
      ]);
      return {
        mensagensHoje: msgs.count ?? 0,
        followUpsPendentes: followUps.count ?? 0,
      };
    },
  });

  const isLoading = metricsLoading || extraLoading;
  const summary = metrics?.summary;
  const ranking = metrics?.ranking ?? [];
  const growth = metrics?.growth ?? [];
  const alerts = metrics?.alerts ?? [];

  const chartData = growth.map((g) => ({ label: g.semana, value: g.leads }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Admin</Badge>
            <Badge variant="secondary">Operação por lojas</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {getGreeting()}, Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/lojas">
              <Store className="h-4 w-4" />
              Gerenciar lojas
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {alerts.length} loja{alerts.length > 1 ? "s" : ""} com WhatsApp desconectado
              </p>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.loja_id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{a.nome_loja}</span>
                  <span className="text-xs text-muted-foreground">há {a.horas_desconectado}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Lojas Ativas" value={String(summary?.total_lojas_ativas ?? 0)} icon={Building2} isLoading={isLoading} />
        <AdminStatCard title="Leads este mês" value={String(summary?.total_leads_mes ?? 0)} icon={Users} isLoading={isLoading} />
        <AdminStatCard title="Mensagens hoje" value={String(extraKpis?.mensagensHoje ?? 0)} icon={MessageSquareText} isLoading={isLoading} />
        <AdminStatCard title="Follow-ups pendentes" value={String(extraKpis?.followUpsPendentes ?? 0)} icon={Workflow} isLoading={isLoading} />
      </div>

      {/* Growth chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescimento de leads — últimas 12 semanas</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[140px] w-full rounded-lg" />
            ) : (
              <MiniAreaChart data={chartData} height={140} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Store table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lojas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !ranking.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma loja cadastrada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da loja</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Leads este mês</TableHead>
                  <TableHead>Conversas ativas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((row) => (
                  <TableRow key={row.id} className="hover:bg-accent/40 transition-colors">
                    <TableCell className="font-medium">{row.nome_loja}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusDot connected={row.bot_status === "conectado"} />
                        <span className="text-xs text-muted-foreground capitalize">{row.bot_status}</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>{row.leads_mes}</TableCell>
                    <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>{row.conversas_ativas}</TableCell>
                    <TableCell>
                      <Badge variant={row.ativo ? "default" : "secondary"}>
                        {row.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" className="gap-1.5 active:scale-95 transition-transform duration-100">
                        <Link to={`/admin/lojas/${row.id}`}>
                          <Settings2 className="h-3.5 w-3.5" />
                          Gerenciar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
