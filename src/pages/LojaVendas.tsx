import { useMemo, useState } from "react";
import { ExternalLink, Loader2, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  link_gerado: { label: "Link gerado", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  pendente: { label: "Pendente", variant: "outline" },
};

export default function LojaVendas() {
  const { activeLojaId } = useAuth();
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: vendas, isLoading } = useQuery({
    queryKey: ["loja-vendas", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("id, lead_id, produto_id, valor_total, status, checkout_url, descricao, created_at")
        .eq("loja_id", activeLojaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: leads } = useQuery({
    queryKey: ["loja-vendas-leads", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome, telefone").eq("loja_id", activeLojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: produtos } = useQuery({
    queryKey: ["loja-vendas-produtos", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id, nome").eq("loja_id", activeLojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const leadMap = useMemo(() => new Map((leads ?? []).map((l) => [l.id, l])), [leads]);
  const produtoMap = useMemo(() => new Map((produtos ?? []).map((p) => [p.id, p])), [produtos]);

  const filtered = useMemo(() => {
    return (vendas ?? []).filter((v) => statusFilter === "todos" || v.status === statusFilter);
  }, [vendas, statusFilter]);

  const statuses = useMemo(() => Array.from(new Set((vendas ?? []).map((v) => v.status).filter(Boolean))), [vendas]);

  if (!activeLojaId) {
    return <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">Nenhuma loja operacional vinculada a esta conta.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe os checkouts gerados e status dos pedidos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s!}>{STATUS_LABELS[s!]?.label || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} venda(s)</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma venda encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Checkout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => {
                  const lead = v.lead_id ? leadMap.get(v.lead_id) : undefined;
                  const produto = v.produto_id ? produtoMap.get(v.produto_id) : undefined;
                  const statusInfo = STATUS_LABELS[v.status ?? ""] ?? { label: v.status ?? "—", variant: "outline" as const };

                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{lead ? getLeadName(lead.nome, lead.telefone) : "—"}</TableCell>
                      <TableCell>{produto?.nome || "—"}</TableCell>
                      <TableCell>{v.valor_total != null ? `R$ ${Number(v.valor_total).toFixed(2)}` : "—"}</TableCell>
                      <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">{v.descricao || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDateTime(v.created_at)}</TableCell>
                      <TableCell>
                        {v.checkout_url ? (
                          <a href={v.checkout_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" /> Abrir
                          </a>
                        ) : "—"}
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
