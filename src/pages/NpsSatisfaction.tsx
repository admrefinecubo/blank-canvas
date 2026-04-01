import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function NpsSatisfaction() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", score: "", comment: "" });
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

  const { data: responses = [] } = useQuery({
    queryKey: ["nps", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("nps_responses").select("*, patients(name)").order("created_at", { ascending: false });
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma loja");
      const { error } = await supabase.from("nps_responses").insert({
        clinic_id: effectiveClinicId,
        patient_id: form.patient_id,
        score: parseInt(form.score),
        comment: form.comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nps"] });
      setShowForm(false);
      setForm({ patient_id: "", score: "", comment: "" });
      toast({ title: "Avaliação registrada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const promoters = responses.filter(r => r.score >= 9).length;
  const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const npsScore = responses.length > 0 ? Math.round(((promoters - detractors) / responses.length) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pós-Venda / Satisfação</h1>
        <div className="flex gap-2">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nova Avaliação</Button>
        </div>
      </div>

      {responses.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">NPS Score</p><p className="text-2xl font-bold mt-1">{npsScore}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Promotores (9-10)</p><p className="text-2xl font-bold mt-1" style={{color: "hsl(var(--primary))"}}>{promoters}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Neutros (7-8)</p><p className="text-2xl font-bold mt-1 text-muted-foreground">{passives}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Detratores (0-6)</p><p className="text-2xl font-bold mt-1 text-destructive">{detractors}</p></CardContent></Card>
        </div>
      )}

      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma avaliação recebida</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Nova Avaliação" para registrar ou as avaliações serão coletadas via automações.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead><tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Nota</th>
                <th className="p-3 font-medium">Comentário</th>
                <th className="p-3 font-medium">Data</th>
              </tr></thead>
              <tbody>
                {responses.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="p-3 font-medium">{r.patients?.name || "—"}</td>
                    <td className="p-3"><span className={`font-bold ${r.score >= 9 ? "text-green-500" : r.score >= 7 ? "text-yellow-500" : "text-destructive"}`}>{r.score}</span></td>
                    <td className="p-3 text-sm text-muted-foreground">{r.comment || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Avaliação NPS</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nota (0-10) *</Label><Input type="number" min="0" max="10" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="0-10" /></div>
            <div><Label>Comentário</Label><Textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="O que o cliente comentou..." /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.patient_id || !form.score || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Registrar Avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
