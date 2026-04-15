import { useMemo, useState } from "react";
import { BarChart3, Clock3, Filter, PieChart as PieChartIcon, Table2, TrendingUp } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary-foreground))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

const PERIOD_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
] as const;

const FUNNEL_STAGES = [
  { key: "novo", label: "Novo contato" },
  { key: "qualificado", label: "Qualificado" },
  { key: "visita", label: "Visita" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
] as const;

const ORIGIN_LABELS = ["whatsapp", "instagram", "google", "indicacao", "manual"];

type LeadRow = {
  id: string;
  nome: string | null;
  interesse: string | null;
  origem: string | null;
  etapa_pipeline: string;
  created_at: string;
  ultima_interacao: string | null;
};

type MessageRow = {
  id: string;
  lead_id: string | null;
  content: string;
  role: string;
  created_at: string;
};

export default function Reports() {
  const { activeLojaId } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>("30");
  const startDate = useMemo(() => startOfDay(subDays(new Date(), Number(period) - 1)), [period]);

  const { data: loja } = useQuery({
    queryKey: ["reports-loja", activeLojaId],
    queryFn: async () => {
      if (!activeLojaId) return null;
      const { data, error } = await supabase.from("lojas").select("id, nome_loja, nome_assistente_ia").eq("id", activeLojaId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["reports-leads", activeLojaId, startDate.toISOString()],
    queryFn: async () => {
      if (!activeLojaId) return [] as LeadRow[];
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, interesse, origem, etapa_pipeline, created_at, ultima_interacao")
        .eq("loja_id", activeLojaId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as LeadRow[];
    },
    enabled: !!activeLojaId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["reports-messages", activeLojaId, startDate.toISOString()],
    queryFn: async () => {
      if (!activeLojaId) return [] as MessageRow[];
      const { data, error } = await supabase
        .from("historico_mensagens")
        .select("id, lead_id, content, role, created_at")
        .eq("loja_id", activeLojaId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as MessageRow[];
    },
    enabled: !!activeLojaId,
  });

  const selectedLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? "30 dias";

  const conversionFunnel = useMemo(() => {
    const counts = { novo: 0, qualificado: 0, visita: 0, fechado: 0, perdido: 0 };

    leads.forEach((lead) => {
      const stage = lead.etapa_pipeline;
      if (stage === "novo") counts.novo += 1;
      if (stage === "qualificado") counts.qualificado += 1;
      if (stage === "orcamento" || stage === "negociacao") counts.visita += 1;
      if (stage === "fechado_ganho") counts.fechado += 1;
      if (stage === "fechado_perdido") counts.perdido += 1;
    });

    return FUNNEL_STAGES.map((stage) => ({ etapa: stage.label, total: counts[stage.key] }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = Object.fromEntries(ORIGIN_LABELS.map((origin) => [origin, 0])) as Record<string, number>;

    leads.forEach((lead) => {
      const normalized = (lead.origem || "manual").toLowerCase();
      if (normalized in counts) counts[normalized] += 1;
      else counts.manual += 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [leads]);

  const responseTimeline = useMemo(() => {
    const days = Array.from({ length: Number(period) }, (_, index) => {
      const day = startOfDay(subDays(new Date(), Number(period) - index - 1));
      return {
        key: format(day, "yyyy-MM-dd"),
        label: format(day, "dd/MM", { locale: ptBR }),
        totalMinutes: 0,
        responses: 0,
      };
    });

    const byDay = new Map(days.map((day) => [day.key, day]));
    const groupedByLead = new Map<string, MessageRow[]>();

    messages.forEach((message) => {
      if (!message.lead_id) return;
      const existing = groupedByLead.get(message.lead_id) || [];
      existing.push(message);
      groupedByLead.set(message.lead_id, existing);
    });

    groupedByLead.forEach((leadMessages) => {
      const sorted = [...leadMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (!current || !next) continue;
        if (current.role !== "user" || next.role !== "assistant") continue;

        const diffMinutes = Math.max(0, (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) / 60000);
        const dayKey = format(new Date(current.created_at), "yyyy-MM-dd");
        const bucket = byDay.get(dayKey);
        if (!bucket) continue;

        bucket.totalMinutes += diffMinutes;
        bucket.responses += 1;
        break;
      }
    });

    return days.map((day) => ({
      date: day.label,
      mediaMinutos: day.responses > 0 ? Number((day.totalMinutes / day.responses).toFixed(1)) : 0,
    }));
  }, [messages, period]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>();
    const interests = leads
      .map((lead) => lead.interesse?.trim())
      .filter((value): value is string => !!value);

    interests.forEach((interest) => {
      const matcher = new RegExp(interest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const total = messages.reduce((sum, message) => sum + ((message.content.match(matcher) || []).length), 0);
      if (total > 0) counts.set(interest, total);
    });

    return Array.from(counts.entries())
      .map(([produto, total]) => ({ produto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [leads, messages]);

  const sellerConversion = useMemo(() => {
    return [
      {
        vendedor: "Não atribuído",
        leadsAtribuidos: leads.length,
        fechados: leads.filter((lead) => lead.etapa_pipeline === "fechado_ganho").length,
        taxa: leads.length > 0 ? Number(((leads.filter((lead) => lead.etapa_pipeline === "fechado_ganho").length / leads.length) * 100).toFixed(1)) : 0,
        observacao: "A base atual não possui vendedor atribuído por lead; métricas exibidas como consolidado da loja.",
      },
    ];
  }, [leads]);

  const summary = useMemo(() => {
    const fechados = leads.filter((lead) => lead.etapa_pipeline === "fechado_ganho").length;
    const perdidos = leads.filter((lead) => lead.etapa_pipeline === "fechado_perdido").length;
    const avgResponse = responseTimeline.filter((item) => item.mediaMinutos > 0);

    return {
      totalLeads: leads.length,
      fechados,
      perdidos,
      mediaResposta: avgResponse.length > 0 ? (avgResponse.reduce((sum, item) => sum + item.mediaMinutos, 0) / avgResponse.length).toFixed(1) : "0",
    };
  }, [leads, responseTimeline]);

  const isLoading = leadsLoading || messagesLoading;

  if (!activeLojaId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Selecione uma loja.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">{loja?.nome_loja || "Loja ativa"} · período {selectedLabel}</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(value: (typeof PERIOD_OPTIONS)[number]["value"]) => setPeriod(value)}>
            <SelectTrigger className="w-[140px] border-0 bg-transparent px-0 shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><BarChart3 className="h-4 w-4 text-primary" /> Leads no período</div>
            <p className="mt-2 text-3xl font-bold">{summary.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" /> Fechados</div>
            <p className="mt-2 text-3xl font-bold">{summary.fechados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><PieChartIcon className="h-4 w-4 text-primary" /> Perdidos</div>
            <p className="mt-2 text-3xl font-bold">{summary.perdidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 text-primary" /> Média 1ª resposta</div>
            <p className="mt-2 text-3xl font-bold">{summary.mediaResposta} min</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Funil de conversão</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionFunnel} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} className="text-xs" />
                  <YAxis type="category" dataKey="etapa" width={110} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Origem dos leads</CardTitle></CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={92} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sourceData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Sem leads com origem no período.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Tempo médio até a primeira resposta do bot</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={responseTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" minTickGap={18} />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value: number) => `${value} min`} />
                <Line type="monotone" dataKey="mediaMinutos" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Produtos mais consultados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((item, index) => (
              <div key={`${item.produto}-${index}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.produto}</p>
                  <p className="text-xs text-muted-foreground">Menções no histórico</p>
                </div>
                <Badge variant="secondary">{item.total}</Badge>
              </div>
            )) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Sem produtos recorrentes detectados nas conversas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Table2 className="h-4 w-4 text-primary" /> Taxa de conversão por vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Leads atribuídos</TableHead>
                <TableHead>Fechados</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellerConversion.map((row) => (
                <TableRow key={row.vendedor}>
                  <TableCell className="font-medium">{row.vendedor}</TableCell>
                  <TableCell>{row.leadsAtribuidos}</TableCell>
                  <TableCell>{row.fechados}</TableCell>
                  <TableCell>{row.taxa}%</TableCell>
                  <TableCell className="text-muted-foreground">{row.observacao}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Assistente considerado no cálculo de resposta: <span className="font-medium text-foreground">{loja?.nome_assistente_ia || "Assistente"}</span>. O gráfico usa a primeira mensagem do cliente seguida da primeira resposta com <code>role = assistant</code> em cada lead no período.
        </CardContent>
      </Card>
    </div>
  );
}