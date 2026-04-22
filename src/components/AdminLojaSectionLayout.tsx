import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MessageSquareText, Package, Settings2, Users2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  lojaId: string;
  currentPath: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const tabs = [
  { label: "Configuração", href: (id: string) => `/admin/lojas/${id}`, icon: Settings2 },
  { label: "Produtos", href: (id: string) => `/admin/lojas/${id}/catalogo`, icon: Package },
  { label: "Leads", href: (id: string) => `/admin/lojas/${id}/leads`, icon: Users2 },
  { label: "Conversas", href: (id: string) => `/admin/lojas/${id}/conversas`, icon: MessageSquareText },
  { label: "Follow-ups", href: (id: string) => `/admin/lojas/${id}/followups`, icon: MessageSquareText },
  { label: "Visitas", href: (id: string) => `/admin/lojas/${id}/visitas`, icon: CalendarDays },
];

export default function AdminLojaSectionLayout({
  lojaId,
  currentPath,
  title,
  description,
  actions,
  children,
}: Props) {
  const { data: loja } = useQuery({
    queryKey: ["admin-loja-name", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lojas").select("nome_loja").eq("id", lojaId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/lojas" className="transition-colors hover:text-foreground">
          Lojas
        </Link>
        <span>/</span>
        <span className="transition-colors hover:text-foreground">{loja?.nome_loja || "..."}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full items-center gap-2 rounded-xl border border-border bg-card p-1">
          {tabs.map((tab) => {
            const href = tab.href(lojaId);
            const active = currentPath === href;

            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}