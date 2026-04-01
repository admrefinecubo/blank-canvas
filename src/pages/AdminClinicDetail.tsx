import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, Building2, MapPin, User, Calendar,
  Eye, TrendingUp, Mail, Phone, Clock, Users, DollarSign, Wifi, WifiOff, History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  inativa: { label: "Inativa", className: "bg-muted text-muted-foreground border-border" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ACTION_COLORS: Record<string, string> = { INSERT: "bg-green-500/10 text-green-500", UPDATE: "bg-blue-500/10 text-blue-500", DELETE: "bg-destructive/10 text-destructive" };
const TABLE_LABELS: Record<string, string> = { patients: "Clientes", appointments: "Visitas", budgets: "Orçamentos", financial_installments: "Financeiro" };

export default function AdminClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { impersonateClinic } = useAuth();

  const { data: clinic, isLoading } = useQuery({
    queryKey: ["admin-clinic", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("clinics").select("*").eq("id", id).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["admin-clinic-patients", id],
    queryFn: async () => { const { data } = await supabase.from("patients").select("id, stage, created_at").eq("clinic_id", id!); return data || []; },
    enabled: !!id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["admin-clinic-appointments", id],
    queryFn: async () => { const { data } = await supabase.from("appointments").select("id, status, date").eq("clinic_id", id!); return data || []; },
    enabled: !!id,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["admin-clinic-budgets", id],
    queryFn: async () => { const { data } = await supabase.from("budgets").select("id, status, total").eq("clinic_id", id!); return data || []; },
    enabled: !!id,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["admin-clinic-integrations", id],
    queryFn: async () => { const { data } = await supabase.from("clinic_integrations").select("provider, status").eq("clinic_id", id!); return data || []; },
    enabled: !!id,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin-clinic-logs", id],
    queryFn: async () => { const { data } = await supabase.from("audit_logs").select("*").eq("clinic_id", id!).order("created_at", { ascending: false }).limit(20); return data || []; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!clinic) return <div className="flex h-screen items-center justify-center bg-background"><div className="text-center space-y-4"><p className="text-lg text-muted-foreground">Loja não encontrada</p><Button variant="outline" onClick={() => navigate("/admin")}><ChevronLeft className="mr-2 h-4 w-4" />Voltar</Button></div></div>;

  const statusInfo = STATUS_MAP[clinic.status as string] || STATUS_MAP.ativa;
  const totalRevenue = budgets.filter(b => b.status === "aprovado").reduce((s, b) => s + Number(b.total || 0), 0);
  const conversionRate = budgets.length > 0 ? ((budgets.filter(b => b.status === "aprovado").length / budgets.length) * 100).toFixed(1) : "0";
  const whatsapp = integrations.find((i: any) => i.provider === "evolution_api");
  const gcal = integrations.find((i: any) => i.provider === "google_calendar");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><span className="text-sm font-bold text-primary-foreground">C</span></div>
            <div><span className="text-lg font-bold tracking-tight">CUBO</span><span className="ml-1 text-xs text-muted-foreground">Admin</span></div>
          </Link>
        </div>
        <div className="flex-1 px-2 py-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => navigate("/admin")}><ChevronLeft className="h-4 w-4" />Voltar para Lojas</Button>
        </div>
        <div className="border-t border-border px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3 w-3" />Voltar ao CRM</Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground">Admin</Link><span>/</span>
            <Link to="/admin" className="hover:text-foreground">Lojas</Link><span>/</span>
            <span className="text-foreground">{clinic.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-7 w-7 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{clinic.name}</h1><Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge></div>
                  <p className="text-sm text-muted-foreground">{clinic.owner_name} · {clinic.city || "—"}{clinic.state ? `, ${clinic.state}` : ""}</p>
                </div>
              </div>
              <Button onClick={() => { impersonateClinic(clinic.id); navigate("/dashboard"); }} className="gap-2"><Eye className="h-4 w-4" />Entrar no CRM</Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-xs">Leads</span></div><p className="mt-1 text-2xl font-bold">{patients.length}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-xs">Visitas</span></div><p className="mt-1 text-2xl font-bold">{appointments.length}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /><span className="text-xs">Faturamento</span></div><p className="mt-1 text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">Conversão</span></div><p className="mt-1 text-2xl font-bold">{conversionRate}%</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">Orçamentos</span></div><p className="mt-1 text-2xl font-bold">{budgets.length}</p></CardContent></Card>
            </div>

            {/* Integrations Health */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Integrações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {whatsapp?.status === "connected" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground/40" />}
                    <span className="text-sm font-medium">WhatsApp (Evolution API)</span>
                  </div>
                  <Badge variant="outline" className={whatsapp?.status === "connected" ? "text-green-500 border-green-500/20" : "text-muted-foreground"}>
                    {whatsapp?.status === "connected" ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {gcal?.status === "connected" ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground/40" />}
                    <span className="text-sm font-medium">Google Calendar</span>
                  </div>
                  <Badge variant="outline" className={gcal?.status === "connected" ? "text-green-500 border-green-500/20" : "text-muted-foreground"}>
                    {gcal?.status === "connected" ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Informações da Loja</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Proprietário</p><p className="text-sm font-medium">{clinic.owner_name}</p></div></div>
                <Separator />
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">E-mail</p><p className="text-sm">{clinic.owner_email}</p></div></div>
                <Separator />
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm">{clinic.phone || "—"}</p></div></div>
                <Separator />
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Localização</p><p className="text-sm">{clinic.city || "—"}{clinic.state ? `, ${clinic.state}` : ""}</p></div></div>
                <Separator />
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Cadastro</p><p className="text-sm">{new Date(clinic.created_at).toLocaleDateString("pt-BR")}</p></div></div>
                {clinic.notes && (<><Separator /><div><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm">{clinic.notes}</p></div></>)}
              </CardContent>
            </Card>

            {/* Audit Logs */}
            {auditLogs.length > 0 && (
              <Card>
                <CardHeader><div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Atividade Recente</CardTitle></div></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                        <Badge variant="outline" className={ACTION_COLORS[log.action]}>{log.action}</Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                            <span className="text-xs text-muted-foreground">por {log.user_email || "sistema"}</span>
                          </div>
                          {log.action === "INSERT" && log.new_data?.name && <p className="text-xs text-muted-foreground mt-1">Nome: {log.new_data.name}</p>}
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</time>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
