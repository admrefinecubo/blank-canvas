import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, MapPin, Truck, Bot, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import DaysSchedulePicker from "@/components/DaysSchedulePicker";
import type { HorariosEspeciais } from "@/lib/constants";

const TOM_VOZ_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "amigável e descontraído", label: "Amigável e Descontraído" },
  { value: "jovem e moderno", label: "Jovem e Moderno" },
  { value: "profissional e técnico", label: "Profissional e Técnico" },
];

const PLATAFORMA_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "shopify", label: "Shopify" },
  { value: "nuvemshop", label: "Nuvemshop" },
  { value: "tray", label: "Tray" },
  { value: "vtex", label: "VTEX" },
  { value: "vendizap", label: "VendiZap" },
];

const STEPS = [
  { title: "Identidade da Loja", icon: Store },
  { title: "Endereço e Horário", icon: MapPin },
  { title: "Pagamento e Logística", icon: Truck },
  { title: "IA e Personalidade", icon: Bot },
  { title: "Concluído 🎉", icon: CheckCircle2 },
];

interface Props {
  loja: Record<string, any>;
  open: boolean;
  onClose: () => void;
}

export default function LojaOnboardingWizard({ loja, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Record<string, any>>({
    nome_loja: loja.nome_loja || "",
    especialidades: loja.especialidades || "",
    nome_assistente_ia: loja.nome_assistente_ia || "",
    tom_voz: loja.tom_voz || "",
    endereco: loja.endereco || "",
    maps_link: loja.maps_link || "",
    horario_inicio: loja.horario_inicio || "",
    horario_fim: loja.horario_fim || "",
    dias_funcionamento: loja.dias_funcionamento || "",
    horarios_especiais: (loja.horarios_especiais as HorariosEspeciais) || {},
    formas_pagamento: loja.formas_pagamento || "",
    prazo_entrega: loja.prazo_entrega || "",
    frete_gratis_acima: loja.frete_gratis_acima ?? "",
    montagem_disponivel: loja.montagem_disponivel || false,
    politica_troca: loja.politica_troca || "",
    regras_personalidade: loja.regras_personalidade || "",
    checkout_base_url: loja.checkout_base_url || "",
    plataforma_ecommerce: loja.plataforma_ecommerce || "nenhuma",
  });

  const set = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const saveStepMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { error } = await supabase.from("lojas").update(payload).eq("id", loja.id);
      if (error) throw error;
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nome_loja.trim()) errs.nome_loja = "Obrigatório";
    if (!form.especialidades.trim()) errs.especialidades = "Obrigatório";
    if (!form.nome_assistente_ia.trim()) errs.nome_assistente_ia = "Obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getStepPayload = (s: number): Record<string, any> => {
    switch (s) {
      case 0:
        return {
          nome_loja: form.nome_loja,
          especialidades: form.especialidades,
          nome_assistente_ia: form.nome_assistente_ia,
          tom_voz: form.tom_voz || null,
        };
      case 1:
        return {
          endereco: form.endereco || null,
          maps_link: form.maps_link || null,
          horario_inicio: form.horario_inicio || null,
          horario_fim: form.horario_fim || null,
          dias_funcionamento: form.dias_funcionamento || null,
          horarios_especiais: form.horarios_especiais,
        };
      case 2:
        return {
          formas_pagamento: form.formas_pagamento || null,
          prazo_entrega: form.prazo_entrega || null,
          frete_gratis_acima: form.frete_gratis_acima === "" ? null : Number(form.frete_gratis_acima),
          montagem_disponivel: form.montagem_disponivel,
          politica_troca: form.politica_troca || null,
        };
      case 3: {
        const plat = form.plataforma_ecommerce === "nenhuma" ? null : form.plataforma_ecommerce;
        return {
          regras_personalidade: form.regras_personalidade || null,
          checkout_base_url: plat ? form.checkout_base_url || null : null,
          plataforma_ecommerce: plat,
        };
      }
      default:
        return {};
    }
  };

  const handleNext = async () => {
    if (step === 0 && !validateStep1()) return;

    const payload = getStepPayload(step);
    await saveStepMutation.mutateAsync(payload);
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    await saveStepMutation.mutateAsync({ onboarding_concluido: true });
    queryClient.invalidateQueries({ queryKey: ["loja-onboarding"] });
    queryClient.invalidateQueries({ queryKey: ["admin-loja"] });
    toast({ title: "Tudo pronto!", description: `Seu assistente ${form.nome_assistente_ia} está configurado.` });
    onClose();
  };

  if (!open) return null;

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;
  const isLast = step === STEPS.length - 1;

  const fieldError = (key: string) =>
    errors[key] ? <p className="text-xs text-destructive mt-1">{errors[key]}</p> : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StepIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{STEPS[step].title}</h2>
            <p className="text-sm text-muted-foreground">Etapa {step + 1} de {STEPS.length}</p>
          </div>
        </div>

        <Progress value={progress} className="h-1.5 mb-6" />

        {/* Step content */}
        <div className="space-y-4 min-h-[320px]">
          {step === 0 && (
            <>
              <div>
                <Label>Nome da sua loja *</Label>
                <Input value={form.nome_loja} onChange={(e) => set("nome_loja", e.target.value)} />
                {fieldError("nome_loja")}
              </div>
              <div>
                <Label>O que vocês vendem? *</Label>
                <Input
                  placeholder="Ex: móveis, colchões, planejados"
                  value={form.especialidades}
                  onChange={(e) => set("especialidades", e.target.value)}
                />
                {fieldError("especialidades")}
              </div>
              <div>
                <Label>Nome do seu assistente de IA *</Label>
                <Input
                  placeholder="Ex: Sofia, Julia, Carlos"
                  value={form.nome_assistente_ia}
                  onChange={(e) => set("nome_assistente_ia", e.target.value)}
                />
                {fieldError("nome_assistente_ia")}
              </div>
              <div>
                <Label>Tom de Voz</Label>
                <Select value={form.tom_voz} onValueChange={(v) => set("tom_voz", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TOM_VOZ_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <Label>Endereço completo da loja</Label>
                <Input
                  placeholder="Rua, número, bairro, cidade"
                  value={form.endereco}
                  onChange={(e) => set("endereco", e.target.value)}
                />
              </div>
              <div>
                <Label>Link do Google Maps</Label>
                <Input
                  placeholder="Cole o link do Google Maps"
                  value={form.maps_link}
                  onChange={(e) => set("maps_link", e.target.value)}
                />
              </div>
              <DaysSchedulePicker
                diasFuncionamento={form.dias_funcionamento}
                onDiasChange={(v) => set("dias_funcionamento", v)}
                horarioInicio={form.horario_inicio}
                horarioFim={form.horario_fim}
                onHorarioInicioChange={(v) => set("horario_inicio", v)}
                onHorarioFimChange={(v) => set("horario_fim", v)}
                horariosEspeciais={form.horarios_especiais}
                onHorariosEspeciaisChange={(v) => set("horarios_especiais", v)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Formas de pagamento aceitas</Label>
                <Textarea
                  placeholder="Ex: Pix, cartão, boleto, 10x sem juros"
                  value={form.formas_pagamento}
                  onChange={(e) => set("formas_pagamento", e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Prazo de entrega</Label>
                <Input
                  placeholder="Ex: 7 a 15 dias úteis"
                  value={form.prazo_entrega}
                  onChange={(e) => set("prazo_entrega", e.target.value)}
                />
              </div>
              <div>
                <Label>Frete grátis acima de R$</Label>
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={form.frete_gratis_acima}
                  onChange={(e) => set("frete_gratis_acima", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer">Oferece serviço de montagem?</Label>
                <Switch
                  checked={form.montagem_disponivel}
                  onCheckedChange={(v) => set("montagem_disponivel", v)}
                />
              </div>
              <div>
                <Label>Política de troca e devolução</Label>
                <Textarea
                  placeholder="Descreva a política de troca e devolução..."
                  value={form.politica_troca}
                  onChange={(e) => set("politica_troca", e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>Regras especiais para o agente</Label>
                <Textarea
                  placeholder={"Ex:\n• Não oferecer desconto acima de 10%\n• Sempre perguntar sobre financiamento\n• Sugerir conjunto completo antes de fechar"}
                  value={form.regras_personalidade}
                  onChange={(e) => set("regras_personalidade", e.target.value)}
                  rows={5}
                />
              </div>
              <div>
                <Label>Plataforma E-commerce</Label>
                <Select value={form.plataforma_ecommerce || "nenhuma"} onValueChange={(v) => set("plataforma_ecommerce", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATAFORMA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.plataforma_ecommerce && form.plataforma_ecommerce !== "nenhuma" && (
                <div>
                  <Label>URL da sua loja online</Label>
                  <Input
                    placeholder="https://minhaloja.com.br"
                    value={form.checkout_base_url}
                    onChange={(e) => set("checkout_base_url", e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">Tudo pronto!</h3>
              <p className="text-muted-foreground max-w-sm">
                Seu assistente <strong>{form.nome_assistente_ia || "IA"}</strong> já está configurado e pronto para atender.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div>
            {step > 0 && step < 4 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
            )}
          </div>
          <div>
            {isLast ? (
              <Button onClick={handleFinish} disabled={saveStepMutation.isPending}>
                {saveStepMutation.isPending ? "Salvando..." : "Ir para o Painel"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={saveStepMutation.isPending}>
                {saveStepMutation.isPending ? "Salvando..." : "Próximo"}
                {!saveStepMutation.isPending && <ChevronRight className="ml-1 h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
