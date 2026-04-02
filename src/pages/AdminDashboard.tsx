import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Building2, MessageSquareText, Settings2, Store, TrendingUp, Users, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function AdminStatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { impersonateClinic } = useAuth();

  const startOfToday = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-operational-dashboard", startOfToday],
    queryFn: async () => {
      const [lojasResult, leadsResult, mensagensResult, followUpsResult, integrationsResult, clinicsResult] = await Promise.all([
        supabase.from("lojas").select("id, nome_loja, ativo, clinic_id, instance").order("created_at", { ascending: false }),
        supabase.from("leads").select("id, loja_id"),
        supabase.from("historico_mensagens").select("lead_id, loja_id, created_at").gte("created_at", startOfToday),
        supabase.from("follow_ups").select("id, loja_id, enviado"),
        supabase.from("clinic_integrations").select("clinic_id, provider, status"),
        supabase.from("clinics").select("id, name"),
      ]);

      if (lojasResult.error) throw lojasResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (mensagensResult.error) throw mensagensResult.error;
      if (followUpsResult.error) throw followUpsResult.error;
      if (integrationsResult.error) throw integrationsResult.error;
      if (clinicsResult.error) throw clinicsResult.error;

      return {
        lojas: lojasResult.data ?? [],
        leads: leadsResult.data ?? [],
        mensagens: mensagensResult.data ?? [],
        followUps: followUpsResult.data ?? [],
        integrations: integrationsResult.data ?? [],
        clinics: clinicsResult.data ?? [],
      };
    },
  });

  const { data: globalMetrics, isLoading: globalLoading } = useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("platform-metrics", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        summary: {
          total_lojas_ativas: number;
          total_leads_mes: number;
          total_mensagens_processadas: number;
        };
        ranking: Array<{
          id: string;
          nome_loja: string;
          leads_mes: number;
          conversas_ativas: number;
          bot_status: "conectado" | "desconectado";
          ativo: boolean;
          clinic_id: string | null;
        }>;
        growth: Array<{ semana: string; leads: number }>;
        alerts: Array<{
          loja_id: string;
          nome_loja: string;
          status: string;
          horas_desconectado: number;
        }>;
      };
    },
  });

  const summary = useMemo(() => {
    const lojas = data?.lojas ?? [];
    const leads = data?.leads ?? [];
    const mensagens = data?.mensagens ?? [];
    const followUps = data?.followUps ?? [];
    const integrations = data?.integrations ?? [];
    const clinics = data?.clinics ?? [];

    const rows = lojas.map((loja) => {
      const leadsCount = leads.filter((lead) => lead.loja_id === loja.id).length;
      const conversasHoje = new Set(
        mensagens
          .filter((message) => message.loja_id === loja.id)
          .map((message) => message.lead_id)
          .filter((leadId): leadId is string => Boolean(leadId)),
      ).size;
      const clinicName = clinics.find((clinic) => clinic.id === loja.clinic_id)?.name || null;
      const whatsappIntegration = integrations.find(
        (integration) => integration.clinic_id === loja.clinic_id && integration.provider === "evolution_api",
      );

      return {
        ...loja,
        clinicName,
        leadsCount,
        conversasHoje,
        whatsappOnline: whatsappIntegration?.status === "connected",
      };
    });

    const followUpsEnviados = followUps.filter((item) => item.enviado).length;
    const totalConversasHoje = new Set(
      mensagens.map((message) => message.lead_id).filter((leadId): leadId is string => Boolean(leadId)),
    ).size;

    return {
      lojasAtivas: rows.filter((row) => row.ativo).length,
      totalLeads: leads.length,
      conversasHoje: totalConversasHoje,
      followUpsResumo: `${followUpsEnviados}/${followUps.length}`,
      rows,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Admin</Badge>
            <Badge variant="secondary">Operação por lojas</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Dashboard operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe lojas ativas, conversas do dia e saúde do WhatsApp sem misturar dados de clínica.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/lojas">
              <Store className="h-4 w-4" />
              Gerenciar lojas
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/admin/stats">
              <BarChart3 className="h-4 w-4" />
              Ver estatísticas
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Lojas ativas" value={String(summary.lojasAtivas)} icon={Building2} />
        <AdminStatCard title="Total leads" value={String(summary.totalLeads)} icon={Users} />
        <AdminStatCard title="Conversas hoje" value={String(summary.conversasHoje)} icon={MessageSquareText} />
        <AdminStatCard title="Follow-ups enviados" value={summary.followUpsResumo} icon={Workflow} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Plataforma</Badge>
          <Badge variant="secondary">Service role</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminStatCard
            title="Total de lojas ativas"
            value={globalLoading ? "..." : String(globalMetrics?.summary.total_lojas_ativas || 0)}
            icon={Store}
          />
          <AdminStatCard
            title="Leads do mês"
            value={globalLoading ? "..." : String(globalMetrics?.summary.total_leads_mes || 0)}
            icon={Users}
          />
          <AdminStatCard
            title="Mensagens processadas"
            value={globalLoading ? "..." : String(globalMetrics?.summary.total_mensagens_processadas || 0)}
            icon={MessageSquareText}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking das lojas</CardTitle>
            </CardHeader>
            <CardContent>
              {globalLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Carregando métricas globais...</div>
              ) : !globalMetrics?.ranking.length ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhuma loja encontrada para o ranking.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Leads do mês</TableHead>
                      <TableHead>Conversas ativas</TableHead>
                      <TableHead>Status do bot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalMetrics.ranking.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.nome_loja}</TableCell>
                        <TableCell>{row.leads_mes}</TableCell>
                        <TableCell>{row.conversas_ativas}</TableCell>
                        <TableCell>
                          <Badge variant={row.bot_status === "conectado" ? "default" : "secondary"}>
                            {row.bot_status === "conectado" ? "Conectado" : "Desconectado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {globalLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Carregando alertas...</div>
              ) : globalMetrics?.alerts.length ? (
                globalMetrics.alerts.map((alert) => (
                  <div key={alert.loja_id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{alert.nome_loja}</p>
                        <p className="text-sm text-muted-foreground">Bot {alert.status} há {alert.horas_desconectado}h.</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum bot desconectado há mais de 24h.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Crescimento de leads por semana · últimos 3 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {globalLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Carregando crescimento...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={globalMetrics?.growth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="semana" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lojas operacionais</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando dashboard...</div>
          ) : !summary.rows.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma loja operacional cadastrada ainda.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Loja</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Leads</th>
                  <th className="pb-3 font-medium">Conversas hoje</th>
                  <th className="pb-3 font-medium">WhatsApp</th>
                  <th className="pb-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 align-middle">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{row.nome_loja}</p>
                        <p className="text-xs text-muted-foreground">{row.clinicName || "Sem conta vinculada"}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant={row.ativo ? "default" : "destructive"}>{row.ativo ? "Ativa" : "Inativa"}</Badge>
                    </td>
                    <td className="py-4">{row.leadsCount}</td>
                    <td className="py-4">{row.conversasHoje}</td>
                    <td className="py-4">
                      <Badge variant={row.whatsappOnline ? "default" : "secondary"}>{row.whatsappOnline ? "Online" : "Offline"}</Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!row.clinic_id}
                          onClick={() => {
                            if (!row.clinic_id) return;
                            impersonateClinic(row.clinic_id);
                            navigate("/dashboard");
                          }}
                        >
                          Entrar
                        </Button>
                        <Button asChild size="sm" className="gap-1.5">
                          <Link to={`/admin/lojas/${row.id}`}>
                            <Settings2 className="h-3.5 w-3.5" />
                            Config
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
