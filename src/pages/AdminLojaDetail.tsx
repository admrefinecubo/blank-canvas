import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Save, Copy, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";

const TOM_VOZ_OPTIONS = [
  { value: "amigável, profissional e consultivo", label: "Amigável, profissional e consultivo" },
  { value: "sofisticado, elegante e consultivo", label: "Sofisticado, elegante e consultivo" },
  { value: "descontraído e divertido", label: "Descontraído e divertido" },
  { value: "direto e objetivo", label: "Direto e objetivo" },
];

const PLATAFORMA_OPTIONS = [
  { value: "shopify", label: "Shopify" },
  { value: "nuvemshop", label: "Nuvemshop" },
  { value: "tray", label: "Tray" },
  { value: "vtex", label: "VTEX" },
  { value: "vendizap", label: "VendiZap" },
  { value: "manual", label: "Manual/Outro" },
];

export default function AdminLojaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);

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

      {/* Tabs */}
      <Tabs defaultValue="identidade" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="identidade">Identidade da IA</TabsTrigger>
          <TabsTrigger value="regras">Regras de Negócio</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="integracao">Integração</TabsTrigger>
        </TabsList>

        {/* Tab 1 - Identidade da IA */}
        <TabsContent value="identidade">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Nome do Assistente</Label>
                  <Input placeholder="Ex: Sofia" value={form.nome_assistente || ""} onChange={(e) => set("nome_assistente", e.target.value)} />
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
                <Label>Especialidades</Label>
                <Input placeholder="Ex: colchões, sofás, móveis planejados" value={form.especialidades || ""} onChange={(e) => set("especialidades", e.target.value)} />
              </div>
              <div>
                <Label>Regras de Personalidade</Label>
                <Textarea
                  rows={4}
                  placeholder="Ex: Nunca mencione concorrentes. Pergunte sobre o ambiente antes de sugerir produto. Sempre ofereça parcelamento."
                  value={form.regras_personalidade || ""}
                  onChange={(e) => set("regras_personalidade", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Estas regras são incluídas diretamente no prompt do agente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2 - Regras de Negócio */}
        <TabsContent value="regras">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Abre às</Label>
                  <Input type="time" value={form.horario_inicio || "08:00"} onChange={(e) => set("horario_inicio", e.target.value)} />
                </div>
                <div>
                  <Label>Fecha às</Label>
                  <Input type="time" value={form.horario_fim || "18:00"} onChange={(e) => set("horario_fim", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Endereço completo</Label>
                <Input placeholder="Rua, número, bairro, cidade - UF" value={form.endereco || ""} onChange={(e) => set("endereco", e.target.value)} />
              </div>
              <div>
                <Label>Link Google Maps</Label>
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
                  <Input placeholder="Ex: 7 a 15 dias úteis para Porto Alegre e região" value={form.prazo_entrega || ""} onChange={(e) => set("prazo_entrega", e.target.value)} />
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
              <div className="grid gap-5 md:grid-cols-2">
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
                  <Label>URL base de checkout</Label>
                  <Input type="url" placeholder="https://loja.nuvemshop.com.br/checkout" value={form.checkout_base_url || ""} onChange={(e) => set("checkout_base_url", e.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Prefixo do link de pagamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 - Follow-up */}
        <TabsContent value="followup">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4 - Integração */}
        <TabsContent value="integracao">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <Label>Instance Evolution API</Label>
                <Input value={form.instance || ""} onChange={(e) => set("instance", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Nome exato da instância WhatsApp no servidor Evolution. Ex: agencia-sdr</p>
              </div>
              <div>
                <Label>Webhook de atualização do catálogo</Label>
                <Input type="url" placeholder={`https://seu-n8n.com/webhook/catalogo-${id?.slice(0, 8)}`} value={form.webhook_catalogo_url || ""} onChange={(e) => set("webhook_catalogo_url", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">O e-commerce chama esta URL para sincronizar produtos em tempo real</p>
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
        </TabsContent>
      </Tabs>

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
