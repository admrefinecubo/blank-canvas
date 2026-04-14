import { useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";

export default function AdminLojaLogs() {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-loja-logs", id, search],
    queryFn: async () => {
      let q = supabase
        .from("logs_execucao")
        .select("*")
        .eq("loja_id", id!)
        .order("created_at", { ascending: false })
        .limit(200);

      if (search.trim()) {
        q = q.ilike("evento", `%${search.trim()}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const fmtDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yy HH:mm:ss", { locale: ptBR }) : "—";

  return (
    <AdminLojaSectionLayout lojaId={id!} currentPath={`/admin/lojas/${id}/logs`} title="Logs de Execução" description="Eventos do agente de IA para esta loja">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Logs</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar por evento..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">{isLoading ? "Carregando..." : "Nenhum log encontrado"}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{fmtDate(log.created_at)}</TableCell>
                      <TableCell><Badge variant="outline">{log.evento || "—"}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{log.lead_id ? log.lead_id.slice(0, 8) : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                        {log.detalhes ? JSON.stringify(log.detalhes).slice(0, 120) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </AdminLojaSectionLayout>
  );
}
