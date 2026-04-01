import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2, MessageSquareText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";
import WhatsAppChatBubble from "@/components/WhatsAppChatBubble";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

export default function AdminLojaConversas() {
  const { id: lojaId } = useParams<{ id: string }>();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const { data: mensagens, isLoading } = useQuery({
    queryKey: ["admin-loja-conversas", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_mensagens")
        .select("id, role, content, created_at, telefone, lead_id")
        .eq("loja_id", lojaId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  const { data: leads } = useQuery({
    queryKey: ["admin-loja-conversas-leads", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome, telefone").eq("loja_id", lojaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
  });

  const leadMap = useMemo(
    () => new Map((leads ?? []).map((lead) => [lead.id, lead])),
    [leads],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!mensagens) return [];

    return mensagens.filter((mensagem) => {
      if (!term) return true;
      const lead = mensagem.lead_id ? leadMap.get(mensagem.lead_id) : undefined;
      const leadName = getLeadName(lead?.nome, lead?.telefone).toLowerCase();
      return mensagem.telefone.toLowerCase().includes(term) || leadName.includes(term);
    });
  }, [leadMap, mensagens, search]);

  return (
    <AdminLojaSectionLayout
      lojaId={lojaId!}
      currentPath={location.pathname}
      title="Histórico de conversas"
      description="Acompanhe todo o tráfego de mensagens processado pelo agente desta loja."
      actions={
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por telefone ou nome do lead"
          className="w-full min-w-[260px] max-w-sm"
        />
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <MessageSquareText className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhuma conversa encontrada</p>
                <p className="text-sm text-muted-foreground">Ajuste a busca ou aguarde novas mensagens sincronizadas.</p>
              </div>
            </div>
          ) : (
            filtered.map((mensagem, index) => {
              const previous = filtered[index - 1];
              const currentLead = mensagem.lead_id ? leadMap.get(mensagem.lead_id) : undefined;
              const previousLead = previous?.lead_id ? leadMap.get(previous.lead_id) : undefined;
              const conversationKey = `${mensagem.lead_id || "sem-lead"}:${mensagem.telefone}`;
              const previousKey = previous ? `${previous.lead_id || "sem-lead"}:${previous.telefone}` : "";
              const showDivider = index === 0 || conversationKey !== previousKey;
              const title = `${getLeadName(currentLead?.nome, mensagem.telefone)} • ${mensagem.telefone}`;

              return (
                <div key={mensagem.id} className="space-y-3">
                  {showDivider ? (
                    <div className="sticky top-0 z-10 rounded-xl border border-border bg-background/95 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
                      {title}
                    </div>
                  ) : null}
                  <WhatsAppChatBubble
                    role={mensagem.role}
                    content={mensagem.content}
                    createdAt={formatDateTime(mensagem.created_at)}
                    title={mensagem.role === "assistant" ? "Assistente" : getLeadName(currentLead?.nome || previousLead?.nome, mensagem.telefone)}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </AdminLojaSectionLayout>
  );
}