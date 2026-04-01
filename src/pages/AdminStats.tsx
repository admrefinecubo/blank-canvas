import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Building2, MessageSquare, RefreshCcw, Users } from "lucide-react";

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStats() {
  const { data: lojas = [] } = useQuery({
    queryKey: ["admin-stats-lojas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lojas").select("id, nome_loja, ativo, clinic_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-stats-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, loja_id, etapa_pipeline, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ["admin-stats-mensagens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("historico_mensagens").select("id, loja_id, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["admin-stats-followups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("follow_ups").select("id, loja_id, enviado");
      if (error) throw error;
      return data;
    },
  });

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sentFollowups = followups.filter((item) => item.enviado).length;

    return {
      lojasAtivas: lojas.filter((loja) => loja.ativo).length,
      totalLeads: leads.length,
      conversasHoje: mensagens.filter((item) => item.created_at?.slice(0, 10) === today).length,
      followupRate: followups.length ? Math.round((sentFollowups / followups.length) * 100) : 0,
    };
  }, [followups, leads, lojas, mensagens]);

  const lojaStats = useMemo(() => {
    return lojas.map((loja) => {
      const leadsLoja = leads.filter((lead) => lead.loja_id === loja.id);
      const mensagensLoja = mensagens.filter((mensagem) => mensagem.loja_id === loja.id);
      const followupsLoja = followups.filter((followup) => followup.loja_id === loja.id);

      return {
        id: loja.id,
        nome: loja.nome_loja,
        ativo: loja.ativo,
        leads: leadsLoja.length,
        conversas: mensagensLoja.length,
        followupsPendentes: followupsLoja.filter((item) => !item.enviado).length,
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [followups, leads, lojas, mensagens]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Estatísticas globais</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão operacional do ambiente multi-tenant.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lojas ativas" value={String(summary.lojasAtivas)} icon={Building2} />
        <StatCard title="Leads totais" value={String(summary.totalLeads)} icon={Users} />
        <StatCard title="Conversas hoje" value={String(summary.conversasHoje)} icon={MessageSquare} />
        <StatCard title="Follow-ups enviados" value={`${summary.followupRate}%`} icon={RefreshCcw} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Performance por loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lojaStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há dados suficientes para estatísticas.</p>
          ) : (
            lojaStats.map((loja) => (
              <div key={loja.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{loja.nome}</p>
                    <Badge variant={loja.ativo ? "default" : "secondary"}>{loja.ativo ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{loja.leads} leads · {loja.conversas} mensagens · {loja.followupsPendentes} follow-ups pendentes</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm md:min-w-[320px]">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Leads</p>
                    <p className="mt-1 font-semibold">{loja.leads}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Mensagens</p>
                    <p className="mt-1 font-semibold">{loja.conversas}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Pendentes</p>
                    <p className="mt-1 font-semibold">{loja.followupsPendentes}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}