import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, DollarSign, MessageSquare, StickyNote, User, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead: { label: "Novo Lead", variant: "secondary" },
  contacted: { label: "Contatado", variant: "secondary" },
  visit_scheduled: { label: "Visita Agendada", variant: "default" },
  measurement: { label: "Medição / Projeto", variant: "default" },
  budget_sent: { label: "Orçamento Enviado", variant: "default" },
  negotiation: { label: "Negociação", variant: "default" },
  approved: { label: "Aprovado / Venda", variant: "default" },
  lost: { label: "Perdido", variant: "destructive" },
  vip: { label: "VIP", variant: "default" },
};

interface TimelineItem {
  id: string;
  date: string;
  type: "appointment" | "budget" | "payment" | "note";
  title: string;
  description: string;
  status?: string;
  icon: React.ElementType;
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { clinicId } = useAuth();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("patients").select("*").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("appointments").select("*, procedures(name)").eq("patient_id", id).order("date", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["patient-budgets", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("budgets").select("*").eq("patient_id", id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: installments = [] } = useQuery({
    queryKey: ["patient-installments", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("financial_installments").select("*").eq("patient_id", id).order("due_date", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: npsResponses = [] } = useQuery({
    queryKey: ["patient-nps", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("nps_responses").select("*").eq("patient_id", id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  // Build timeline
  const timeline: TimelineItem[] = [
    ...appointments.map((a: any) => ({
      id: `apt-${a.id}`,
      date: `${a.date}T${a.time || "00:00"}`,
      type: "appointment" as const,
      title: a.procedures?.name || "Atendimento",
      description: `${a.time?.slice(0, 5) || ""} — ${a.status || "agendado"}`,
      status: a.status,
      icon: Calendar,
    })),
    ...budgets.map((b: any) => ({
      id: `bgt-${b.id}`,
      date: b.created_at,
      type: "budget" as const,
      title: `Orçamento R$ ${Number(b.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: `${b.status || "pendente"} — ${b.installments || 1}x`,
      status: b.status,
      icon: FileText,
    })),
    ...installments.map((inst: any) => ({
      id: `pay-${inst.id}`,
      date: inst.due_date,
      type: "payment" as const,
      title: `Parcela ${inst.installment_number}/${inst.total_installments}`,
      description: `R$ ${Number(inst.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${inst.status}`,
      status: inst.status,
      icon: DollarSign,
    })),
    ...npsResponses.map((n: any) => ({
      id: `nps-${n.id}`,
      date: n.created_at,
      type: "note" as const,
      title: `NPS: ${n.score}/10`,
      description: n.comment || "Sem comentário",
      icon: MessageSquare,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Cliente não encontrado</p>
          <Link to="/patients"><Button variant="outline" className="mt-4">Voltar para Clientes</Button></Link>
        </CardContent>
      </Card>
    );
  }

  const stage = STAGE_LABELS[patient.stage || "lead"] || STAGE_LABELS.lead;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/patients">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stage.variant}>{stage.label}</Badge>
            {patient.source && <span className="text-xs text-muted-foreground">Origem: {patient.source}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(patient.birth_date), "dd/MM/yyyy")}</span>
              </div>
            )}
            {patient.cpf && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>CPF: {patient.cpf}</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{patient.gender}</span>
              </div>
            )}
            {patient.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{patient.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Visitas</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Orçamentos</span>
                <span className="font-medium">{budgets.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-medium">{installments.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Histórico / Timeline</CardTitle></CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="py-12 text-center">
                <StickyNote className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">Nenhum histórico registrado ainda.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {timeline.map(item => {
                    const statusColor = item.status === "realizado" || item.status === "pago" || item.status === "aprovado"
                      ? "text-primary bg-primary/10"
                      : item.status === "cancelado" || item.status === "atrasado"
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground bg-muted";

                    return (
                      <div key={item.id} className="relative flex gap-4 pl-2">
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusColor}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{item.title}</p>
                            <time className="text-xs text-muted-foreground">
                              {format(new Date(item.date), "dd MMM yyyy", { locale: ptBR })}
                            </time>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
