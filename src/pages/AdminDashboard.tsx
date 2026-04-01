import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, MessageSquareText, Settings2, Store, Users, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
