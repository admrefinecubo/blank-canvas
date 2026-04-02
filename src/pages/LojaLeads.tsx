import { useMemo, useState } from "react";
import { Facebook, Instagram, Loader2, MessageCircle, PencilLine, Search, UserRound, Users, Bot, BotOff, PauseCircle, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import WhatsAppChatBubble from "@/components/WhatsAppChatBubble";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LEAD_STAGE_OPTIONS, formatDateTime, getLeadName } from "@/lib/whatsapp-admin";

type LeadRow = {
  id: string;
  nome: string | null;
  telefone: string;
  etapa_pipeline: string | null;
  interesse: string | null;
  ultima_interacao: string | null;
  origem: string | null;
  canal_origem?: string | null;
  ultima_mensagem: string | null;
  is_bot_active: boolean;
};

type SelectedLead = {
  id: string;
  nome: string;
  telefone: string;
  origem: string | null;
  is_bot_active: boolean;
  ultima_mensagem: string | null;
};

const CREATE_ORIGIN_OPTIONS = ["whatsapp", "instagram", "facebook", "google", "indicacao", "manual"] as const;
const ORIGIN_OPTIONS = ["all", ...CREATE_ORIGIN_OPTIONS] as const;

type LeadOrigin = (typeof CREATE_ORIGIN_OPTIONS)[number];

const EMPTY_CREATE_FORM = {
  nome: "",
  telefone: "",
  interesse: "",
  canal_origem: "manual" as LeadOrigin,
};

const ORIGIN_META: Record<string, { label: string; icon: typeof MessageCircle }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  instagram: { label: "Instagram", icon: Instagram },
  facebook: { label: "Facebook", icon: Facebook },
  google: { label: "Google", icon: Search },
  indicacao: { label: "Indicação", icon: Users },
  manual: { label: "Manual", icon: PencilLine },
};

