import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, Plus, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POS_VENDA_TIPOS = [
  { value: "pos_venda_entrega", label: "Pós-Entrega" },
  { value: "pos_venda_colchao", label: "Pós-Colchão (7 dias)" },
  { value: "pos_venda_movel", label: "Pós-Móvel (montagem)" },
  { value: "pos_venda_avaliacao", label: "Avaliação / NPS" },
];

export default function LojaPosVenda() {
  const { activeLojaId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lead_id: "", tipo: "pos_venda_entrega", mensagem: "", dias: "3" });

  // Leads with completed sales
  const { data: leadsComVenda = [] } = useQuery({
    queryKey: ["pos-venda-leads", activeLojaId],
    queryFn: async () => {
      const { data: vendas } = await supabase
        .from("vendas")
        .select("lead_id")
        .eq("loja_id", activeLojaId!)
        .eq("status", "pago");
      
      const leadIds = [...new Set((vendas || []).map(v => v.lead_id).filter(Boolean))] as string[];
      if (!leadIds.length) return [];

      const { data: leads } = await supabase
        .from("leads")
        .select("id, nome, telefone, pos_venda_status")
        .in("id", leadIds);
      
      return leads || [];
    },
    enabled: !!activeLojaId,
  });

  const { data: postSaleContacts = [] } = useQuery({
    queryKey: ["post-sale-contacts", activeLojaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("post_sale_contacts")
        .select("*, leads(nome, telefone)")
        .eq("loja_id", activeLojaId!)
        .order("sent_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!activeLojaId,
  });

  const { data: followupsPosVenda = [] } = useQuery({
    queryKey: ["followups-pos-venda", activeLojaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follow_ups")
        .select("*, leads(nome, telefone)")
        .eq("loja_id", activeLojaId!)
        .like("tipo", "pos_venda_%")
        .order("agendado_para", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!activeLojaId,
  });

  const createFollowup = useMutation({
    mutationFn: async () => {
      if (!activeLojaId || !form.lead_id) throw new Error("Dados incompletos");
      const agendado = new Date();
      agendado.setDate(agendado.getDate() + parseInt(form.dias || "3"));

      const { error } = await supabase.from("follow_ups").insert({
        loja_id: activeLojaId,
        lead_id: form.lead_id,
        tipo: form.tipo,
        mensagem: form.mensagem || null,
        agendado_para: agendado.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-pos-venda"] });
      setShowForm(false);
      setForm({ lead_id: "", tipo: "pos_venda_entrega", mensagem: "", dias: "3" });
      toast.success("Follow-up pós-venda agendado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fmtDate = (d: string) => format(new Date(d), "dd/MM/yy HH:mm", { locale: ptBR });

  if (!activeLojaId) {
    return <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">Nenhuma loja ativa</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pós-Venda</h1>
          <p className="text-sm text-muted-foreground">Acompanhe e agende contatos pós-venda</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Agendar Follow-up
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Clientes com venda</p><p className="text-2xl font-bold mt-1">{leadsComVenda.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Contatos realizados</p><p className="text-2xl font-bold mt-1">{postSaleContacts.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Follow-ups pós-venda</p><p className="text-2xl font-bold mt-1">{followupsPosVenda.length}</p></CardContent></Card>
      </div>

      {/* Follow-ups pós-venda */}
      <Card>
        <CardHeader><CardTitle className="text-base">Follow-ups Pós-Venda</CardTitle></CardHeader>
        <CardContent className="p-0">
          {followupsPosVenda.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum follow-up pós-venda agendado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Agendado para</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followupsPosVenda.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.leads?.nome || f.leads?.telefone || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{POS_VENDA_TIPOS.find(t => t.value === f.tipo)?.label || f.tipo}</Badge></TableCell>
                    <TableCell className="text-sm">{fmtDate(f.agendado_para)}</TableCell>
                    <TableCell><Badge variant={f.enviado ? "default" : "secondary"}>{f.enviado ? "Enviado" : "Pendente"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{f.mensagem || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar Follow-up Pós-Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={form.lead_id} onValueChange={v => setForm(f => ({ ...f, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {leadsComVenda.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.nome || l.telefone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POS_VENDA_TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dias para agendar</Label>
              <Input type="number" min="1" max="90" value={form.dias} onChange={e => setForm(f => ({ ...f, dias: e.target.value }))} />
            </div>
            <div>
              <Label>Mensagem (opcional)</Label>
              <Textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} placeholder="Mensagem personalizada..." />
            </div>
            <Button className="w-full" onClick={() => createFollowup.mutate()} disabled={!form.lead_id || createFollowup.isPending}>
              {createFollowup.isPending ? "Agendando..." : "Agendar Follow-up"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
