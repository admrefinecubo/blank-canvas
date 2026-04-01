import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageSquareText, Search, Store, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import WhatsAppChatBubble from "@/components/WhatsAppChatBubble";
import { formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

type ConversationSummary = {
  id: string;
  nome: string | null;
  telefone: string;
  etapa_pipeline: string;
  is_bot_active?: boolean;
  bot_paused_until?: string | null;
  ultima_msg?: string | null;
  ultima_data?: string | null;
};

function getAttendanceStatus(lead: ConversationSummary) {
  if (lead.bot_paused_until) {
    const pausedUntil = new Date(lead.bot_paused_until);
    if (!Number.isNaN(pausedUntil.getTime()) && pausedUntil > new Date()) {
      return {
        label: `Pausado até ${format(pausedUntil, "HH:mm", { locale: ptBR })}`,
        variant: "secondary" as const,
      };
    }
  }

  if (lead.is_bot_active === false) {
    return { label: "Atendimento humano", variant: "destructive" as const };
  }

  return { label: "Bot ativo", variant: "default" as const };
}

export default function WhatsApp() {
  const { activeLojaId } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: lojaContext } = useQuery({
    queryKey: ["whatsapp-loja-context", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("nome_loja, nome_assistente")
        .eq("id", activeLojaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["whatsapp-conversations", activeLojaId],
    mutationFn: async () => {
      const [leadsResult, messagesResult] = await Promise.all([
        (supabase.from("leads") as any)
          .select("id, nome, telefone, etapa_pipeline, is_bot_active, bot_paused_until")
          .eq("loja_id", activeLojaId!),
        supabase
          .from("historico_mensagens")
          .select("id, lead_id, content, created_at")
          .eq("loja_id", activeLojaId!)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (messagesResult.error) throw messagesResult.error;

      const latestByLead = new Map<string, { content: string; created_at: string }>();

      (messagesResult.data ?? []).forEach((message) => {
        if (!message.lead_id || latestByLead.has(message.lead_id)) return;
        latestByLead.set(message.lead_id, {
          content: message.content,
          created_at: message.created_at,
        });
      });

      return ((leadsResult.data ?? []) as ConversationSummary[])
        .map((lead) => ({
          ...lead,
          ultima_msg: latestByLead.get(lead.id)?.content ?? null,
          ultima_data: latestByLead.get(lead.id)?.created_at ?? null,
        }))
        .sort((a, b) => {
          const aTime = a.ultima_data ? new Date(a.ultima_data).getTime() : 0;
          const bTime = b.ultima_data ? new Date(b.ultima_data).getTime() : 0;
          return bTime - aTime;
        });
    },
    queryFn: async () => [],
    enabled: !!activeLojaId,
  });

  useEffect(() => {
    if (!selectedLeadId && conversations.length) {
      setSelectedLeadId(conversations[0].id);
    }

    if (selectedLeadId && !conversations.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(conversations[0]?.id ?? null);
    }
  }, [conversations, selectedLeadId]);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((lead) => {
      const name = getLeadName(lead.nome, lead.telefone).toLowerCase();
      return name.includes(term) || lead.telefone.toLowerCase().includes(term) || (lead.ultima_msg ?? "").toLowerCase().includes(term);
    });
  }, [conversations, search]);

  const selectedLead = filteredConversations.find((lead) => lead.id === selectedLeadId)
    || conversations.find((lead) => lead.id === selectedLeadId)
    || null;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["whatsapp-chat-messages", selectedLead?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_mensagens")
        .select("id, role, content, created_at")
        .eq("lead_id", selectedLead!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedLead?.id,
  });

  if (!activeLojaId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <Store className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-lg font-semibold">Nenhuma loja operacional ativa</p>
            <p className="mt-1 text-sm text-muted-foreground">Quando sua conta estiver vinculada, o inbox aparecerá aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">WhatsApp</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inbox operacional da loja {lojaContext?.nome_loja || "ativa"}.</p>
        </div>
        <Badge variant="outline">{filteredConversations.length} conversa(s)</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px,minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="text-base">Conversas</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou mensagem" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !filteredConversations.length ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <MessageSquareText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Nenhuma conversa encontrada</p>
                  <p className="text-sm text-muted-foreground">As conversas da sua loja aparecerão aqui automaticamente.</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[65vh]">
                <div className="space-y-1 p-2">
                  {filteredConversations.map((lead) => {
                    const status = getAttendanceStatus(lead);
                    const active = selectedLead?.id === lead.id;

                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-accent/40"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{getLeadName(lead.nome, lead.telefone)}</p>
                            <p className="truncate text-xs text-muted-foreground">{lead.telefone}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {lead.ultima_data ? format(new Date(lead.ultima_data), "HH:mm", { locale: ptBR }) : "—"}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lead.ultima_msg || "Sem mensagens ainda"}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{lead.etapa_pipeline}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            {selectedLead ? (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base">{getLeadName(selectedLead.nome, selectedLead.telefone)}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedLead.telefone}</p>
                </div>
                <Badge variant={getAttendanceStatus(selectedLead).variant}>{getAttendanceStatus(selectedLead).label}</Badge>
              </div>
            ) : (
              <CardTitle className="text-base">Selecione uma conversa</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!selectedLead ? (
              <div className="flex h-[65vh] flex-col items-center justify-center gap-3 text-center">
                <UserRound className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Nenhuma conversa selecionada</p>
                  <p className="text-sm text-muted-foreground">Escolha um lead na lateral para abrir o histórico.</p>
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="flex h-[65vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !messages.length ? (
              <div className="flex h-[65vh] items-center justify-center p-8 text-center text-sm text-muted-foreground">
                Ainda não existem mensagens registradas para este lead.
              </div>
            ) : (
              <ScrollArea className="h-[65vh]">
                <div className="space-y-3 p-4 md:p-6">
                  {messages.map((message) => (
                    <WhatsAppChatBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      createdAt={formatDateTime(message.created_at)}
                      title={message.role === "assistant" ? (lojaContext?.nome_assistente || "Assistente") : getLeadName(selectedLead.nome, selectedLead.telefone)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
}
