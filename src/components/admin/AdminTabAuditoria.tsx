import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-green-500/10 text-green-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-destructive/10 text-destructive",
};

const TABLE_LABELS: Record<string, string> = {
  patients: "Clientes",
  appointments: "Visitas",
  budgets: "Orçamentos",
  financial_installments: "Financeiro",
};

export default function AdminTabAuditoria({ clinicId }: { clinicId: string }) {
  const [filterTable, setFilterTable] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", clinicId, filterTable],
    queryFn: async () => {
      if (!clinicId) return [];
      let q = supabase.from("audit_logs").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(100);
      if (filterTable !== "all") q = q.eq("table_name", filterTable);
      const { data } = await q;
      return data || [];
    },
    enabled: !!clinicId,
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Logs de Auditoria</CardTitle></div>
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas tabelas</SelectItem>
              {Object.entries(TABLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Nenhum log registrado ainda.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">As ações no sistema serão registradas automaticamente.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <Badge variant="outline" className={ACTION_COLORS[log.action]}>{log.action}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                    <span className="text-xs text-muted-foreground">por {log.user_email || "sistema"}</span>
                  </div>
                  {log.action === "UPDATE" && log.old_data && log.new_data && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {Object.keys(log.new_data).filter(k => JSON.stringify(log.old_data[k]) !== JSON.stringify(log.new_data[k]) && k !== "updated_at").slice(0, 3).map(k => `${k}: ${log.old_data[k]} → ${log.new_data[k]}`).join(", ")}
                    </p>
                  )}
                  {log.action === "INSERT" && log.new_data?.name && (
                    <p className="text-xs text-muted-foreground mt-1">Nome: {log.new_data.name}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
