import { useMemo, useState } from "react";
import { CalendarDays, Loader2, MapPin, Plus } from "lucide-react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime, getLeadName, VISITA_STATUS_OPTIONS } from "@/lib/whatsapp-admin";

const STATUS_COLORS: Record<string, string> = {
  agendada: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  confirmada: "bg-green-500/10 text-green-600 border-green-500/20",
  realizada: "bg-primary/10 text-primary border-primary/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function LojaVisitas() {
  const { activeLojaId } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [form, setForm] = useState({ lead_id: "", data_visita: "", observacoes: "", produtos_interesse: "" });

  const { data: visitas, isLoading } = useQuery({
    queryKey: ["loja-visitas", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitas")
        .select("id, lead_id, data_visita, status, observacoes, produtos_interesse, vendedor_responsavel")
        .eq("loja_id", activeLojaId!)
        .order("data_visita", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: leads } = useQuery({
    queryKey: ["loja-visitas-leads", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome, telefone").eq("loja_id", activeLojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: lojaConfig } = useQuery({
    queryKey: ["loja-visitas-config", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("maps_link, endereco")
        .eq("id", activeLojaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const leadMap = useMemo(() => new Map((leads ?? []).map((l) => [l.id, l])), [leads]);

  const filtered = useMemo(() => {
    return (visitas ?? []).filter((v) => statusFilter === "todos" || v.status === statusFilter);
  }, [visitas, statusFilter]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("visitas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-visitas", activeLojaId] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.data_visita) throw new Error("Informe a data da visita");
      const { error } = await supabase.from("visitas").insert({
        loja_id: activeLojaId!,
        lead_id: form.lead_id || null,
        data_visita: new Date(form.data_visita).toISOString(),
        observacoes: form.observacoes || null,
        produtos_interesse: form.produtos_interesse || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-visitas", activeLojaId] });
      setShowCreate(false);
      setForm({ lead_id: "", data_visita: "", observacoes: "", produtos_interesse: "" });
      toast.success("Visita agendada");
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
          <h1 className="text-3xl font-semibold tracking-tight">Visitas à Loja</h1>
          <p className="mt-1 text-sm text-muted-foreground">Agende e acompanhe visitas presenciais dos clientes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {VISITA_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Agendar visita
          </Button>
        </div>
      </div>

      {lojaConfig?.endereco && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{lojaConfig.endereco}</span>
            {lojaConfig.maps_link && (
              <a href={lojaConfig.maps_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                Abrir no Maps
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma visita encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Produtos de interesse</TableHead>
                  <TableHead className="hidden lg:table-cell">Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => {
                  const lead = v.lead_id ? leadMap.get(v.lead_id) : undefined;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{getLeadName(lead?.nome, lead?.telefone)}</TableCell>
                      <TableCell>{formatDateTime(v.data_visita)}</TableCell>
                      <TableCell>
                        <div className="w-[160px]">
                          <Select
                            value={v.status}
                            onValueChange={(val) => statusMutation.mutate({ id: v.id, status: val })}
                          >
                            <SelectTrigger>
                              <Badge className={STATUS_COLORS[v.status] || ""} variant="outline">{VISITA_STATUS_OPTIONS.find(o => o.value === v.status)?.label || v.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {VISITA_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">{(v as any).produtos_interesse || "—"}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate lg:table-cell">{v.observacoes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar Visita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lead (opcional)</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm(f => ({ ...f, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione um lead..." /></SelectTrigger>
                <SelectContent>
                  {(leads ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{getLeadName(l.nome, l.telefone)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data e hora</Label>
              <Input type="datetime-local" value={form.data_visita} onChange={(e) => setForm(f => ({ ...f, data_visita: e.target.value }))} />
            </div>
            <div>
              <Label>Produtos de interesse</Label>
              <Input placeholder="Ex: Colchão King, Sofá retrátil" value={form.produtos_interesse} onChange={(e) => setForm(f => ({ ...f, produtos_interesse: e.target.value }))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} placeholder="Ex: Cliente quer testar colchão" value={form.observacoes} onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
