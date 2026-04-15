import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import DaysSchedulePicker from "@/components/DaysSchedulePicker";
import type { HorariosEspeciais } from "@/lib/constants";
import { Save, Copy, Check, Loader2, Wifi, WifiOff, QrCode, RefreshCw, Settings2, Users, ShoppingBag, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";
import AdminTabEquipe from "@/components/admin/AdminTabEquipe";
import AdminTabPosVenda from "@/components/admin/AdminTabPosVenda";
import AdminTabAuditoria from "@/components/admin/AdminTabAuditoria";

const TOM_VOZ_OPTIONS = [
  { value: "amigável, profissional e consultivo", label: "Amigável, profissional e consultivo" },
  { value: "sofisticado, elegante e consultivo", label: "Sofisticado, elegante e consultivo" },
  { value: "descontraído e divertido", label: "Descontraído e divertido" },
  { value: "direto e objetivo", label: "Direto e objetivo" },
];

const PLATAFORMA_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "shopify", label: "Shopify" },
  { value: "nuvemshop", label: "Nuvemshop" },
  { value: "tray", label: "Tray" },
  { value: "vtex", label: "VTEX" },
];

export default function AdminLojaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("disconnected");
  const [checkingStatus, setCheckingStatus] = useState(false);

  const { data: loja, isLoading } = useQuery({
    queryKey: ["admin-loja", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (loja) setForm(loja);
  }, [loja]);

  // Check WhatsApp status on load
  useEffect(() => {
    if (loja?.clinic_id) checkWhatsAppStatus();
  }, [loja?.clinic_id]);

  // Auto-polling every 15s while status is "pending"
  useEffect(() => {
    if (whatsappStatus !== "pending" || !loja?.clinic_id) return;
    const interval = setInterval(() => {
      checkWhatsAppStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [whatsappStatus, loja?.clinic_id]);

  const checkWhatsAppStatus = async () => {
    if (!loja?.clinic_id) return;
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "status", clinic_id: loja.clinic_id, instance_name: form.instance || loja.instance },
      });
      if (!error && data) setWhatsappStatus(data.status || "disconnected");
    } catch {
      setWhatsappStatus("error");
    } finally {
      setCheckingStatus(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id: _id, created_at: _ca, ...updates } = form;
      const { error } = await supabase
        .from("lojas")
        .update(updates)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loja", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const instName = form.instance;
      if (!instName) throw new Error("Preencha o campo Instance primeiro");
      if (!loja?.clinic_id) throw new Error("Loja sem clinic_id");

      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: {
          action: "create_instance",
          clinic_id: loja.clinic_id,
          instance_name: instName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.qrcode) {
        setQrCode(data.qrcode);
        setQrDialog(true);
      }
      setWhatsappStatus("pending");
      toast({ title: "Instância criada!", description: "Escaneie o QR Code para conectar." });
    },
    onError: (e: any) => toast({ title: "Erro ao criar instância", description: e.message, variant: "destructive" }),
  });

  const reconnectMutation = useMutation({
    mutationFn: async () => {
      if (!loja?.clinic_id || !form.instance) throw new Error("Instance não configurada");
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: {
          action: "connect",
          clinic_id: loja.clinic_id,
          instance_name: form.instance,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.qrcode) {
        setQrCode(data.qrcode);
        setQrDialog(true);
      }
      setWhatsappStatus("pending");
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!loja?.clinic_id) throw new Error("Sem clinic_id");
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "disconnect", clinic_id: loja.clinic_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setWhatsappStatus("disconnected");
      toast({ title: "WhatsApp desconectado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const copyId = () => {
    navigator.clipboard.writeText(id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Loja não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/admin/lojas")}>Voltar</Button>
      </div>
    );
  }

  const statusBadge = {
    connected: <Badge className="bg-green-600 text-white">Conectado</Badge>,
    pending: <Badge className="bg-yellow-600 text-white">Aguardando QR</Badge>,
    disconnected: <Badge variant="destructive">Desconectado</Badge>,
    error: <Badge variant="destructive">Erro</Badge>,
  }[whatsappStatus] || <Badge variant="secondary">{whatsappStatus}</Badge>;

  return (
    <AdminLojaSectionLayout
      lojaId={id!}
      currentPath={location.pathname}
      title={form.nome_loja || loja.nome_loja}
      description="Configure identidade, regras comerciais e integrações desta loja."
      actions={
        <>
          <Badge variant={form.ativo ? "default" : "destructive"}>
            {form.ativo ? "Ativa" : "Inativa"}
          </Badge>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Label htmlFor="status-toggle" className="text-sm text-muted-foreground">
              {form.ativo ? "Ativa" : "Inativa"}
            </Label>
            <Switch
              id="status-toggle"
              checked={form.ativo ?? true}
              onCheckedChange={(v) => set("ativo", v)}
            />
          </div>
          <Button className="gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar tudo"}
          </Button>
        </>
      }
    >

      <Tabs defaultValue="identidade" className="space-y-6">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="equipe"><Users className="h-3.5 w-3.5 mr-1" />Equipe</TabsTrigger>
          <TabsTrigger value="pos-venda"><ShoppingBag className="h-3.5 w-3.5 mr-1" />Pós-Venda</TabsTrigger>
          <TabsTrigger value="auditoria"><History className="h-3.5 w-3.5 mr-1" />Auditoria</TabsTrigger>
        </TabsList>

        {/* Tab 1 - Identidade */}
        <TabsContent value="identidade">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Nome da loja</Label>
                  <Input placeholder="Ex: Conforto" value={form.nome_loja || ""} onChange={(e) => set("nome_loja", e.target.value)} />
                </div>
                <div>
                  <Label>Nome da Assistente IA</Label>
                  <Input placeholder="Ex: Sofia" value={form.nome_assistente_ia || ""} onChange={(e) => set("nome_assistente_ia", e.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Nome usado pela IA nas conversas e nos fluxos N8N</p>
                </div>
                <div>
                  <Label>Tom de Voz</Label>
                  <Select value={form.tom_voz || ""} onValueChange={(v) => set("tom_voz", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {TOM_VOZ_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição da loja</Label>
                <Textarea rows={3} placeholder="Descreva a loja para o agente de IA..." value={form.descricao_loja || ""} onChange={(e) => set("descricao_loja", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Usada pelo agente para se apresentar e contextualizar respostas</p>
              </div>
              <div>
                <Label>Especialidades</Label>
                <Input placeholder="Ex: colchões, sofás, móveis planejados" value={form.especialidades || ""} onChange={(e) => set("especialidades", e.target.value)} />
              </div>
              <div>
                <Label>Regras de Personalidade</Label>
                <Textarea
                  rows={4}
                  placeholder="Ex: Nunca mencione concorrentes. Pergunte sobre o ambiente antes de sugerir produto."
                  value={form.regras_personalidade || ""}
                  onChange={(e) => set("regras_personalidade", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Estas regras são incluídas diretamente no prompt do agente</p>
              </div>

              {/* Prompt Preview */}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview do Prompt (somente leitura)</p>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono max-h-[300px] overflow-y-auto">
{`Você é ${form.nome_assistente || "[Nome da IA]"}, assistente virtual da loja ${form.nome_loja || "[Nome da Loja]"}.
${form.descricao_loja ? `\nSobre a loja: ${form.descricao_loja}` : ""}
${form.especialidades ? `Especialidades: ${form.especialidades}` : ""}
${form.tom_voz ? `Tom de voz: ${form.tom_voz}` : ""}
${form.regras_personalidade ? `\nRegras:\n${form.regras_personalidade}` : ""}
${form.horario_inicio && form.horario_fim ? `\nHorário: ${form.horario_inicio} - ${form.horario_fim}${form.dias_funcionamento ? ` (${form.dias_funcionamento})` : ""}` : ""}
${form.endereco ? `Endereço: ${form.endereco}` : ""}
${form.formas_pagamento ? `Pagamento: ${form.formas_pagamento}` : ""}
${form.politica_troca ? `Troca: ${form.politica_troca}` : ""}
${form.prazo_entrega ? `Entrega: ${form.prazo_entrega}` : ""}
${form.frete_gratis_acima ? `Frete grátis acima de R$ ${form.frete_gratis_acima}` : ""}
${form.montagem_disponivel ? `Montagem disponível: Sim` : ""}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2 - Operação */}
        <TabsContent value="operacao">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <DaysSchedulePicker
                diasFuncionamento={form.dias_funcionamento || ""}
                onDiasChange={(v) => set("dias_funcionamento", v)}
                horarioInicio={form.horario_inicio || "08:00"}
                horarioFim={form.horario_fim || "18:00"}
                onHorarioInicioChange={(v) => set("horario_inicio", v)}
                onHorarioFimChange={(v) => set("horario_fim", v)}
                horariosEspeciais={(form.horarios_especiais as HorariosEspeciais) || {}}
                onHorariosEspeciaisChange={(v) => set("horarios_especiais", v)}
              />
              <div>
                <Label>Endereço completo</Label>
                <Input placeholder="Rua, número, bairro, cidade - UF" value={form.endereco || ""} onChange={(e) => set("endereco", e.target.value)} />
              </div>
              <div>
                <Label>Link do Google Maps</Label>
                <Input type="url" placeholder="https://maps.google.com/..." value={form.maps_link || ""} onChange={(e) => set("maps_link", e.target.value)} />
              </div>
              <div>
                <Label>Formas de Pagamento</Label>
                <Textarea
                  rows={3}
                  placeholder="Ex: Dinheiro, Cartão de crédito/débito (até 12x sem juros), PIX (5% desconto)"
                  value={form.formas_pagamento || ""}
                  onChange={(e) => set("formas_pagamento", e.target.value)}
                />
              </div>
              <div>
                <Label>Política de Troca</Label>
                <Textarea rows={3} placeholder="Ex: 30 dias para troca" value={form.politica_troca || ""} onChange={(e) => set("politica_troca", e.target.value)} />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Prazo de Entrega</Label>
                  <Input placeholder="Ex: 7 a 15 dias úteis" value={form.prazo_entrega || ""} onChange={(e) => set("prazo_entrega", e.target.value)} />
                </div>
                <div>
                  <Label>Frete grátis acima de</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input type="number" className="pl-10" value={form.frete_gratis_acima ?? ""} onChange={(e) => set("frete_gratis_acima", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Serviço de montagem disponível</p>
                  <p className="text-xs text-muted-foreground">Informar ao cliente que a loja oferece montagem</p>
                </div>
                <Switch checked={form.montagem_disponivel ?? false} onCheckedChange={(v) => set("montagem_disponivel", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 - Integrações */}
        <TabsContent value="integracoes">
          <div className="space-y-6">
            {/* WhatsApp Status Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {whatsappStatus === "connected" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
                  WhatsApp (Evolution API)
                </CardTitle>
                <CardDescription>Gerencie a conexão WhatsApp desta loja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status da conexão</p>
                    <p className="text-xs text-muted-foreground">Instância: {form.instance || "não configurada"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge}
                    <Button variant="ghost" size="icon" onClick={checkWhatsAppStatus} disabled={checkingStatus} title="Verificar status">
                      <RefreshCw className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Nome da instância</Label>
                  <Input
                    placeholder="Ex: lojaads"
                    value={form.instance || ""}
                    onChange={(e) => set("instance", e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deve ser único. Usado para identificar esta loja na Evolution API.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(whatsappStatus === "disconnected" || whatsappStatus === "error") && !form.instance && (
                    <Button
                      onClick={() => createInstanceMutation.mutate()}
                      disabled={createInstanceMutation.isPending || !form.instance}
                      className="gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      {createInstanceMutation.isPending ? "Criando..." : "Criar Instância e Conectar"}
                    </Button>
                  )}

                  {(whatsappStatus === "disconnected" || whatsappStatus === "error") && !!form.instance && (
                    <Button
                      onClick={() => reconnectMutation.mutate()}
                      disabled={reconnectMutation.isPending}
                      className="gap-2"
                    >
                      <Wifi className="h-4 w-4" />
                      {reconnectMutation.isPending ? "Reconectando..." : "Reconectar"}
                    </Button>
                  )}

                  {whatsappStatus === "pending" && (
                    <Button
                      onClick={() => reconnectMutation.mutate()}
                      disabled={reconnectMutation.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      {reconnectMutation.isPending ? "Obtendo QR..." : "Obter QR Code"}
                    </Button>
                  )}

                  {whatsappStatus === "connected" && (
                    <Button
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      variant="destructive"
                      className="gap-2"
                    >
                      <WifiOff className="h-4 w-4" />
                      Desconectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* E-commerce / System Info */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <Label>Plataforma de e-commerce</Label>
                  <Select value={form.plataforma_ecommerce || "manual"} onValueChange={(v) => set("plataforma_ecommerce", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATAFORMA_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL base do checkout</Label>
                  <Input type="url" placeholder="https://loja.nuvemshop.com.br/checkout" value={form.checkout_base_url || ""} onChange={(e) => set("checkout_base_url", e.target.value)} />
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Informações do sistema</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">ID da Loja</p>
                      <code className="text-sm">{id}</code>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={copyId}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm">{loja.created_at ? format(new Date(loja.created_at), "dd/MM/yyyy 'às' HH:mm") : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4 - Automações */}
        <TabsContent value="automacoes">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <Label>Desconto para carrinho abandonado</Label>
                <div className="relative max-w-xs">
                  <Input type="number" value={form.desconto_carrinho_abandonado ?? 5} onChange={(e) => set("desconto_carrinho_abandonado", e.target.value ? Number(e.target.value) : null)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Aplicado automaticamente no follow-up 24h após envio do link de checkout</p>
              </div>
              <div>
                <Label>Desconto para promoção não respondida</Label>
                <div className="relative max-w-xs">
                  <Input type="number" value={form.desconto_promocao_nao_respondida ?? 10} onChange={(e) => set("desconto_promocao_nao_respondida", e.target.value ? Number(e.target.value) : null)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Aplicado quando cliente não responde após follow-up de promoção</p>
              </div>
              <div>
                <Label>Desconto para follow-up de orçamento pendente</Label>
                <div className="relative max-w-xs">
                  <Input type="number" value={form.desconto_followup_orcamento ?? ""} onChange={(e) => set("desconto_followup_orcamento", e.target.value ? Number(e.target.value) : null)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Aplicado no follow-up quando cliente recebeu orçamento mas não finalizou</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5 - Equipe */}
        <TabsContent value="equipe">
          <AdminTabEquipe clinicId={loja.clinic_id || ""} />
        </TabsContent>

        {/* Tab 6 - Pós-Venda */}
        <TabsContent value="pos-venda">
          <AdminTabPosVenda clinicId={loja.clinic_id || ""} />
        </TabsContent>

        {/* Tab 7 - Auditoria */}
        <TabsContent value="auditoria">
          <AdminTabAuditoria clinicId={loja.clinic_id || ""} />
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular → Menu → Dispositivos conectados → Conectar dispositivo
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrCode ? (
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="h-64 w-64" />
            ) : (
              <p className="text-muted-foreground">QR Code não disponível</p>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => reconnectMutation.mutate()} disabled={reconnectMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar QR
            </Button>
            <Button onClick={() => { setQrDialog(false); checkWhatsAppStatus(); }}>
              Já escaneei
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Save Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-end">
          <Button className="gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </AdminLojaSectionLayout>
  );
}
