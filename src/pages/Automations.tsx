import { useState } from "react";
import { Zap, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const TRIGGER_LABELS: Record<string, string> = {
  post_delivery: "Pós-entrega",
  nps_request: "Pesquisa Satisfação",
  reactivation: "Reativação",
  birthday: "Aniversário",
  follow_up_visit: "Follow-up pós-visita",
  budget_reminder: "Lembrete de orçamento",
  no_show: "Visita não realizada",
  repurchase: "Sugestão de recompra",
};

export default function Automations() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "whatsapp", trigger_event: "", delay_days: "0", message_template: "" });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["automations", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("automations").select("*").order("created_at", { ascending: false });
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma loja");
      const { error } = await supabase.from("automations").insert({
        clinic_id: effectiveClinicId,
        name: form.name,
        type: form.type,
        trigger_event: form.trigger_event,
        delay_days: parseInt(form.delay_days) || 0,
        message_template: form.message_template || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      setShowForm(false);
      setForm({ name: "", type: "whatsapp", trigger_event: "", delay_days: "0", message_template: "" });
      toast({ title: "Automação criada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automations").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automations"] }); toast({ title: "Automação removida" }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automações e Cadências</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure sequências automáticas de comunicação</p>
        </div>
        <div className="flex gap-2">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nova Automação</Button>
        </div>
      </div>

      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="mx-auto h-12 w-12 text-muted-foreground/30" />
             <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma automação configurada</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Nova Automação" para criar uma cadência.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map(a => (
            <Card key={a.id} className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch checked={a.active ?? true} onCheckedChange={active => toggleMutation.mutate({ id: a.id, active })} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.name}</p>
                      <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TRIGGER_LABELS[a.trigger_event] || a.trigger_event} · {a.delay_days || 0} dias de espera
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {isPlatformAdmin && !clinicId && (
               <div><Label>Loja *</Label>
                <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
                  <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Follow-up pós-visita" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Gatilho *</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Dias de Espera</Label><Input type="number" min="0" value={form.delay_days} onChange={e => setForm(f => ({ ...f, delay_days: e.target.value }))} /></div>
            <div><Label>Template da Mensagem</Label><Textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Use {{nome}}, {{loja}}..." rows={3} /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.name || !form.trigger_event || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Criar Automação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
