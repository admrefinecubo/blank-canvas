import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Package, Calendar, Eye, ShoppingCart, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getEtapaLabel } from "@/lib/whatsapp-admin";

type LeadProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  lojaId: string;
};

export default function LeadProfileDrawer({ open, onOpenChange, leadId, lojaId }: LeadProfileDrawerProps) {
  const { data: lead } = useQuery({
    queryKey: ["lead-profile", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && open,
  });

  const { data: midias = [] } = useQuery({
    queryKey: ["lead-midias", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("midias_enviadas")
        .select("*, produtos(nome)")
        .eq("lead_id", leadId!)
        .order("enviado_em", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!leadId && open,
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["lead-followups", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("lead_id", leadId!)
        .order("agendado_para", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!leadId && open,
  });

  const { data: visitas = [] } = useQuery({
    queryKey: ["lead-visitas", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("visitas")
        .select("*")
        .eq("lead_id", leadId!)
        .order("data_visita", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!leadId && open,
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["lead-vendas", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendas")
        .select("*, produtos(nome)")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!leadId && open,
  });

  const fmtDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yy HH:mm", { locale: ptBR }) : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-base">Perfil do Lead</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-60px)]">
          {lead && (
            <div className="p-4 space-y-5">
              {/* Lead info */}
              <div className="space-y-2">
                <p className="font-semibold text-lg">{lead.nome || lead.telefone}</p>
                <p className="text-sm text-muted-foreground">{lead.telefone}</p>
                {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Badge>{getEtapaLabel(lead.etapa_pipeline)}</Badge>
                  {lead.interesse && <Badge variant="outline">{lead.interesse}</Badge>}
                  {lead.origem && <Badge variant="secondary">{lead.origem}</Badge>}
                </div>
                {lead.orcamento_faixa && (
                  <p className="text-sm">Orçamento: <span className="font-medium">{lead.orcamento_faixa}</span></p>
                )}
                {lead.pos_venda_status && lead.pos_venda_status !== "aguardando" && (
                  <p className="text-sm">Pós-venda: <Badge variant="outline">{lead.pos_venda_status}</Badge></p>
                )}
              </div>

              <Separator />

              {/* Produtos vistos */}
              <Section icon={Eye} title="Produtos Vistos" count={midias.length}>
                {midias.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm py-1">
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{m.produtos?.nome || m.legenda || "Mídia"}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">{fmtDate(m.enviado_em)}</span>
                  </div>
                ))}
              </Section>

              <Separator />

              {/* Vendas */}
              <Section icon={ShoppingCart} title="Vendas" count={vendas.length}>
                {vendas.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="truncate">{v.produtos?.nome || v.descricao || "Venda"}</span>
                    <Badge variant={v.status === "pago" ? "default" : "secondary"} className="ml-auto shrink-0">{v.status}</Badge>
                    {v.valor_total && <span className="text-xs font-medium shrink-0">R$ {Number(v.valor_total).toFixed(2)}</span>}
                  </div>
                ))}
              </Section>

              <Separator />

              {/* Follow-ups */}
              <Section icon={MessageSquare} title="Follow-ups" count={followups.length}>
                {followups.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="truncate">{f.tipo}</span>
                    <Badge variant={f.enviado ? "default" : "outline"} className="ml-auto shrink-0">
                      {f.enviado ? "Enviado" : "Pendente"}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtDate(f.agendado_para)}</span>
                  </div>
                ))}
              </Section>

              <Separator />

              {/* Visitas */}
              <Section icon={Calendar} title="Visitas" count={visitas.length}>
                {visitas.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="truncate">{v.produtos_interesse || "Visita"}</span>
                    <Badge variant="outline" className="ml-auto shrink-0">{v.status}</Badge>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtDate(v.data_visita)}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, count, children }: { icon: any; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">Nenhum registro</p>
      ) : (
        <div className="pl-6">{children}</div>
      )}
    </div>
  );
}
