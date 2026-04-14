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
import {
  checklistBlocks,
  workflows,
  getRoadmapStats,
  type ItemStatus,
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
} from "lucide-react";

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

export default function Roadmap() {
  const [filter, setFilter] = useState<FilterType>("all");
  const stats = useMemo(() => getRoadmapStats(), []);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
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

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{stats.done}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">Em progresso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
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
            <p className="text-xs text-muted-foreground mt-1.5">
              {stats.done} de {stats.total} concluídas · falta {100 - progressPercent}% para conclusão total
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
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

        {/* Checklist Blocks */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Checklist por Bloco</h2>
          </div>
          <Accordion type="multiple" className="space-y-2">
            {filteredBlocks.map((block) => {
              const blockDone = block.items.filter((i) => i.status === "done").length;
              const blockTotal = block.items.length;
              const originalBlock = checklistBlocks.find((b) => b.name === block.name);
              const originalTotal = originalBlock?.items.length ?? blockTotal;
              const originalDone = originalBlock?.items.filter((i) => i.status === "done").length ?? blockDone;

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
                        <li
                          key={item.number}
                          className="flex items-start gap-2.5 text-sm py-1"
                        >
                          {statusIcon(item.status)}
                          <span
                            className={
                              item.status === "done"
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }
                          >
                            <span className="text-muted-foreground mr-1.5 text-xs font-mono">
                              #{item.number}
                            </span>
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
        </section>

        {/* Workflows N8N */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Workflow className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Workflows N8N</h2>
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
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border/40">
          LojaADS · CRM para Lojas de Móveis e Colchões · Versão 1.0
        </footer>

        {/* Arthos watermark — fixed above Lovable badge */}
        <div className="fixed bottom-1 right-1" style={{ zIndex: 2147483647 }}>
          <img src={arthosBadge} alt="Made by Arthos" className="h-[48px] drop-shadow-md rounded-xl" />
        </div>
      </main>
    </div>
  );
}
