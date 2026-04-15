export const WEEKDAYS = [
  { value: "dom", label: "Domingo" },
  { value: "seg", label: "Segunda-feira" },
  { value: "ter", label: "Terça-feira" },
  { value: "qua", label: "Quarta-feira" },
  { value: "qui", label: "Quinta-feira" },
  { value: "sex", label: "Sexta-feira" },
  { value: "sab", label: "Sábado" },
] as const;

export type HorarioEspecial = { inicio: string; fim: string };
export type HorariosEspeciais = Record<string, HorarioEspecial>;
