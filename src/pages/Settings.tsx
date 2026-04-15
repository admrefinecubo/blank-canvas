import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import DaysSchedulePicker from "@/components/DaysSchedulePicker";
import type { HorariosEspeciais } from "@/lib/constants";
import { Bot, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { clinicId, isPlatformAdmin, appMode, activeLojaId } = useAuth();
  const queryClient = useQueryClient();

  const [clinicForm, setClinicForm] = useState({ name: "", phone: "", email: "" });
  const [storeForm, setStoreForm] = useState({
    nome_loja: "",
    nome_assistente: "",
    tom_voz: "amigável",
    descricao_loja: "",
    especialidades: "",
    regras_personalidade: "",
    horario_inicio: "08:00",
    horario_fim: "18:00",
    formas_pagamento: "",
    politica_troca: "",
    prazo_entrega: "",
    frete_gratis_acima: "",
    montagem_disponivel: false,
    desconto_carrinho_abandonado: "",
    desconto_promocao_nao_respondida: "",
    checkout_base_url: "",
    dias_funcionamento: "",
    horarios_especiais: {} as HorariosEspeciais,
    desconto_followup_orcamento: "",
    plataforma_ecommerce: "none",
    ecommerce_api_key: "",
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic-settings", clinicId],
    queryFn: async () => { if (!clinicId) return null; const { data } = await supabase.from("clinics").select("*").eq("id", clinicId).single(); return data; },
    enabled: !!clinicId,
  });

  const { data: activeLoja } = useQuery({
    queryKey: ["settings-loja", activeLojaId],
    queryFn: async () => {
      if (!activeLojaId) return null;
      const { data, error } = await supabase
        .from("lojas")
        .select("id, nome_loja, nome_assistente, tom_voz, descricao_loja, especialidades, regras_personalidade, horario_inicio, horario_fim, formas_pagamento, politica_troca, prazo_entrega, frete_gratis_acima, montagem_disponivel, desconto_carrinho_abandonado, desconto_promocao_nao_respondida, checkout_base_url, dias_funcionamento, horarios_especiais, desconto_followup_orcamento, plataforma_ecommerce, ecommerce_api_key")
        .eq("id", activeLojaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  useEffect(() => { if (clinic) setClinicForm({ name: clinic.name || "", phone: clinic.phone || "", email: clinic.email || "" }); }, [clinic]);

  useEffect(() => {
    if (!activeLoja) return;
    setStoreForm({
      nome_loja: activeLoja.nome_loja || "",
      nome_assistente: activeLoja.nome_assistente || "",
      tom_voz: activeLoja.tom_voz || "amigável",
      descricao_loja: (activeLoja as any).descricao_loja || "",
      especialidades: activeLoja.especialidades || "",
      regras_personalidade: activeLoja.regras_personalidade || "",
      horario_inicio: activeLoja.horario_inicio || "08:00",
      horario_fim: activeLoja.horario_fim || "18:00",
      formas_pagamento: activeLoja.formas_pagamento || "",
      politica_troca: activeLoja.politica_troca || "",
      prazo_entrega: activeLoja.prazo_entrega || "",
      frete_gratis_acima: activeLoja.frete_gratis_acima?.toString() || "",
      montagem_disponivel: !!activeLoja.montagem_disponivel,
      desconto_carrinho_abandonado: activeLoja.desconto_carrinho_abandonado?.toString() || "",
      desconto_promocao_nao_respondida: activeLoja.desconto_promocao_nao_respondida?.toString() || "",
      checkout_base_url: activeLoja.checkout_base_url || "",
      dias_funcionamento: activeLoja.dias_funcionamento || "seg,ter,qua,qui,sex",
      horarios_especiais: ((activeLoja as any).horarios_especiais as HorariosEspeciais) || {},
      desconto_followup_orcamento: activeLoja.desconto_followup_orcamento?.toString() || "",
      plataforma_ecommerce: activeLoja.plataforma_ecommerce || "none",
      ecommerce_api_key: (activeLoja as any).ecommerce_api_key || "",
    });
  }, [activeLoja]);

  const parseOptionalNumber = (value: string, fieldLabel: string) => {
    if (!value.trim()) return null;
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) throw new Error(`${fieldLabel} inválido`);
    return parsedValue;
  };

  const saveAiAgentMutation = useMutation({
    mutationFn: async () => {
      if (!activeLojaId) throw new Error("Nenhuma loja selecionada");

      const descontoCarrinho = parseOptionalNumber(storeForm.desconto_carrinho_abandonado, "Desconto de carrinho abandonado");
      const descontoPromocao = parseOptionalNumber(storeForm.desconto_promocao_nao_respondida, "Desconto de promoção não respondida");
      const freteGratis = parseOptionalNumber(storeForm.frete_gratis_acima, "Frete grátis acima de");

      if (descontoCarrinho !== null && (descontoCarrinho < 0 || descontoCarrinho > 100)) {
        throw new Error("Desconto de carrinho abandonado deve estar entre 0 e 100");
      }
      if (descontoPromocao !== null && (descontoPromocao < 0 || descontoPromocao > 100)) {
        throw new Error("Desconto de promoção não respondida deve estar entre 0 e 100");
      }

      const { error } = await supabase
        .from("lojas")
        .update({
          nome_assistente: storeForm.nome_assistente.trim() || null,
          tom_voz: storeForm.tom_voz,
          descricao_loja: storeForm.descricao_loja.trim() || null,
          especialidades: storeForm.especialidades.trim() || null,
          regras_personalidade: storeForm.regras_personalidade.trim() || null,
          horario_inicio: storeForm.horario_inicio || null,
          horario_fim: storeForm.horario_fim || null,
          formas_pagamento: storeForm.formas_pagamento.trim() || null,
          politica_troca: storeForm.politica_troca.trim() || null,
          prazo_entrega: storeForm.prazo_entrega.trim() || null,
          frete_gratis_acima: freteGratis,
          montagem_disponivel: storeForm.montagem_disponivel,
          desconto_carrinho_abandonado: descontoCarrinho,
          desconto_promocao_nao_respondida: descontoPromocao,
          checkout_base_url: storeForm.checkout_base_url.trim() || null,
          dias_funcionamento: storeForm.dias_funcionamento.trim() || null,
          horarios_especiais: storeForm.horarios_especiais || {},
          desconto_followup_orcamento: storeForm.desconto_followup_orcamento ? parseFloat(storeForm.desconto_followup_orcamento) : null,
          plataforma_ecommerce: storeForm.plataforma_ecommerce === "none" ? null : storeForm.plataforma_ecommerce.trim() || null,
          ecommerce_api_key: (storeForm as any).ecommerce_api_key?.trim() || null,
        } as any)
        .eq("id", activeLojaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-loja"] });
      toast({ title: "Configurações do agente salvas!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="clinic">
        <TabsList className="bg-accent flex-wrap h-auto gap-1">
          <TabsTrigger value="clinic">Conta</TabsTrigger>
          <TabsTrigger value="ai-agent"><Bot className="h-3.5 w-3.5 mr-1" />Agente de IA</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-4 space-y-4">
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">Dados da Loja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nome da Loja</Label><Input value={storeForm.nome_loja} readOnly /></div>
                <div><Label>Telefone</Label><Input value={clinicForm.phone} readOnly /></div>
                <div><Label>E-mail</Label><Input value={clinicForm.email} readOnly /></div>
              </div>
              <p className="text-sm text-muted-foreground">Para alterar esses dados, entre em contato com o administrador.</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">Horário de Funcionamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DaysSchedulePicker
                diasFuncionamento={storeForm.dias_funcionamento}
                onDiasChange={(v) => setStoreForm(f => ({ ...f, dias_funcionamento: v }))}
                horarioInicio={storeForm.horario_inicio}
                horarioFim={storeForm.horario_fim}
                onHorarioInicioChange={(v) => setStoreForm(f => ({ ...f, horario_inicio: v }))}
                onHorarioFimChange={(v) => setStoreForm(f => ({ ...f, horario_fim: v }))}
                horariosEspeciais={storeForm.horarios_especiais}
                onHorariosEspeciaisChange={(v) => setStoreForm(f => ({ ...f, horarios_especiais: v }))}
              />
              <Button onClick={() => saveAiAgentMutation.mutate()} disabled={saveAiAgentMutation.isPending} size="sm">
                {saveAiAgentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar horário
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-agent" className="mt-4 space-y-4">
          {!activeLojaId ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma loja ativa encontrada para este usuário.</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm">Identidade</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome do assistente</Label>
                    <Input value={storeForm.nome_assistente} onChange={e => setStoreForm(f => ({ ...f, nome_assistente: e.target.value }))} placeholder="Ex: Clara" />
                  </div>
                  <div>
                    <Label>Tom de Voz / Personalidade</Label>
                    <Textarea rows={4} value={storeForm.tom_voz} onChange={e => setStoreForm(f => ({ ...f, tom_voz: e.target.value }))} placeholder="Ex: Amigável, descontraído e consultivo." />
                  </div>
                  <div>
                    <Label>Regras Personalizadas do Agente</Label>
                    <Textarea rows={6} value={storeForm.regras_personalidade} onChange={e => setStoreForm(f => ({ ...f, regras_personalidade: e.target.value }))} placeholder="Ex: Sempre ofereça parcelamento em até 12x." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Regras Comerciais</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Formas de pagamento aceitas</Label>
                    <Textarea value={storeForm.formas_pagamento} onChange={e => setStoreForm(f => ({ ...f, formas_pagamento: e.target.value }))} placeholder="Ex: Pix, cartão em até 12x, boleto." className="min-h-[90px]" />
                  </div>
                  <div>
                    <Label>Política de troca</Label>
                    <Textarea value={storeForm.politica_troca} onChange={e => setStoreForm(f => ({ ...f, politica_troca: e.target.value }))} placeholder="Explique as condições de troca." className="min-h-[90px]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Prazo de entrega</Label>
                      <Input value={storeForm.prazo_entrega} onChange={e => setStoreForm(f => ({ ...f, prazo_entrega: e.target.value }))} placeholder="Ex: 5 a 7 dias úteis" />
                    </div>
                    <div>
                      <Label>Frete grátis acima de R$</Label>
                      <Input type="number" min="0" step="0.01" value={storeForm.frete_gratis_acima} onChange={e => setStoreForm(f => ({ ...f, frete_gratis_acima: e.target.value }))} placeholder="999.90" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">Serviço de montagem disponível</p>
                      <p className="text-xs text-muted-foreground">Informe ao agente se a loja oferece montagem ao cliente.</p>
                    </div>
                    <Switch checked={storeForm.montagem_disponivel} onCheckedChange={checked => setStoreForm(f => ({ ...f, montagem_disponivel: checked }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Descontos Automáticos</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Desconto carrinho abandonado %</Label>
                    <Input type="number" min="0" max="100" step="0.01" value={storeForm.desconto_carrinho_abandonado} onChange={e => setStoreForm(f => ({ ...f, desconto_carrinho_abandonado: e.target.value }))} placeholder="10" />
                  </div>
                  <div>
                    <Label>Desconto promoção não respondida %</Label>
                    <Input type="number" min="0" max="100" step="0.01" value={storeForm.desconto_promocao_nao_respondida} onChange={e => setStoreForm(f => ({ ...f, desconto_promocao_nao_respondida: e.target.value }))} placeholder="5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Descontos de Follow-up</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Desconto follow-up orçamento %</Label>
                    <Input type="number" min="0" max="100" step="0.01" value={storeForm.desconto_followup_orcamento} onChange={e => setStoreForm(f => ({ ...f, desconto_followup_orcamento: e.target.value }))} placeholder="10" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => saveAiAgentMutation.mutate()} disabled={saveAiAgentMutation.isPending}>
                  {saveAiAgentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar configurações
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
