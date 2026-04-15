import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PIPELINE_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500" },
  qualificado: { label: "Qualificado", color: "bg-indigo-500" },
  orcamento: { label: "Orçamento", color: "bg-amber-500" },
  negociacao: { label: "Negociação", color: "bg-orange-500" },
  fechado_ganho: { label: "Ganho", color: "bg-emerald-500" },
  fechado_perdido: { label: "Perdido", color: "bg-rose-500" },
};

interface PipelineBarProps {
  data: Record<string, number>;
}

export function PipelineBar({ data }: PipelineBarProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhum lead no pipeline ainda.
      </p>
    );
  }

  const stages = Object.entries(PIPELINE_CONFIG)
    .map(([key, config]) => ({
      key,
      ...config,
      count: data[key] || 0,
      pct: ((data[key] || 0) / total) * 100,
    }))
    .filter((s) => s.count > 0);

  return (
    <div className="space-y-3">
      <TooltipProvider delayDuration={100}>
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {stages.map((stage) => (
            <Tooltip key={stage.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn("h-full transition-all", stage.color)}
                  style={{ width: `${stage.pct}%` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {stage.label}: {stage.count} ({stage.pct.toFixed(0)}%)
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {stages.map((stage) => (
          <div key={stage.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn("h-2 w-2 rounded-full", stage.color)} />
            {stage.label} <span className="font-medium text-foreground">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
