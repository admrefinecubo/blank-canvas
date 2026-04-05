import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const LEAD_STAGE_OPTIONS = [
  { value: "novo", label: "Novo Lead" },
  { value: "qualificado", label: "Qualificado" },
  { value: "orcamento", label: "Orçamento" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado_ganho", label: "Fechado ✓" },
  { value: "fechado_perdido", label: "Perdido" },
] as const;

export const VISITA_STATUS_OPTIONS = [
  { value: "agendada", label: "Agendada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

const etapaLabels: Record<string, string> = {
  novo: "Novo Lead",
  qualificado: "Qualificado",
  orcamento: "Orçamento",
  negociacao: "Negociação",
  fechado_ganho: "Fechado ✓",
  fechado_perdido: "Perdido",
};

export const getEtapaLabel = (etapa: string) => etapaLabels[etapa] ?? etapa;

export const LEAD_STAGE_LABELS = Object.fromEntries(
  LEAD_STAGE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

export const VISITA_STATUS_LABELS = Object.fromEntries(
  VISITA_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function getLeadName(nome?: string | null, telefone?: string | null) {
  return nome?.trim() || telefone?.trim() || "Lead sem nome";
}
