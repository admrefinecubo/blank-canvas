import { useMemo } from "react";
import { BarChart3, Users, Calendar, DollarSign, TrendingUp, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 71% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)", "hsl(270 60% 55%)"];

export default function Reports() {
  const { clinicId } = useAuth();
  const now = new Date();

  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM", { locale: ptBR }) };
  }), []);

  const { data: patients } = useQuery({
    queryKey: ["report-patients", clinicId],
    queryFn: async () => { if (!clinicId) return []; const { data } = await supabase.from("patients").select("id, created_at, stage, source, utm_source, utm_campaign, tags").eq("clinic_id", clinicId); return data || []; },
    enabled: !!clinicId,
  });

  const { data: appointments } = useQuery({
    queryKey: ["report-appointments", clinicId],
    queryFn: async () => { if (!clinicId) return []; const { data } = await supabase.from("appointments").select("id, date, status, professional_name").eq("clinic_id", clinicId); return data || []; },
    enabled: !!clinicId,
  });

  const { data: budgets } = useQuery({
    queryKey: ["report-budgets", clinicId],
    queryFn: async () => { if (!clinicId) return []; const { data } = await supabase.from("budgets").select("id, created_at, status, total").eq("clinic_id", clinicId); return data || []; },
    enabled: !!clinicId,
  });

  const { data: npsData } = useQuery({
    queryKey: ["report-nps", clinicId],
    queryFn: async () => { if (!clinicId) return []; const { data } = await supabase.from("nps_responses").select("id, score, created_at").eq("clinic_id", clinicId); return data || []; },
    enabled: !!clinicId,
  });

  const leadsPerMonth = useMemo(() => {
    if (!patients) return [];
    return months.map(m => ({ name: m.label, leads: patients.filter(p => { const d = new Date(p.created_at); return d >= m.start && d <= m.end; }).length }));
  }, [patients, months]);

  const revenuePerMonth = useMemo(() => {
    if (!budgets) return [];
    return months.map(m => ({ name: m.label, faturamento: budgets.filter(b => b.status === "aprovado" && new Date(b.created_at) >= m.start && new Date(b.created_at) <= m.end).reduce((sum, b) => sum + (b.total || 0), 0) }));
  }, [budgets, months]);

  const budgetStatusPie = useMemo(() => {
    if (!budgets?.length) return [];
    const counts: Record<string, number> = {};
    budgets.forEach(b => { counts[b.status || "pendente"] = (counts[b.status || "pendente"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [budgets]);

  const sourcePie = useMemo(() => {
    if (!patients?.length) return [];
    const counts: Record<string, number> = {};
    patients.forEach(p => { counts[p.source || "manual"] = (counts[p.source || "manual"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patients]);

  // UTM Campaign breakdown
  const campaignPie = useMemo(() => {
    if (!patients?.length) return [];
    const withCampaign = patients.filter((p: any) => p.utm_campaign);
    if (!withCampaign.length) return [];
    const counts: Record<string, number> = {};
    withCampaign.forEach((p: any) => { counts[p.utm_campaign] = (counts[p.utm_campaign] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patients]);

  // Professional performance
  const professionalStats = useMemo(() => {
    if (!appointments?.length) return [];
    const stats: Record<string, { total: number; realized: number; noshow: number }> = {};
    appointments.forEach((a: any) => {
      const name = a.professional_name || "Não atribuído";
      if (!stats[name]) stats[name] = { total: 0, realized: 0, noshow: 0 };
      stats[name].total++;
      if (a.status === "realizado") stats[name].realized++;
      if (a.status === "no-show") stats[name].noshow++;
    });
    return Object.entries(stats).map(([name, s]) => ({ name, ...s, rate: s.total > 0 ? Math.round((s.realized / s.total) * 100) : 0 }));
  }, [appointments]);

  const npsAvg = useMemo(() => npsData?.length ? (npsData.reduce((s, n) => s + n.score, 0) / npsData.length).toFixed(1) : null, [npsData]);

  const totalLeads = patients?.length || 0;
  const totalAppointments = appointments?.length || 0;
  const totalRevenue = budgets?.filter(b => b.status === "aprovado").reduce((s, b) => s + (b.total || 0), 0) || 0;
  const conversionRate = budgets?.length ? ((budgets.filter(b => b.status === "aprovado").length / budgets.length) * 100).toFixed(1) : "0";

  if (!clinicId) return (<div className="space-y-6"><h1 className="text-2xl font-bold">Relatórios</h1><Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">Selecione uma loja.</p></CardContent></Card></div>);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Total Leads</p></div><p className="text-2xl font-bold">{totalLeads}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Visitas</p></div><p className="text-2xl font-bold">{totalAppointments}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Faturamento</p></div><p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Conversão</p></div><p className="text-2xl font-bold">{conversionRate}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">NPS Médio</p></div><p className="text-2xl font-bold">{npsAvg ?? "—"}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Leads por Mês</CardTitle></CardHeader>
          <CardContent>
            {leadsPerMonth.some(l => l.leads > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadsPerMonth}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" className="text-xs" /><YAxis allowDecimals={false} className="text-xs" /><Tooltip /><Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p className="py-12 text-center text-sm text-muted-foreground">Sem dados de leads.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Faturamento por Mês</CardTitle></CardHeader>
          <CardContent>
            {revenuePerMonth.some(r => r.faturamento > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenuePerMonth}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" className="text-xs" /><YAxis className="text-xs" /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} /><Line type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
              </ResponsiveContainer>
            ) : <p className="py-12 text-center text-sm text-muted-foreground">Sem dados.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Status dos Orçamentos</CardTitle></CardHeader>
          <CardContent>
            {budgetStatusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={budgetStatusPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{budgetStatusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <p className="py-12 text-center text-sm text-muted-foreground">Sem orçamentos.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Origem dos Leads</CardTitle></CardHeader>
          <CardContent>
            {sourcePie.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={sourcePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{sourcePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <p className="py-12 text-center text-sm text-muted-foreground">Sem leads.</p>}
          </CardContent>
        </Card>
      </div>

      {/* New: Campaign & Professional stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {campaignPie.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4" /> Leads por Campanha (UTM)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={campaignPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{campaignPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {professionalStats.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Desempenho por Vendedor</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={professionalStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                  <Tooltip />
                  <Bar dataKey="realized" name="Realizados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="noshow" name="No-show" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
