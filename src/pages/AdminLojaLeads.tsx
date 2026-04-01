import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2, MessageSquareMore, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";
import WhatsAppChatBubble from "@/components/WhatsAppChatBubble";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAD_STAGE_LABELS, LEAD_STAGE_OPTIONS, formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

export default function AdminLojaLeads() {
  const { id: lojaId } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<{ id: string; nome: string; telefone: string } | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-loja-leads", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, telefone, etapa_pipeline, interesse, ultima_interacao, origem")
        .eq("loja_id", lojaId!)
        .order("ultima_interacao", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  const { data: mensagens, isLoading: isLoadingMensagens } = useQuery({
    queryKey: ["admin-loja-lead-mensagens", selectedLead?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_mensagens")
        .select("id, role, content, created_at")
        .eq("lead_id", selectedLead!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLead?.id,
  });

  const stageMutation = useMutation({
    mutationFn: async ({ leadId, etapa }: { leadId: string; etapa: (typeof LEAD_STAGE_OPTIONS)[number]["value"] }) => {
      const { error } = await supabase.from("leads").update({ etapa_pipeline: etapa }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loja-leads", lojaId] });
      toast.success("Etapa atualizada");
    },
    onError: (error: Error) => toast.error("Erro ao atualizar etapa", { description: error.message }),
  });

  const totalLeads = useMemo(() => leads?.length ?? 0, [leads]);

  return (
    <AdminLojaSectionLayout
      lojaId={lojaId!}
      currentPath={location.pathname}
      title="Leads WhatsApp"
      description={`${totalLeads} lead(s) sincronizado(s) para esta loja.`}
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !leads?.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <UserRound className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhum lead encontrado</p>
                <p className="text-sm text-muted-foreground">Os leads aparecerão aqui quando chegarem do WhatsApp.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Etapa Pipeline</TableHead>
                  <TableHead className="hidden lg:table-cell">Interesse</TableHead>
                  <TableHead className="hidden md:table-cell">Última interação</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLead({
                      id: lead.id,
                      nome: getLeadName(lead.nome, lead.telefone),
                      telefone: lead.telefone,
                    })}
                  >
                    <TableCell className="font-medium">{getLeadName(lead.nome, lead.telefone)}</TableCell>
                    <TableCell>{lead.telefone}</TableCell>
                    <TableCell>
                      <div className="w-[180px]" onClick={(event) => event.stopPropagation()}>
                        <Select
                          value={lead.etapa_pipeline ?? "novo"}
                          onValueChange={(value) => stageMutation.mutate({ leadId: lead.id, etapa: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STAGE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate lg:table-cell">{lead.interesse || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(lead.ultima_interacao)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{lead.origem || "WhatsApp"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DrawerContent className="mx-auto max-h-[85vh] w-full max-w-3xl rounded-t-2xl border-border bg-card">
          <DrawerHeader>
            <DrawerTitle>Histórico de mensagens</DrawerTitle>
            <DrawerDescription>
              {selectedLead ? `${selectedLead.nome} • ${selectedLead.telefone}` : ""}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
            {isLoadingMensagens ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !mensagens?.length ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhuma mensagem encontrada para este lead.
              </div>
            ) : (
              mensagens.map((mensagem) => (
                <WhatsAppChatBubble
                  key={mensagem.id}
                  role={mensagem.role}
                  content={mensagem.content}
                  createdAt={formatDateTime(mensagem.created_at)}
                  title={mensagem.role === "assistant" ? "Assistente" : selectedLead?.nome || "Cliente"}
                />
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </AdminLojaSectionLayout>
  );
}