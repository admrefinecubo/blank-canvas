import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Store, MapPin, Truck, Bot, ShoppingCart, ChevronRight, ChevronLeft, Check } from "lucide-react";
import DaysSchedulePicker from "@/components/DaysSchedulePicker";
import type { HorariosEspeciais } from "@/lib/constants";

const REQUIRED_FIELDS = [
  "descricao_loja",
  "endereco",
  "horario_inicio",
  "horario_fim",
  "formas_pagamento",
  "nome_assistente_ia",
] as const;

const TOM_VOZ_OPTIONS = [
  { value: "amigável, profissional e consultivo", label: "Profissional e consultivo" },
  { value: "descontraído e divertido", label: "Amigável e descontraído" },
  { value: "sofisticado, elegante e consultivo", label: "Luxo e exclusivo" },
  { value: "direto e objetivo", label: "Direto e objetivo" },
];

const PLATAFORMA_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "shopify", label: "Shopify" },
  { value: "tray", label: "Tray" },
  { value: "vnda", label: "VNDA" },
  { value: "nuvemshop", label: "Nuvemshop" },
  { value: "vtex", label: "VTEX" },
];

const STEPS = [
  { title: "Identidade da Loja", icon: Store, required: true },
  { title: "Localização e Horários", icon: MapPin, required: false },
  { title: "Logística e Pagamento", icon: Truck, required: false },
  { title: "Personalidade da IA", icon: Bot, required: false },
  { title: "E-commerce", icon: ShoppingCart, required: false },
];

export function needsOnboarding(loja: Record<string, any> | null): boolean {
  if (!loja) return false;
  return REQUIRED_FIELDS.some((f) => !loja[f] || (typeof loja[f] === "string" && loja[f].trim() === ""));
}

interface Props {
  loja: Record<string, any>;
  open: boolean;
  onClose: () => void;
}

export default function LojaOnboardingWizard({ loja, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({
    nome_loja: loja.nome_loja || "",
    descricao_loja: loja.descricao_loja || "",
    especialidades: loja.especialidades || "",
    endereco: loja.endereco || "",
    maps_link: loja.maps_link || "",
    horario_inicio: loja.horario_inicio || "",
    horario_fim: loja.horario_fim || "",
    dias_funcionamento: loja.dias_funcionamento || "",
    horarios_especiais: (loja.horarios_especiais as HorariosEspeciais) || {},
    formas_pagamento: loja.formas_pagamento || "",
    prazo_entrega: loja.prazo_entrega || "",
    frete_gratis_acima: loja.frete_gratis_acima || "",
    montagem_disponivel: loja.montagem_disponivel || false,
    politica_troca: loja.politica_troca || "",
    nome_assistente_ia: loja.nome_assistente_ia || "",
    tom_voz: loja.tom_voz || "",
    regras_personalidade: loja.regras_personalidade || "",
    plataforma_ecommerce: loja.plataforma_ecommerce || "nenhuma",
    checkout_base_url: loja.checkout_base_url || "",
    ecommerce_api_key: loja.ecommerce_api_key || "",
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { ...form };
      if (payload.frete_gratis_acima === "") payload.frete_gratis_acima = null;
      else payload.frete_gratis_acima = Number(payload.frete_gratis_acima);
      if (payload.plataforma_ecommerce === "nenhuma") {
        payload.plataforma_ecommerce = null;
        payload.checkout_base_url = null;
        payload.ecommerce_api_key = null;
      }
      const { error } = await supabase.from("lojas").update(payload).eq("id", loja.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["admin-loja"] });
      toast({ title: "Configuração salva!", description: "Sua loja está pronta para operar." });
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;
  const StepIcon = STEPS[step].icon;
  const showEcommerce = form.plataforma_ecommerce && form.plataforma_ecommerce !== "nenhuma";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">{STEPS[step].title}</DialogTitle>
              <DialogDescription>Etapa {step + 1} de {STEPS.length}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Progress value={progress} className="h-1.5" />

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              <div>
                <Label>Nome da Loja</Label>
                <Input value={form.nome_loja} onChange={(e) => set("nome_loja", e.target.value)} />
              </div>
              <div>
                <Label>Descrição da Loja *</Label>
                <Textarea
                  placeholder="Descreva sua loja em 2-3 frases para a IA usar nas conversas..."
                  value={form.descricao_loja}
                  onChange={(e) => set("descricao_loja", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Especialidades</Label>
                <Input
                  placeholder="Ex: Móveis planejados, colchões, sofás"
                  value={form.especialidades}
                  onChange={(e) => set("especialidades", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <Label>Endereço *</Label>
                <Input
                  placeholder="Rua, número, bairro, cidade"
                  value={form.endereco}
                  onChange={(e) => set("endereco", e.target.value)}
                />
              </div>
              <div>
                <Label>Link Google Maps</Label>
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
                <Label>Formas de Pagamento *</Label>
                <Input
                  placeholder="Ex: PIX, cartão 12x, boleto"
                  value={form.formas_pagamento}
                  onChange={(e) => set("formas_pagamento", e.target.value)}
                />
              </div>
              <div>
                <Label>Prazo de Entrega</Label>
                <Input
                  placeholder="Ex: 7-15 dias úteis"
                  value={form.prazo_entrega}
                  onChange={(e) => set("prazo_entrega", e.target.value)}
                />
              </div>
              <div>
                <Label>Frete Grátis Acima de R$</Label>
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={form.frete_gratis_acima}
                  onChange={(e) => set("frete_gratis_acima", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer">Montagem Disponível?</Label>
                <Switch
                  checked={form.montagem_disponivel}
                  onCheckedChange={(v) => set("montagem_disponivel", v)}
                />
              </div>
              <div>
                <Label>Política de Troca</Label>
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
                <Label>Nome da Assistente IA *</Label>
                <Input
                  placeholder="Ex: Ana, Sofia, Clara"
                  value={form.nome_assistente_ia}
                  onChange={(e) => set("nome_assistente_ia", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Este nome será usado pela IA nas conversas com clientes</p>
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
              <div>
                <Label>Regras de Personalidade</Label>
                <Textarea
                  placeholder="Ex: Sempre sugerir conjunto completo, nunca oferecer desconto sem perguntar ao gerente..."
                  value={form.regras_personalidade}
                  onChange={(e) => set("regras_personalidade", e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
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
              {showEcommerce && (
                <>
                  <div>
                    <Label>URL Base do Checkout</Label>
                    <Input
                      placeholder="https://minhaloja.com.br/checkout"
                      value={form.checkout_base_url}
                      onChange={(e) => set("checkout_base_url", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>API Key do E-commerce</Label>
                    <Input
                      type="password"
                      placeholder="Chave de API da plataforma"
                      value={form.ecommerce_api_key}
                      onChange={(e) => set("ecommerce_api_key", e.target.value)}
                    />
                  </div>
                </>
              )}
              <p className="text-sm text-muted-foreground">
                Esta etapa é opcional. Você pode configurar depois em Configurações.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!STEPS[step].required && !isLast && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s + 1)}>
                Pular
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Check className="mr-1 h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Concluir"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
