import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminTabMetas({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const currentPeriod = format(new Date(), "yyyy-MM");
  const [goalForm, setGoalForm] = useState({ period: currentPeriod, target_amount: "", professional_name: "" });

  const { data: goals = [] } = useQuery({
    queryKey: ["revenue-goals", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("revenue_goals").select("*").eq("clinic_id", clinicId).order("period", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["goals-budgets", clinicId, currentPeriod],
    queryFn: async () => {
      if (!clinicId) return [];
      const start = `${currentPeriod}-01`;
      const { data } = await supabase.from("budgets").select("total, status, created_at").eq("clinic_id", clinicId).eq("status", "aprovado").gte("created_at", start);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const currentRevenue = budgets.reduce((s, b: any) => s + Number(b.total || 0), 0);
  const currentGoal = goals.find((g: any) => g.period === currentPeriod && !g.professional_name);
  const goalProgress = currentGoal ? Math.min(Math.round((currentRevenue / Number(currentGoal.target_amount)) * 100), 100) : 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      const { error } = await supabase.from("revenue_goals").upsert({
        clinic_id: clinicId,
        period: goalForm.period,
        target_amount: parseFloat(goalForm.target_amount) || 0,
        professional_name: goalForm.professional_name || null,
      }, { onConflict: "clinic_id,period,professional_name" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-goals"] });
      setGoalForm(f => ({ ...f, target_amount: "", professional_name: "" }));
      toast({ title: "Meta salva!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("revenue_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["revenue-goals"] }); toast({ title: "Meta removida" }); },
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <div className="space-y-6">
      {currentGoal && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Meta do Mês Atual — {format(new Date(), "MMMM yyyy", { locale: ptBR })}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-2xl font-bold">R$ {currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">de R$ {Number(currentGoal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-lg font-semibold">{goalProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goalProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Definir Meta de Faturamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Período</Label><Input type="month" value={goalForm.period} onChange={e => setGoalForm(f => ({ ...f, period: e.target.value }))} /></div>
            <div><Label>Meta (R$)</Label><Input type="number" value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="50000" /></div>
            <div><Label>Vendedor (opcional)</Label><Input value={goalForm.professional_name} onChange={e => setGoalForm(f => ({ ...f, professional_name: e.target.value }))} placeholder="Geral da loja" /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !goalForm.target_amount}>{saveMutation.isPending ? "Salvando..." : "Salvar Meta"}</Button>
        </CardContent>
      </Card>

      {goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Metas Cadastradas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Meta</TableHead><TableHead>Vendedor</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{goals.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell>{g.period}</TableCell>
                  <TableCell className="font-medium">R$ {Number(g.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{g.professional_name || "Geral"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
