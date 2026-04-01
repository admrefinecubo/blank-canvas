import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Receipt, CheckCircle, Clock, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isPast, isToday } from "date-fns";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
};

export default function Financial() {
  const { clinicId } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ["financial-installments", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("financial_installments")
        .select("*, patients(name), budgets(total, discount, status)")
        .eq("clinic_id", clinicId)
        .order("due_date", { ascending: true });
      return (data || []).map((inst: any) => ({
        ...inst,
        // Mark overdue if pendente and past due
        status: inst.status === "pendente" && isPast(new Date(inst.due_date)) && !isToday(new Date(inst.due_date))
          ? "atrasado" : inst.status,
      }));
    },
    enabled: !!clinicId,
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_installments")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-installments"] });
      toast({ title: "Parcela marcada como paga!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = statusFilter === "all" ? installments : installments.filter((i: any) => i.status === statusFilter);

  const stats = useMemo(() => {
    const paid = installments.filter((i: any) => i.status === "pago");
    const pending = installments.filter((i: any) => i.status === "pendente");
    const overdue = installments.filter((i: any) => i.status === "atrasado");
    const monthPaid = paid.filter((i: any) => i.paid_at && i.paid_at >= monthStart);

    return {
      revenue: monthPaid.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      pending: pending.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      overdue: overdue.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      ticket: paid.length > 0 ? paid.reduce((s: number, i: any) => s + Number(i.amount || 0), 0) / paid.length : 0,
    };
  }, [installments, monthStart]);

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">Selecione uma clínica para ver o financeiro.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Recebido no Mês</p></div>
            <p className="text-2xl font-bold">R$ {stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /><p className="text-sm text-muted-foreground">A Receber</p></div>
            <p className="text-2xl font-bold">R$ {stats.pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><p className="text-sm text-muted-foreground">Em Atraso</p></div>
            <p className="text-2xl font-bold text-destructive">R$ {stats.overdue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Ticket Médio</p></div>
            <p className="text-2xl font-bold">R$ {stats.ticket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Parcelas</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-8"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="atrasado">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : !filtered.length ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma parcela encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground/70">As parcelas são geradas automaticamente quando um orçamento é aprovado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden sm:table-cell">Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inst: any) => {
                  const st = STATUS_COLORS[inst.status] || STATUS_COLORS.pendente;
                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium text-sm">{inst.patients?.name || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{inst.installment_number}/{inst.total_installments}</TableCell>
                      <TableCell className="text-sm">R$ {Number(inst.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(inst.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="hidden md:table-cell">{inst.payment_method || "—"}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        {inst.status !== "pago" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7"
                            onClick={() => markPaidMutation.mutate(inst.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
