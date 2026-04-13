import { useState } from "react";
import { Loader2, Megaphone, Plus, Send } from "lucide-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/whatsapp-admin";

const SEGMENT_OPTIONS = [
  { value: "interesse", label: "Por interesse" },
  { value: "etapa_pipeline", label: "Por etapa do funil" },
  { value: "origem", label: "Por origem" },
  { value: "todos", label: "Todos os leads" },
];

const EMPTY_FORM = {
  name: "",
  segment_type: "todos",
  discount_percent: "",
  message_template: "",
  segment_value: "",
};

export default function LojaCampanhas() {
  const { activeLojaId } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDispatch, setConfirmDispatch] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["loja-campanhas", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotional_campaigns")
        .select("*")
        .eq("loja_id", activeLojaId!)
        .order("launched_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome da campanha");
      if (!form.message_template.trim()) throw new Error("Informe o template de mensagem");

      const segmentConfig: Record<string, string> = {};
      if (form.segment_type !== "todos" && form.segment_value) {
        segmentConfig[form.segment_type] = form.segment_value;
      }

      let query = supabase.from("leads").select("id", { count: "exact", head: true }).eq("loja_id", activeLojaId!);
      if (form.segment_type === "interesse" && form.segment_value) {
        query = query.ilike("interesse", `%${form.segment_value}%`);
      } else if (form.segment_type === "etapa_pipeline" && form.segment_value) {
        query = query.eq("etapa_pipeline", form.segment_value);
      } else if (form.segment_type === "origem" && form.segment_value) {
        query = query.eq("origem", form.segment_value);
      }
      const { count } = await query;

      const { error } = await supabase.from("promotional_campaigns").insert({
        loja_id: activeLojaId!,
        name: form.name.trim(),
        segment_type: form.segment_type,
        segment_config: segmentConfig,
        discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
        message_template: form.message_template.trim(),
        targeted_leads_count: count ?? 0,
        status: "rascunho",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-campanhas", activeLojaId] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success("Campanha criada");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const dispatchMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const campaign = campaigns?.find((c) => c.id === campaignId);
      if (!campaign) throw new Error("Campanha não encontrada");

      const webhookUrl = import.meta.env.VITE_WF13_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("Webhook WF-13 não configurado");

      const segmentConfig = campaign.segment_config as Record<string, string> | null;
      const segmentValue = segmentConfig
        ? Object.values(segmentConfig)[0] ?? null
        : null;

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loja_id: activeLojaId,
          campanha_id: campaign.id,
          segmento: segmentValue,
          orcamento_faixa: null,
          mensagem: campaign.message_template,
          desconto: campaign.discount_percent ?? 0,
        }),
      });

      if (!res.ok) throw new Error(`Erro no webhook: ${res.status}`);

      const { error } = await supabase
        .from("promotional_campaigns")
        .update({ status: "disparada", launched_at: new Date().toISOString() })
        .eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-campanhas", activeLojaId] });
      setConfirmDispatch(null);
      toast.success("Campanha disparada com sucesso!");
    },
    onError: (e: Error) => {
      setConfirmDispatch(null);
      toast.error("Erro ao disparar campanha", { description: e.message });
    },
  });

  if (!activeLojaId) {
    return <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">Nenhuma loja operacional vinculada a esta conta.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campanhas Promocionais</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie e gerencie disparos de promoções segmentadas.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nova campanha
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !(campaigns ?? []).length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Megaphone className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Leads atingidos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Lançada em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(campaigns ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{SEGMENT_OPTIONS.find(s => s.value === c.segment_type)?.label || c.segment_type}</Badge>
                    </TableCell>
                    <TableCell>{c.discount_percent ? `${c.discount_percent}%` : "—"}</TableCell>
                    <TableCell>{c.targeted_leads_count}</TableCell>
                    <TableCell><Badge variant={c.status === "disparada" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(c.launched_at)}</TableCell>
                    <TableCell>
                      {c.status !== "disparada" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={dispatchMutation.isPending}
                          onClick={() => setConfirmDispatch(c.id)}
                        >
                          {dispatchMutation.isPending && confirmDispatch === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Disparar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da campanha</Label>
              <Input placeholder="Ex: Promoção Dia das Mães" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Segmentação</Label>
              <Select value={form.segment_type} onValueChange={(v) => setForm(f => ({ ...f, segment_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.segment_type !== "todos" && (
              <div>
                <Label>Valor do filtro</Label>
                <Input placeholder={form.segment_type === "interesse" ? "Ex: colchão" : form.segment_type === "etapa_pipeline" ? "Ex: qualificado" : "Ex: whatsapp"} value={form.segment_value} onChange={(e) => setForm(f => ({ ...f, segment_value: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Desconto (%)</Label>
              <Input type="number" placeholder="Ex: 10" value={form.discount_percent} onChange={(e) => setForm(f => ({ ...f, discount_percent: e.target.value }))} />
            </div>
            <div>
              <Label>Template de mensagem</Label>
              <Textarea rows={4} placeholder="Olá {{nome}}! Temos uma promoção especial de {{desconto}}% em {{interesse}}..." value={form.message_template} onChange={(e) => setForm(f => ({ ...f, message_template: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dispatch dialog */}
      <AlertDialog open={!!confirmDispatch} onOpenChange={(open) => !open && setConfirmDispatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disparar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso enviará mensagem para todos os leads do segmento selecionado. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dispatchMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={dispatchMutation.isPending}
              onClick={() => confirmDispatch && dispatchMutation.mutate(confirmDispatch)}
            >
              {dispatchMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disparando...</>
              ) : (
                "Confirmar disparo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
