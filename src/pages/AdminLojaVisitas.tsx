import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, getLeadName, VISITA_STATUS_OPTIONS } from "@/lib/whatsapp-admin";

export default function AdminLojaVisitas() {
  const { id: lojaId } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: visitas, isLoading } = useQuery({
    queryKey: ["admin-loja-visitas", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitas")
        .select("id, lead_id, data_visita, status, observacoes")
        .eq("loja_id", lojaId!)
        .order("data_visita", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  const { data: leads } = useQuery({
    queryKey: ["admin-loja-visitas-leads", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome, telefone").eq("loja_id", lojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  const leadMap = useMemo(() => new Map((leads ?? []).map((lead) => [lead.id, lead])), [leads]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: (typeof VISITA_STATUS_OPTIONS)[number]["value"] }) => {
      const { error } = await supabase.from("visitas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loja-visitas", lojaId] });
      toast.success("Status da visita atualizado");
    },
    onError: (error: Error) => toast.error("Erro ao atualizar visita", { description: error.message }),
  });

  return (
    <AdminLojaSectionLayout
      lojaId={lojaId!}
      currentPath={location.pathname}
      title="Visitas agendadas"
      description="Acompanhe confirmações, realização e cancelamentos das visitas da loja."
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !visitas?.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma visita cadastrada para esta loja.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Data da visita</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitas.map((visita) => {
                  const lead = visita.lead_id ? leadMap.get(visita.lead_id) : undefined;
                  return (
                    <TableRow key={visita.id}>
                      <TableCell className="font-medium">{getLeadName(lead?.nome, lead?.telefone)}</TableCell>
                      <TableCell>{formatDateTime(visita.data_visita)}</TableCell>
                      <TableCell>
                        <div className="w-[180px]">
                          <Select
                            value={visita.status ?? "agendada"}
                            onValueChange={(value) => statusMutation.mutate({ id: visita.id, status: value as (typeof VISITA_STATUS_OPTIONS)[number]["value"] })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {VISITA_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate">{visita.observacoes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLojaSectionLayout>
  );
}