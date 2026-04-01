import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  enviado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  aprovado: "bg-green-500/10 text-green-500 border-green-500/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
  perdido: "bg-muted text-muted-foreground border-muted",
};

export default function Budgets() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", procedure_id: "", total: "", discount: "0", payment_method: "", installments: "1", notes: "" });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-select", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("patients").select("id, name");
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures-select", effectiveClinicId],
    queryFn: async () => {
      let q = (supabase.from("procedures").select("id, name, price") as any).eq("active", true);
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("budgets").select("*, patients(name)").order("created_at", { ascending: false });
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const handleProcedureChange = (procedureId: string) => {
    const proc = procedures.find((p: any) => p.id === procedureId);
    setForm(f => ({
      ...f,
      procedure_id: procedureId,
      total: proc ? String(proc.price) : f.total,
    }));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma clínica");
      const { error } = await supabase.from("budgets").insert({
        clinic_id: effectiveClinicId,
        patient_id: form.patient_id,
        total: parseFloat(form.total) || 0,
        discount: parseFloat(form.discount) || 0,
        payment_method: form.payment_method || null,
        installments: parseInt(form.installments) || 1,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setShowForm(false);
      setForm({ patient_id: "", procedure_id: "", total: "", discount: "0", payment_method: "", installments: "1", notes: "" });
      toast({ title: "Orçamento criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = budgets.filter((b: any) =>
    (b.patients?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <div className="flex gap-2">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Novo Orçamento</Button>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum orçamento criado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Novo Orçamento" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Valor</th>
                <th className="p-3 font-medium hidden sm:table-cell">Desconto</th>
                <th className="p-3 font-medium hidden md:table-cell">Pagamento</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium hidden sm:table-cell">Data</th>
              </tr></thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="p-3 font-medium">{b.patients?.name || "—"}</td>
                    <td className="p-3 text-sm">R$ {Number(b.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-sm hidden sm:table-cell">R$ {Number(b.discount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-sm capitalize hidden md:table-cell">{b.payment_method || "—"}</td>
                    <td className="p-3"><Badge variant="outline" className={STATUS_COLORS[b.status || "pendente"]}>{STATUS_LABELS[b.status || "pendente"]}</Badge></td>
                    <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{new Date(b.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              {patients.length === 0 && <p className="text-xs text-muted-foreground mt-1">Cadastre um cliente primeiro.</p>}
            </div>
            <div><Label>Produto</Label>
              <Select value={form.procedure_id} onValueChange={handleProcedureChange}>
                <SelectTrigger><SelectValue placeholder="Selecionar produto (opcional)" /></SelectTrigger>
                <SelectContent>
                  {procedures.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {procedures.length === 0 && <p className="text-xs text-muted-foreground mt-1">Cadastre produtos primeiro.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Total (R$) *</Label><Input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} placeholder="0.00" /></div>
              <div><Label>Desconto (R$)</Label><Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Forma de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="crediario">Crediário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Parcelas</Label><Input type="number" min="1" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.patient_id || !form.total || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Criar Orçamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}