export default function LojaLeads() {
  const queryClient = useQueryClient();
  const { activeLojaId } = useAuth();
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState<(typeof ORIGIN_OPTIONS)[number]>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["loja-leads", activeLojaId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("leads") as any)
        .from("leads")
        .select("id, nome, telefone, etapa_pipeline, interesse, ultima_interacao, origem, canal_origem, ultima_mensagem, is_bot_active")
        .eq("loja_id", activeLojaId!)
        .order("ultima_interacao", { ascending: false });
      if (error) throw error;
      return (data || []) as LeadRow[];
    },
    enabled: !!activeLojaId,
  });

  const { data: mensagens, isLoading: isLoadingMensagens } = useQuery({
    queryKey: ["loja-lead-mensagens", selectedLead?.id],
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
      queryClient.invalidateQueries({ queryKey: ["loja-leads", activeLojaId] });
      toast.success("Etapa atualizada");
    },
    onError: (error: Error) => toast.error("Erro ao atualizar etapa", { description: error.message }),
  });

  const pauseBotMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("leads").update({ is_bot_active: false }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ["loja-leads", activeLojaId] });
      setSelectedLead((current) => current && current.id === leadId ? { ...current, is_bot_active: false } : current);
      toast.success("Bot pausado para este lead");
    },
    onError: (error: Error) => toast.error("Erro ao pausar bot", { description: error.message }),
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      if (!activeLojaId) throw new Error("Nenhuma loja ativa encontrada");

      const telefone = createForm.telefone.trim();
      if (!telefone) throw new Error("Informe o telefone do lead");

      const payload = {
        loja_id: activeLojaId,
        nome: createForm.nome.trim() || null,
        telefone,
        interesse: createForm.interesse.trim() || null,
        etapa_pipeline: "novo",
        canal_origem: createForm.canal_origem,
      };

      const { error } = await ((supabase.from("leads") as any).insert(payload));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-leads", activeLojaId] });
      setShowCreateDialog(false);
      setCreateForm(EMPTY_CREATE_FORM);
      toast.success("Lead criado com sucesso");
    },
    onError: (error: Error) => toast.error("Erro ao criar lead", { description: error.message }),
  });

  const getLeadOrigin = (lead: Pick<LeadRow, "origem" | "canal_origem">) => lead.canal_origem || lead.origem || "manual";

  const filteredLeads = useMemo(() => {
    return (leads || []).filter((lead) => {
      const normalizedSearch = search.toLowerCase();
      const leadName = getLeadName(lead.nome, lead.telefone).toLowerCase();
      const matchesSearch = !normalizedSearch
        || leadName.includes(normalizedSearch)
        || lead.telefone.includes(search)
        || (lead.ultima_mensagem || "").toLowerCase().includes(normalizedSearch);
      const matchesOrigin = filterOrigin === "all" || getLeadOrigin(lead) === filterOrigin;
      return matchesSearch && matchesOrigin;
    });
  }, [filterOrigin, leads, search]);

  const getOriginMeta = (origin: string | null) => ORIGIN_META[origin || "manual"] || { label: origin || "Manual", icon: UserRound };

  if (!activeLojaId) {
    return <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">Nenhuma loja operacional vinculada a esta conta.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Clientes / Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe os leads do WhatsApp da sua loja.</p>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, telefone ou última mensagem..."
              className="pl-9"
            />
          </div>

          <Select value={filterOrigin} onValueChange={(value) => setFilterOrigin(value as (typeof ORIGIN_OPTIONS)[number])}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary">{filteredLeads.length} lead(s)</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filteredLeads.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <UserRound className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhum lead encontrado</p>
                <p className="text-sm text-muted-foreground">Ajuste os filtros ou aguarde novos leads da sua loja.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="hidden md:table-cell">Bot</TableHead>
                  <TableHead className="hidden lg:table-cell">Interesse</TableHead>
                  <TableHead className="hidden md:table-cell">Última interação</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const origin = getOriginMeta(getLeadOrigin(lead));
                  const OriginIcon = origin.icon;

                  return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLead({
                      id: lead.id,
                      nome: getLeadName(lead.nome, lead.telefone),
                      telefone: lead.telefone,
                      origem: getLeadOrigin(lead),
                      is_bot_active: lead.is_bot_active,
                      ultima_mensagem: lead.ultima_mensagem,
                    })}
                  >
                    <TableCell className="min-w-[280px]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <OriginIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="font-medium">{getLeadName(lead.nome, lead.telefone)}</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{origin.label}</Badge>
                            <Badge variant="outline" className={lead.is_bot_active ? "" : "text-muted-foreground"}>
                              {lead.is_bot_active ? "Bot ativo" : "Bot pausado"}
                            </Badge>
                          </div>
                          <p className="max-w-[320px] truncate text-sm text-muted-foreground">
                            {lead.ultima_mensagem || "Sem mensagens recentes."}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.telefone}</TableCell>
                    <TableCell>
                      <div className="w-[180px]" onClick={(event) => event.stopPropagation()}>
                        <Select
                          value={lead.etapa_pipeline ?? "novo"}
                          onValueChange={(value) => stageMutation.mutate({ leadId: lead.id, etapa: value as (typeof LEAD_STAGE_OPTIONS)[number]["value"] })}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {LEAD_STAGE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={lead.is_bot_active ? "default" : "secondary"} className="gap-1">
                        {lead.is_bot_active ? <Bot className="h-3.5 w-3.5" /> : <BotOff className="h-3.5 w-3.5" />}
                        {lead.is_bot_active ? "Ativo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate lg:table-cell">{lead.interesse || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(lead.ultima_interacao)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary">{origin.label}</Badge></TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DrawerContent className="mx-auto max-h-[85vh] w-full max-w-3xl rounded-t-2xl border-border bg-card">
          <DrawerHeader>
            <DrawerTitle>Histórico de mensagens</DrawerTitle>
            <DrawerDescription>{selectedLead ? `${selectedLead.nome} • ${selectedLead.telefone}` : ""}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
            {selectedLead && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{getOriginMeta(selectedLead.origem).label}</Badge>
                    <Badge variant="outline">{selectedLead.is_bot_active ? "Bot ativo" : "Bot pausado"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.ultima_mensagem || "Sem mensagem recente para este lead."}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!selectedLead.is_bot_active || pauseBotMutation.isPending}
                  onClick={() => pauseBotMutation.mutate(selectedLead.id)}
                >
                  <PauseCircle className="h-4 w-4" />
                  {pauseBotMutation.isPending ? "Pausando..." : "Pausar bot"}
                </Button>
              </div>
            )}

            {isLoadingMensagens ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !mensagens?.length ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma mensagem encontrada para este lead.</div>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-nome">Nome</Label>
              <Input
                id="lead-nome"
                value={createForm.nome}
                onChange={(event) => setCreateForm((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Nome do lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-telefone">Telefone</Label>
              <Input
                id="lead-telefone"
                value={createForm.telefone}
                onChange={(event) => setCreateForm((current) => ({ ...current, telefone: event.target.value }))}
                placeholder="Telefone com DDD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-origem">Origem</Label>
              <Select
                value={createForm.canal_origem}
                onValueChange={(value) => setCreateForm((current) => ({ ...current, canal_origem: value as LeadOrigin }))}
              >
                <SelectTrigger id="lead-origem">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">whatsapp</SelectItem>
                  <SelectItem value="instagram">instagram</SelectItem>
                  <SelectItem value="facebook">facebook</SelectItem>
                  <SelectItem value="google">google</SelectItem>
                  <SelectItem value="indicacao">indicacao</SelectItem>
                  <SelectItem value="manual">manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-interesse">Interesse</Label>
              <Input
                id="lead-interesse"
                value={createForm.interesse}
                onChange={(event) => setCreateForm((current) => ({ ...current, interesse: event.target.value }))}
                placeholder="Produto ou interesse principal"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createLeadMutation.mutate()} disabled={createLeadMutation.isPending}>
              {createLeadMutation.isPending ? "Criando..." : "Criar lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}