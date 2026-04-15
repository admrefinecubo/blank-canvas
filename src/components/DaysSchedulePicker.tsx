import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { WEEKDAYS, type HorariosEspeciais } from "@/lib/constants";
import { useState } from "react";

interface Props {
  diasFuncionamento: string;
  onDiasChange: (dias: string) => void;
  horarioInicio: string;
  horarioFim: string;
  onHorarioInicioChange: (v: string) => void;
  onHorarioFimChange: (v: string) => void;
  horariosEspeciais: HorariosEspeciais;
  onHorariosEspeciaisChange: (h: HorariosEspeciais) => void;
}

export default function DaysSchedulePicker({
  diasFuncionamento,
  onDiasChange,
  horarioInicio,
  horarioFim,
  onHorarioInicioChange,
  onHorarioFimChange,
  horariosEspeciais,
  onHorariosEspeciaisChange,
}: Props) {
  const dias = diasFuncionamento.split(",").map((d) => d.trim()).filter(Boolean);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    return new Set(Object.keys(horariosEspeciais || {}));
  });

  const toggleDay = (dayValue: string, checked: boolean) => {
    const next = checked
      ? [...dias, dayValue]
      : dias.filter((d) => d !== dayValue);
    const ordered = WEEKDAYS.map((w) => w.value).filter((w) => next.includes(w));
    onDiasChange(ordered.join(","));

    // Remove special hours if day is unchecked
    if (!checked && horariosEspeciais[dayValue]) {
      const updated = { ...horariosEspeciais };
      delete updated[dayValue];
      onHorariosEspeciaisChange(updated);
      setExpandedDays((s) => { const n = new Set(s); n.delete(dayValue); return n; });
    }
  };

  const toggleSpecialHour = (dayValue: string) => {
    if (expandedDays.has(dayValue)) {
      setExpandedDays((s) => { const n = new Set(s); n.delete(dayValue); return n; });
      const updated = { ...horariosEspeciais };
      delete updated[dayValue];
      onHorariosEspeciaisChange(updated);
    } else {
      setExpandedDays((s) => new Set(s).add(dayValue));
      onHorariosEspeciaisChange({
        ...horariosEspeciais,
        [dayValue]: { inicio: horarioInicio || "08:00", fim: horarioFim || "18:00" },
      });
    }
  };

  const setSpecialHour = (dayValue: string, field: "inicio" | "fim", value: string) => {
    onHorariosEspeciaisChange({
      ...horariosEspeciais,
      [dayValue]: { ...horariosEspeciais[dayValue], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Horário Geral - Abertura</Label>
          <Input type="time" value={horarioInicio} onChange={(e) => onHorarioInicioChange(e.target.value)} />
        </div>
        <div>
          <Label>Horário Geral - Fechamento</Label>
          <Input type="time" value={horarioFim} onChange={(e) => onHorarioFimChange(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Dias de Funcionamento</Label>
        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const checked = dias.includes(day.value);
            const hasSpecial = expandedDays.has(day.value);
            return (
              <div key={day.value} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleDay(day.value, !!v)}
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                  {checked && (
                    <Button
                      type="button"
                      variant={hasSpecial ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => toggleSpecialHour(day.value)}
                    >
                      <Clock className="h-3 w-3" />
                      {hasSpecial ? "Remover horário especial" : "Horário especial"}
                    </Button>
                  )}
                </div>
                {checked && hasSpecial && (
                  <div className="mt-2 ml-6 flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-28 h-8 text-xs"
                      value={horariosEspeciais[day.value]?.inicio || ""}
                      onChange={(e) => setSpecialHour(day.value, "inicio", e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input
                      type="time"
                      className="w-28 h-8 text-xs"
                      value={horariosEspeciais[day.value]?.fim || ""}
                      onChange={(e) => setSpecialHour(day.value, "fim", e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
