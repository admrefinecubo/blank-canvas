import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageSquareText, Search, SendHorizontal, Store, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { activateHandoff, deactivateHandoff } from "@/lib/handoff";
import WhatsAppChatBubble from "@/components/WhatsAppChatBubble";
import { formatDateTime, getLeadName, getEtapaLabel } from "@/lib/whatsapp-admin";

type ConversationSummary = {
  id: string;
  nome: string | null;
  telefone: string;
  etapa_pipeline: string;
  is_bot_active?: boolean;
  agente_pausado?: boolean | null;
  bot_paused_until?: string | null;
  instance?: string | null;
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

function ChatMessages({ messages, assistantName, leadName }: { messages: { id: string; role: string; content: string; created_at: string }[]; assistantName: string; leadName: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4 md:p-6">
        {messages.map((message) => (
          <WhatsAppChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            createdAt={formatDateTime(message.created_at)}
            title={message.role === "assistant" ? assistantName : leadName}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const { activeLojaId, activeClinicId } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const { data: lojaContext } = useQuery({
    queryKey: ["whatsapp-loja-context", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("nome_loja, nome_assistente, instance")
        .eq("id", activeLojaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["whatsapp-conversations", activeLojaId],
    queryFn: async () => {
      const [leadsResult, messagesResult] = await Promise.all([
        (supabase.from("leads") as any)
          .select("id, nome, telefone, etapa_pipeline, is_bot_active, agente_pausado, bot_paused_until, instance")
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

  useEffect(() => {
    setDraftMessage("");
  }, [selectedLead?.id]);

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

  const toggleBotMutation = useMutation({
    mutationFn: async (botActive: boolean) => {
      if (!selectedLead?.id) throw new Error("Selecione um lead");
      if (!activeLojaId) throw new Error("Loja ativa não encontrada");

      const params = {
        leadId: selectedLead.id,
        telefone: selectedLead.telefone,
        lojaId: activeLojaId,
        instance: selectedLead.instance ?? lojaContext?.instance ?? null,
      };

      if (botActive) {
        await deactivateHandoff(params);
      } else {
        await activateHandoff(params);
      }

      return botActive;
    },
    onSuccess: (botActive) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", activeLojaId] });
      toast.success(botActive ? "Conversa devolvida ao bot" : "Conversa assumida manualmente");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar bot", { description: error.message });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error("Selecione uma conversa");
      if (!activeLojaId) throw new Error("Loja ativa não encontrada");

      const message = draftMessage.trim();
      if (!message) throw new Error("Digite uma mensagem");

      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: {
          action: "send_message",
          loja_id: activeLojaId,
          phone: selectedLead.telefone,
          message,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const now = new Date().toISOString();

      const [messageInsert, leadUpdate] = await Promise.all([
        supabase.from("historico_mensagens").insert({
          lead_id: selectedLead.id,
          loja_id: activeLojaId,
          telefone: selectedLead.telefone,
          role: "assistant",
          content: message,
          created_at: now,
        }),
        supabase.from("leads").update({
          ultima_mensagem: message,
          ultima_interacao: now,
        }).eq("id", selectedLead.id),
      ]);

      if (messageInsert.error) throw messageInsert.error;
      if (leadUpdate.error) throw leadUpdate.error;

      // Auto-pause bot when human sends message from CRM
      if (selectedLead.is_bot_active !== false) {
        await activateHandoff({
          leadId: selectedLead.id,
          telefone: selectedLead.telefone,
          lojaId: activeLojaId,
          instance: selectedLead.instance ?? lojaContext?.instance ?? null,
        });
      }
    },
    onSuccess: () => {
      setDraftMessage("");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", activeLojaId] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-chat-messages", selectedLead?.id] });
      toast.success("Mensagem enviada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar mensagem", { description: error.message });
    },
  });

  const getRelativeTime = (value?: string | null) => {
    if (!value) return "—";
    return formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR });
  };

  const getLeadInitials = (lead: ConversationSummary) => {
    const name = getLeadName(lead.nome, lead.telefone).trim();
    const parts = name.split(" ").filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "LD";
  };

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
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11 border border-border">
                            <AvatarFallback>{getLeadInitials(lead)}</AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{getLeadName(lead.nome, lead.telefone)}</p>
                                <p className="truncate text-xs text-muted-foreground">{lead.telefone}</p>
                              </div>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {getRelativeTime(lead.ultima_data)}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lead.ultima_msg || "Sem mensagens ainda"}</p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${lead.is_bot_active === false ? "bg-destructive" : "bg-primary"}`} />
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{getEtapaLabel(lead.etapa_pipeline)}</span>
                            </div>
                          </div>
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback>{getLeadInitials(selectedLead)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{getLeadName(selectedLead.nome, selectedLead.telefone)}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedLead.telefone}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedLead.is_bot_active === false ? "bg-destructive" : "bg-primary"}`} />
                    <span className="text-sm font-medium">{selectedLead.is_bot_active === false ? "Bot pausado" : "Bot ativo"}</span>
                  </div>
                  <Badge variant={getAttendanceStatus(selectedLead).variant}>{getAttendanceStatus(selectedLead).label}</Badge>
                </div>
              </div>
            ) : (
              <CardTitle className="text-base">Selecione uma conversa</CardTitle>
            )}
          </CardHeader>
          <CardContent className="flex h-[65vh] flex-col p-0">
            {!selectedLead ? (
              <div className="flex h-[65vh] flex-col items-center justify-center gap-3 text-center">
                <UserRound className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Nenhuma conversa selecionada</p>
                  <p className="text-sm text-muted-foreground">Escolha um lead na lateral para abrir o histórico.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-border/60 px-4 py-3 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">Controle da conversa</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedLead.is_bot_active
                          ? "Desative para assumir manualmente esta conversa."
                          : "Ative para devolver o atendimento ao bot."}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Assumir conversa / Devolver ao bot</span>
                      <Switch
                        checked={selectedLead.is_bot_active !== false}
                        disabled={toggleBotMutation.isPending}
                        onCheckedChange={(checked) => toggleBotMutation.mutate(checked)}
                        className={`transition-all duration-500 ${
                          selectedLead.is_bot_active === false
                            ? "data-[state=unchecked]:bg-destructive data-[state=unchecked]:shadow-[0_0_12px_hsl(var(--destructive)/0.5)] data-[state=unchecked]:ring-2 data-[state=unchecked]:ring-destructive/30"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : !messages.length ? (
                    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                      Ainda não existem mensagens registradas para este lead.
                    </div>
                  ) : (
                    <ChatMessages
                      messages={messages}
                      assistantName={lojaContext?.nome_assistente || "Assistente"}
                      leadName={getLeadName(selectedLead.nome, selectedLead.telefone)}
                    />
                  )}
                </div>

                <div className="border-t border-border/60 p-4 md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Digite uma mensagem manual para este lead..."
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          if (!sendMessageMutation.isPending && draftMessage.trim()) {
                            sendMessageMutation.mutate();
                          }
                        }
                      }}
                    />
                    <Button
                      className="gap-2"
                      disabled={!draftMessage.trim() || sendMessageMutation.isPending || !activeLojaId}
                      onClick={() => sendMessageMutation.mutate()}
                    >
                      {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                      Enviar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
