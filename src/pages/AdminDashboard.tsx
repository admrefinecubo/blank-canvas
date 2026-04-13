import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, MessageSquareText, Settings2, Store, Users, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function AdminStatCard({ title, value, icon: Icon, index = 0 }: { title: string; value: string; icon: React.ElementType; index?: number }) {
  return (
    <Card
      className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg animate-fade-in [animation-fill-mode:both]"
      style={{ animationDelay: `${index * 75}ms` }}
    >
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-direct", startOfToday, startOfMonth],
    queryFn: async () => {
      const [lojasResult, leadsResult, mensagensResult, followUpsResult] = await Promise.all([
        supabase
          .from("lojas")
          .select("id, nome_loja, ativo, instance, clinic_id, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("leads")
          .select("id, loja_id, etapa_pipeline, origem, created_at")
          .gte("created_at", startOfMonth),
        supabase
          .from("historico_mensagens")
          .select("id, loja_id")
          .gte("created_at", startOfToday),
        supabase
          .from("follow_ups")
          .select("id, loja_id")
          .eq("enviado", false),
      ]);

      if (lojasResult.error) throw lojasResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (mensagensResult.error) throw mensagensResult.error;
      if (followUpsResult.error) throw followUpsResult.error;

      return {
        lojas: lojasResult.data ?? [],
        leads: leadsResult.data ?? [],
        mensagens: mensagensResult.data ?? [],
        followUps: followUpsResult.data ?? [],
      };
    },
  });

  const summary = useMemo(() => {
    const lojas = data?.lojas ?? [];
    const leads = data?.leads ?? [];
    const mensagens = data?.mensagens ?? [];
    const followUps = data?.followUps ?? [];

    const leadsByLoja = new Map<string, number>();
    leads.forEach((l) => {
      if (l.loja_id) leadsByLoja.set(l.loja_id, (leadsByLoja.get(l.loja_id) || 0) + 1);
    });

    const msgByLoja = new Map<string, number>();
    mensagens.forEach((m) => {
      if (m.loja_id) msgByLoja.set(m.loja_id, (msgByLoja.get(m.loja_id) || 0) + 1);
    });

    const rows = lojas.map((loja) => ({
      ...loja,
      leadsMes: leadsByLoja.get(loja.id) || 0,
      mensagensHoje: msgByLoja.get(loja.id) || 0,
    }));

    return {
      lojasAtivas: lojas.filter((l) => l.ativo).length,
      totalLeadsMes: leads.length,
      totalMensagensHoje: mensagens.length,
      followUpsPendentes: followUps.length,
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
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe lojas ativas, conversas do dia e saúde do WhatsApp.</p>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Lojas Ativas" value={isLoading ? "..." : String(summary.lojasAtivas)} icon={Building2} index={0} />
        <AdminStatCard title="Leads este mês" value={isLoading ? "..." : String(summary.totalLeadsMes)} icon={Users} index={1} />
        <AdminStatCard title="Mensagens hoje" value={isLoading ? "..." : String(summary.totalMensagensHoje)} icon={MessageSquareText} index={2} />
        <AdminStatCard title="Follow-ups pendentes" value={isLoading ? "..." : String(summary.followUpsPendentes)} icon={Workflow} index={3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lojas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando dashboard...</div>
          ) : !summary.rows.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma loja cadastrada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da loja</TableHead>
                  <TableHead>Instância WhatsApp</TableHead>
                  <TableHead>Leads este mês</TableHead>
                  <TableHead>Mensagens hoje</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.rows.map((row, i) => (
                  <TableRow key={row.id} className="animate-fade-in [animation-fill-mode:both]" style={{ animationDelay: `${300 + i * 50}ms` }}>
                    <TableCell className="font-medium">{row.nome_loja}</TableCell>
                    <TableCell>
                      {row.instance ? (
                        <Badge variant="secondary">{row.instance}</Badge>
                      ) : (
                        <Badge variant="destructive">Sem instância</Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.leadsMes}</TableCell>
                    <TableCell>{row.mensagensHoje}</TableCell>
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
