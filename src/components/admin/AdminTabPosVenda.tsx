import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function AdminTabPosVenda({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ procedure_id: "", name: "", delay_hours: "24", message_template: "" });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures-for-post", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("procedures").select("id, name").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["post-procedure-templates", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("post_procedure_templates").select("*, procedures(name)").eq("clinic_id", clinicId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      const { error } = await supabase.from("post_procedure_templates").insert({
        clinic_id: clinicId,
        procedure_id: form.procedure_id || null,
        name: form.name,
        delay_hours: parseInt(form.delay_hours) || 24,
        message_template: form.message_template,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] });
      setForm({ procedure_id: "", name: "", delay_hours: "24", message_template: "" });
      toast({ title: "Template pós-venda salvo!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("post_procedure_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] }); toast({ title: "Template removido" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("post_procedure_templates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] }); },
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Novo Template Pós-Venda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome do fluxo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pós-entrega colchão" /></div>
            <div><Label>Produto (opcional)</Label>
              <Select value={form.procedure_id} onValueChange={v => setForm(f => ({ ...f, procedure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos procedimentos" /></SelectTrigger>
                <SelectContent>{procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Enviar após (horas)</Label><Input type="number" value={form.delay_hours} onChange={e => setForm(f => ({ ...f, delay_hours: e.target.value }))} /></div>
          <div><Label>Mensagem (use {`{{nome}}`} para o nome do cliente)</Label>
            <Textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Olá {{nome}}, como está sua experiência com o produto?" className="min-h-[100px]" />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.message_template}>{saveMutation.isPending ? "Salvando..." : "Criar Template"}</Button>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Templates Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t.name}</p>
                      {t.procedures?.name && <Badge variant="secondary" className="text-[10px]">{t.procedures.name}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{t.delay_hours}h após</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.message_template}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch checked={t.active} onCheckedChange={v => toggleMutation.mutate({ id: t.id, active: v })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
