import { useState } from "react";
import { Plus, Search, Package, Pencil, Trash2 } from "lucide-react";
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

export default function Procedures() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", duration_minutes: "60", description: "" });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("procedures").select("*").order("name");
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma loja");
      const { error } = await supabase.from("procedures").insert({
        clinic_id: effectiveClinicId,
        name: form.name,
        category: form.category || null,
        price: parseFloat(form.price) || 0,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        description: form.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      setShowForm(false);
      setForm({ name: "", category: "", price: "", duration_minutes: "60", description: "" });
      toast({ title: "Produto cadastrado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("procedures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["procedures"] }); toast({ title: "Produto removido" }); },
  });

  const filtered = procedures.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo de Produtos</h1>
        <div className="flex gap-2">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Novo Produto</Button>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Novo Produto" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <Card key={p.id} className="bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.category && <Badge variant="outline" className="mt-1 text-xs">{p.category}</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>R$ {Number(p.price).toFixed(2)}</span>
                  <span>{p.duration_minutes} min</span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {isPlatformAdmin && !clinicId && (
              <div><Label>Loja *</Label>
                <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
                  <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Colchão Queen, Sofá 3 lugares..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Colchões, Salas, Quartos Planejados" /></div>
              <div><Label>Preço (R$) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
            </div>
            <div><Label>Duração (minutos)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto..." /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.name || !form.price || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Cadastrar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
