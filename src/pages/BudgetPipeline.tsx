import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const STAGES = [
  { key: "pendente", label: "Pendente", color: "bg-yellow-500" },
  { key: "enviado", label: "Enviado", color: "bg-blue-500" },
  { key: "aprovado", label: "Aprovado", color: "bg-green-500" },
  { key: "rejeitado", label: "Rejeitado", color: "bg-destructive" },
  { key: "perdido", label: "Perdido", color: "bg-muted-foreground" },
];

export default function BudgetPipeline() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets-pipeline", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("budgets").select("*, patients(name)").order("updated_at", { ascending: false });
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("budgets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets-pipeline"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline de Orçamentos</h1>
        {isPlatformAdmin && !clinicId && (
          <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
            <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum orçamento no pipeline</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Crie orçamentos na aba "Orçamentos".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageBudgets = budgets.filter((b: any) => (b.status || "pendente") === stage.key);
            return (
              <div key={stage.key} className="min-w-[240px] flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">({stageBudgets.length})</span>
                </div>
                <div className="space-y-2">
                  {stageBudgets.map((b: any) => (
                    <Card key={b.id} className="bg-card">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{b.patients?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">R$ {Number(b.total || 0).toFixed(2)}</p>
                        <Select value={b.status || "pendente"} onValueChange={v => moveMutation.mutate({ id: b.id, status: v })}>
                          <SelectTrigger className="h-7 mt-2 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
