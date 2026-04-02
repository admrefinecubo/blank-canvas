import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type ViewMode = "day" | "week" | "month";

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  confirmado: "bg-green-500/10 text-green-500 border-green-500/20",
  realizado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  "no-show": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function Agenda() {
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [form, setForm] = useState({ patient_id: "", procedure_id: "", date: "", time: "", duration_minutes: "60", notes: "", professional_name: "" });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-select", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("patients").select("id, name");
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures-select", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("procedures").select("id, name");
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  // Fetch team members for professional dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-for-agenda", effectiveClinicId],
    queryFn: async () => {
      if (!effectiveClinicId) return [];
      const { data } = await supabase.functions.invoke("manage-team", {
        body: { action: "list", clinic_id: effectiveClinicId },
      });
      return data?.users?.filter((u: any) => u.role === "clinic_staff" || u.role === "clinic_owner") || [];
    },
    enabled: !!effectiveClinicId,
  });

  const dateStr = currentDate.toISOString().split("T")[0];

  const monthRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [currentDate]);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", effectiveClinicId, viewMode, dateStr, monthRange.start, monthRange.end],
    queryFn: async () => {
      let q = supabase.from("appointments").select("*, patients(name), procedures(name)").order("date").order("time");
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      if (viewMode === "month") q = q.gte("date", monthRange.start).lte("date", monthRange.end);
      else q = q.eq("date", dateStr);
      const { data } = await q;
      return data || [];
    },
  });

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc: Record<string, any[]>, appointment: any) => {
      const key = appointment.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(appointment);
      return acc;
    }, {});
  }, [appointments]);

  const monthDays = useMemo(() => {
    if (viewMode !== "month") return [] as Date[];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => new Date(year, month, index - startOffset + 1));
  }, [currentDate, viewMode]);

  const selectedDayKey = selectedDay?.toISOString().split("T")[0] ?? "";
  const selectedDayAppointments = selectedDayKey ? appointmentsByDate[selectedDayKey] || [] : [];

  const openDayDetails = (date: Date) => {
    setSelectedDay(date);
  };

  const openCreateForDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, date: formattedDate }));
    setSelectedDay(null);
    setShowForm(true);
  };

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma loja");
      const { error } = await supabase.from("appointments").insert({
        clinic_id: effectiveClinicId,
        patient_id: form.patient_id,
        procedure_id: form.procedure_id || null,
        date: form.date,
        time: form.time,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        notes: form.notes || null,
        professional_name: form.professional_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setShowForm(false);
      setForm({ patient_id: "", procedure_id: "", date: "", time: "", duration_minutes: "60", notes: "", professional_name: "" });
      toast({ title: "Visita agendada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      const labels: Record<string, string> = { realizado: "Agendamento concluído!", confirmado: "Agendamento confirmado!", cancelado: "Agendamento cancelado.", "no-show": "Marcado como no-show." };
      toast({ title: labels[status] || "Status atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Agenda / Visitas</h1>
        <div className="flex flex-wrap items-center gap-3">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["day", "week", "month"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn("px-3 py-1.5 text-xs transition-colors", viewMode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
                {m === "day" ? "Dia" : m === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium min-w-[160px] text-center">
              {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button className="gap-2" onClick={() => { setForm(f => ({ ...f, date: dateStr })); setShowForm(true); }}><Plus className="h-4 w-4" /> Nova Visita</Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="border-r border-border p-3 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayKey = day.toISOString().split("T")[0];
                const dayAppointments = appointmentsByDate[dayKey] || [];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = dayKey === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => openDayDetails(day)}
                    className={cn(
                      "min-h-[148px] border-b border-r border-border p-2 text-left align-top transition-colors hover:bg-muted/40",
                      !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                          isToday && "bg-primary text-primary-foreground"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {dayAppointments.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {dayAppointments.slice(0, 3).map((appointment: any) => (
                        <div
                          key={appointment.id}
                          className="rounded-md border border-border bg-card px-2 py-1 text-xs leading-tight"
                        >
                          <div className="font-medium">{appointment.time?.slice(0, 5) || "--:--"}</div>
                          <div className="truncate text-muted-foreground">{appointment.patients?.name || "Cliente"}</div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{dayAppointments.length - 3} agendamento(s)</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma visita agendada</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Nova Visita" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Horário</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium hidden md:table-cell">Produto de Interesse</th>
                <th className="p-3 font-medium hidden lg:table-cell">Vendedor</th>
                <th className="p-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
              {appointments.map((a: any) => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="p-3 font-mono text-sm">{a.time?.slice(0, 5)}</td>
                    <td className="p-3 font-medium">{a.patients?.name || "—"}</td>
                    <td className="p-3 text-sm hidden md:table-cell">{a.procedures?.name || "—"}</td>
                    <td className="p-3 text-sm hidden lg:table-cell">{a.professional_name || "—"}</td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="cursor-pointer">
                            <Badge variant="outline" className={cn(STATUS_COLORS[a.status || "agendado"], "hover:opacity-80 transition-opacity")}>
                              {a.status || "agendado"}
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {["agendado", "confirmado", "realizado", "cancelado", "no-show"].map(s => (
                            <DropdownMenuItem key={s} disabled={a.status === s} onClick={() => updateStatusMutation.mutate({ id: a.id, status: s })}>
                              <Badge variant="outline" className={cn(STATUS_COLORS[s], "mr-2")}>{s}</Badge>
                              {s === "realizado" && <span className="text-xs text-muted-foreground ml-1">(concluir)</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Visita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              {patients.length === 0 && <p className="text-xs text-muted-foreground mt-1">Cadastre um cliente antes de agendar.</p>}
            </div>
            <div><Label>Produto de Interesse</Label>
              <Select value={form.procedure_id} onValueChange={v => setForm(f => ({ ...f, procedure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar (opcional)" /></SelectTrigger>
                <SelectContent>{procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Vendedor</Label>
              <Select value={form.professional_name} onValueChange={v => setForm(f => ({ ...f, professional_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar (opcional)" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m: any) => <SelectItem key={m.id} value={m.email}>{m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data *</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Horário *</Label><Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
            </div>
            <div><Label>Duração (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.patient_id || !form.date || !form.time || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Agendar Visita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDayAppointments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nenhum agendamento neste dia.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{appointment.time?.slice(0, 5) || "--:--"} · {appointment.patients?.name || "Cliente"}</p>
                        <p className="text-sm text-muted-foreground">{appointment.procedures?.name || "Sem produto"}</p>
                        {appointment.professional_name && (
                          <p className="text-xs text-muted-foreground">Vendedor: {appointment.professional_name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn(STATUS_COLORS[appointment.status || "agendado"])}>
                        {appointment.status || "agendado"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full" onClick={() => selectedDay && openCreateForDate(selectedDay)}>
              <Plus className="h-4 w-4" />
              Novo agendamento neste dia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
