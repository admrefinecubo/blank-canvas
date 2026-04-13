import { useMemo, useState } from "react";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

export default function LojaFollowups() {
  const { activeLojaId } = useAuth();
  const queryClient = useQueryClient();
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ lead_id: "", tipo: "interacao_inicial", agendado_para: "", mensagem: "" });

  const { data: followups, isLoading } = useQuery({
    queryKey: ["loja-followups", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("id, lead_id, tipo, agendado_para, enviado, enviado_em, mensagem")
        .eq("loja_id", activeLojaId!)
        .order("agendado_para", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: leads } = useQuery({
    queryKey: ["loja-followups-leads", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome, telefone").eq("loja_id", activeLojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const leadMap = useMemo(() => new Map((leads ?? []).map((lead) => [lead.id, lead])), [leads]);
  const tipos = useMemo(() => Array.from(new Set((followups ?? []).map((item) => item.tipo))).sort(), [followups]);

  const filtered = useMemo(() => {
    return (followups ?? []).filter((item) => {
      const matchesTipo = tipoFiltro === "todos" || item.tipo === tipoFiltro;
      const matchesStatus = statusFiltro === "todos" || (statusFiltro === "enviado" ? !!item.enviado : !item.enviado);
      return matchesTipo && matchesStatus;
    });
  }, [followups, statusFiltro, tipoFiltro]);

  const markSentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("follow_ups").update({ enviado: true, enviado_em: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-followups", activeLojaId] });
      toast.success("Follow-up marcado como enviado");
    },
    onError: (error: Error) => toast.error("Erro ao atualizar follow-up", { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("follow_ups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-followups", activeLojaId] });
      toast.success("Follow-up excluído");
    },
    onError: (error: Error) => toast.error("Erro ao excluir follow-up", { description: error.message }),
  });

  const TIPO_OPTIONS = [
    "interacao_inicial", "carrinho_abandonado", "promocao_nao_respondida",
    "orcamento_pendente", "pos_visita", "medidas_ambiente", "pos_venda",
  ];

  const createFollowupMutation = useMutation({
    mutationFn: async () => {
      if (!createForm.agendado_para) throw new Error("Informe a data");
      const { error } = await supabase.from("follow_ups").insert({
        loja_id: activeLojaId!,
        lead_id: createForm.lead_id || null,
        tipo: createForm.tipo,
        agendado_para: new Date(createForm.agendado_para).toISOString(),
        mensagem: createForm.mensagem || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-followups", activeLojaId] });
      setShowCreate(false);
      setCreateForm({ lead_id: "", tipo: "interacao_inicial", agendado_para: "", mensagem: "" });
      toast.success("Follow-up criado");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  if (!activeLojaId) {
    return <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">Nenhuma loja operacional vinculada a esta conta.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Follow-ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie retornos automáticos e lembretes dos seus leads.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipos.map((tipo) => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Nenhum follow-up encontrado com os filtros atuais.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Agendado para</TableHead>
                  <TableHead>Enviado?</TableHead>
                  <TableHead className="hidden md:table-cell">Enviado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const lead = item.lead_id ? leadMap.get(item.lead_id) : undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{getLeadName(lead?.nome, lead?.telefone)}</TableCell>
                      <TableCell>{item.tipo}</TableCell>
                      <TableCell>{formatDateTime(item.agendado_para)}</TableCell>
                      <TableCell><Badge variant={item.enviado ? "default" : "secondary"}>{item.enviado ? "Enviado" : "Pendente"}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">{formatDateTime(item.enviado_em)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" disabled={!!item.enviado || markSentMutation.isPending} onClick={() => markSentMutation.mutate(item.id)}>
                            <Send className="h-4 w-4" /> Marcar enviado
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="h-4 w-4" /> Cancelar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}