import { useState, useMemo } from "react";
import arthosBadge from "@/assets/arthos-badge.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  checklistBlocks,
  workflows,
  changelog,
  getRoadmapStats,
  getBlockStats,
  type ItemStatus,
  type ChangelogEntry,
} from "@/data/roadmap-data";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Workflow,
  ListChecks,
  TrendingUp,
  Zap,
  BarChart3,
  History,
  Rocket,
  Wrench,
  GitCommit,
  Server,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type FilterType = "all" | "done" | "in_progress" | "pending" | "high";

const statusIcon = (status: ItemStatus) => {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />;
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />;
  }
};

const priorityBadge = (priority: string) => {
  switch (priority) {
    case "Alta":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Alta</Badge>;
    case "Média":
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Média</Badge>;
    case "Baixa":
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Baixa</Badge>;
    default:
      return null;
  }
};

const changeTypeIcon = (type: ChangelogEntry["type"]) => {
  switch (type) {
    case "feature":
      return <Rocket className="h-4 w-4 text-primary" />;
    case "fix":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "progress":
      return <GitCommit className="h-4 w-4 text-emerald-500" />;
    case "infra":
      return <Server className="h-4 w-4 text-muted-foreground" />;
  }
};

const changeTypeBadge = (type: ChangelogEntry["type"]) => {
  const map = {
    feature: { label: "Feature", variant: "default" as const },
    fix: { label: "Fix", variant: "secondary" as const },
    progress: { label: "Progresso", variant: "outline" as const },
    infra: { label: "Infra", variant: "secondary" as const },
  };
  const t = map[type];
  return <Badge variant={t.variant} className="text-[10px] px-1.5 py-0">{t.label}</Badge>;
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#94a3b8"];

export default function Roadmap() {
  const [filter, setFilter] = useState<FilterType>("all");
  const stats = useMemo(() => getRoadmapStats(), []);
  const blockStats = useMemo(() => getBlockStats(), []);

  const pieData = useMemo(() => [
    { name: "Concluídos", value: stats.done },
    { name: "Em progresso", value: stats.inProgress },
    { name: "Pendentes", value: stats.pending },
  ], [stats]);

  const filteredBlocks = useMemo(() => {
    return checklistBlocks
      .map((block) => ({
        ...block,
        items: block.items.filter((item) => {
          if (filter === "all") return true;
          if (filter === "high") return item.priority === "Alta";
          return item.status === filter;
        }),
      }))
      .filter((block) => block.items.length > 0);
  }, [filter]);

  const progressPercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: stats.total },
    { key: "done", label: "Feitos", count: stats.done },
    { key: "in_progress", label: "Em progresso", count: stats.inProgress },
    { key: "pending", label: "Pendentes", count: stats.pending },
    { key: "high", label: "Alta prioridade", count: stats.highPriority },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              LojaADS — Roadmap do Projeto
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Agente de IA para WhatsApp · Loja de Móveis e Colchões
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total de Tarefas</p>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Concluídos</p>
              <p className="text-3xl font-bold text-emerald-500">{stats.done}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">{progressPercent}% do total</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Em Progresso</p>
              <p className="text-3xl font-bold text-amber-500">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
              <p className="text-3xl font-bold text-muted-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">falta {100 - progressPercent}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso geral</span>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart — progress by block */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Progresso por Bloco
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={blockStats} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { done: "Feitos", inProgress: "Em progresso", pending: "Pendentes" };
                      return [value, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="done" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="done" />
                  <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="inProgress" />
                  <Bar dataKey="pending" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} name="pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart — overall */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${value}`}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Changelog | Checklist | Workflows */}
        <Tabs defaultValue="changelog" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="changelog" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Últimas Mudanças
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-1.5">
              <Workflow className="h-3.5 w-3.5" />
              Workflows
            </TabsTrigger>
          </TabsList>

          {/* Changelog tab */}
          <TabsContent value="changelog" className="mt-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-1">
                {changelog.map((entry, idx) => (
                  <div key={idx} className="relative pl-12 py-3">
                    {/* Dot */}
                    <div className="absolute left-3 top-4 h-[14px] w-[14px] rounded-full border-2 border-background bg-primary/80 ring-2 ring-background flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-background" />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {changeTypeIcon(entry.type)}
                          <span className="text-sm font-medium text-foreground">{entry.title}</span>
                          {changeTypeBadge(entry.type)}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">{formatDate(entry.date)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(entry.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Checklist tab */}
          <TabsContent value="checklist" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className="text-xs h-7"
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>

            <Accordion type="multiple" className="space-y-2">
              {filteredBlocks.map((block) => {
                const originalBlock = checklistBlocks.find((b) => b.name === block.name);
                const originalTotal = originalBlock?.items.length ?? block.items.length;
                const originalDone = originalBlock?.items.filter((i) => i.status === "done").length ?? 0;

                return (
                  <AccordionItem key={block.name} value={block.name} className="border rounded-lg px-1">
                    <AccordionTrigger className="hover:no-underline px-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {block.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {originalDone}/{originalTotal}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <ul className="space-y-2">
                        {block.items.map((item) => (
                          <li key={item.number} className="flex items-start gap-2.5 text-sm py-1">
                            {statusIcon(item.status)}
                            <span className={item.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}>
                              <span className="text-muted-foreground mr-1.5 text-xs font-mono">#{item.number}</span>
                              {item.functionality}
                            </span>
                            <span className="ml-auto shrink-0">{priorityBadge(item.priority)}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* Workflows tab */}
          <TabsContent value="workflows" className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">{workflows.length} workflows</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflows.map((wf) => (
                <Card key={wf.id}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-mono text-xs text-muted-foreground">{wf.id}</span>
                      <span className="truncate">{wf.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-1">
                      {wf.nodes.map((node) => (
                        <Badge key={node} variant="outline" className="text-[10px] font-normal">
                          {node}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border/40">
          LojaADS · CRM para Lojas de Móveis e Colchões · Versão 1.0
        </footer>

        {/* Arthos watermark */}
        <div className="fixed bottom-1 right-1" style={{ zIndex: 2147483647 }}>
          <img src={arthosBadge} alt="Made by Arthos" className="h-[48px] drop-shadow-md rounded-xl" />
        </div>
      </main>
    </div>
  );
}
