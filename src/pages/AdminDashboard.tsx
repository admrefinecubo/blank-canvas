import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2, TrendingDown, AlertTriangle,
  Search, Eye, ChevronRight, Users, BarChart3,
  LayoutDashboard, ChevronLeft, Plus, Upload,
  Calendar, DollarSign, TrendingUp, Wifi, WifiOff, History,
  Edit, CheckCircle, XCircle, Loader2, Ban, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Clinic {
  id: string; name: string; status: "ativa" | "inativa" | "cancelada";
  city: string | null; state: string | null; owner_name: string; owner_email: string;
  phone: string | null; email: string | null; primary_color: string | null;
  logo_url: string | null; notes: string | null; created_at: string;
}

interface LojaSummary {
  id: string;
  clinic_id: string | null;
}

const STATUS_COLORS = {
  ativa: "bg-green-500/10 text-green-500 border-green-500/20",
  inativa: "bg-muted text-muted-foreground border-border",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "clinics" | "metrics" | "activity">("dashboard");
  const [search, setSearch] = useState("");
  const [newClinicOpen, setNewClinicOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [newClinic, setNewClinic] = useState({
    name: "", city: "", state: "", phone: "", email: "",
    ownerName: "", ownerEmail: "", ownerPassword: "", primaryColor: "24 95% 53%", notes: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ===== Queries =====
  const { data: clinics = [], isLoading: loadingClinics } = useQuery({
    queryKey: ["admin-clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Clinic[]) || [];
    },
  });

  const { data: allPatients = [] } = useQuery({
    queryKey: ["admin-all-patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, clinic_id, created_at, stage");
      return data || [];
    },
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ["admin-all-appointments"],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("id, clinic_id, date, status");
      return data || [];
    },
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ["admin-all-budgets"],
    queryFn: async () => {
      const { data } = await supabase.from("budgets").select("id, clinic_id, status, total, created_at");
      return data || [];
    },
  });

  const { data: allIntegrations = [] } = useQuery({
    queryKey: ["admin-all-integrations"],
    queryFn: async () => {
      const { data } = await supabase.from("clinic_integrations").select("clinic_id, provider, status");
      return data || [];
    },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: activeTab === "activity" || activeTab === "dashboard",
  });

  const { data: lojas = [] } = useQuery({
    queryKey: ["admin-lojas-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lojas").select("id, clinic_id");
      if (error) throw error;
      return (data as LojaSummary[]) || [];
    },
  });

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newClinic.name || !newClinic.ownerName || !newClinic.ownerEmail || !newClinic.ownerPassword) {
        throw new Error("Preencha os campos obrigatórios");
      }

      const { data: clinic, error } = await supabase.from("clinics").insert({
        name: newClinic.name, city: newClinic.city || null, state: newClinic.state || null,
        phone: newClinic.phone || null, email: newClinic.email || null,
        owner_name: newClinic.ownerName, owner_email: newClinic.ownerEmail,
        primary_color: newClinic.primaryColor || null, notes: newClinic.notes || null,
      }).select("id").single();
      if (error) throw error;

      const { data: provisionData, error: provisionError } = await supabase.functions.invoke("manage-team", {
        body: {
          action: "create",
          email: newClinic.ownerEmail,
          password: newClinic.ownerPassword,
          role: "clinic_owner",
          clinic_id: clinic.id,
          display_name: newClinic.ownerName,
        },
      });

      if (provisionError || provisionData?.error) {
        await supabase.from("clinics").delete().eq("id", clinic.id);
        throw new Error(provisionData?.error || provisionError?.message || "Falha ao criar acesso do proprietário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lojas-summary"] });
      setNewClinicOpen(false);
      setNewClinic({ name: "", city: "", state: "", phone: "", email: "", ownerName: "", ownerEmail: "", ownerPassword: "", primaryColor: "24 95% 53%", notes: "" });
      setLogoPreview(null);
      toast.success("Conta criada com acesso do proprietário liberado.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Clinic["status"] }) => {
      const { error } = await supabase.from("clinics").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-clinics"] }); toast.success("Status atualizado!"); },
  });

  const updateClinicMutation = useMutation({
    mutationFn: async (clinic: Partial<Clinic> & { id: string }) => {
      const { id, ...updates } = clinic;
      const { error } = await supabase.from("clinics").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lojas-summary"] });
      setEditingClinic(null);
      toast.success("Conta atualizada!");
    },
  });

  const banClinicMutation = useMutation({
    mutationFn: async ({ clinic_id, ban }: { clinic_id: string; ban: boolean }) => {
      const { data, error } = await supabase.functions.invoke("manage-team", {
        body: { action: ban ? "ban_clinic" : "unban_clinic", clinic_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lojas-summary"] });
      toast.success(vars.ban
        ? `Conta bloqueada! ${data.banned_count} usuário(s) banido(s).`
        : `Conta desbloqueada! ${data.unbanned_count} usuário(s) reativado(s).`
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeClinics = clinics.filter(c => c.status === "ativa").length;
  const operationalStores = lojas.length;
  const clinicsWithoutStore = clinics.filter(c => !lojas.some(loja => loja.clinic_id === c.id)).length;
  const canceladas = clinics.filter(c => c.status === "cancelada").length;
  const totalLeads = allPatients.length;
  const totalAppointments = allAppointments.length;
  const totalRevenue = allBudgets.filter(b => b.status === "aprovado").reduce((s, b) => s + Number(b.total || 0), 0);

  const filteredClinics = clinics.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  // Per-clinic metrics for ranking
  const clinicMetrics = clinics.map(c => {
    const patients = allPatients.filter(p => p.clinic_id === c.id).length;
    const appointments = allAppointments.filter(a => a.clinic_id === c.id).length;
    const revenue = allBudgets.filter(b => b.clinic_id === c.id && b.status === "aprovado").reduce((s, b) => s + Number(b.total || 0), 0);
    const budgets = allBudgets.filter(b => b.clinic_id === c.id).length;
    const whatsapp = allIntegrations.find(i => i.clinic_id === c.id && i.provider === "evolution_api");
    const gcal = allIntegrations.find(i => i.clinic_id === c.id && i.provider === "google_calendar");
    return { ...c, patients, appointments, revenue, budgets, whatsappConnected: whatsapp?.status === "connected", gcalConnected: gcal?.status === "connected" };
  });

  const rankingByPatients = [...clinicMetrics].sort((a, b) => b.patients - a.patients);
  const rankingChart = rankingByPatients.slice(0, 10).map(c => ({ name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name, clientes: c.patients, visitas: c.appointments }));

  // Churn risk: clinics with 0 appointments or inactive
  const churnRisk = clinicMetrics.filter(c => c.status !== "cancelada" && (c.appointments === 0 || c.patients === 0));

  const TABLE_LABELS: Record<string, string> = { patients: "Clientes", appointments: "Visitas", budgets: "Orçamentos", financial_installments: "Financeiro" };
  const ACTION_COLORS: Record<string, string> = { INSERT: "bg-green-500/10 text-green-500", UPDATE: "bg-blue-500/10 text-blue-500", DELETE: "bg-destructive/10 text-destructive" };

  const adminNavItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "clinics" as const, label: "Contas", icon: Building2 },
    { id: "metrics" as const, label: "Métricas de Uso", icon: BarChart3 },
    { id: "activity" as const, label: "Atividade", icon: History },
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setLogoPreview(reader.result as string); reader.readAsDataURL(file); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Visão geral da operação</h1>
            <Badge variant="outline">{adminNavItems.find(i => i.id === activeTab)?.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Separe contas de clientes e lojas operacionais para evitar leitura errada do estado do sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {adminNavItems.map(item => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao CRM
            </Link>
          </Button>
        </div>
      </div>

      {/* ========== DASHBOARD ========== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Contas Ativas</p><p className="text-2xl font-bold">{activeClinics}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lojas Operacionais</p><p className="text-2xl font-bold">{operationalStores}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Contas sem Loja</p><p className="text-2xl font-bold">{clinicsWithoutStore}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{totalLeads}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Visitas</p><p className="text-2xl font-bold">{totalAppointments}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Faturamento Total</p><p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Canceladas</p><p className="text-2xl font-bold text-destructive">{canceladas}</p></CardContent></Card>
              </div>

              {/* Quick Clinic Table */}
              {clinics.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Contas — Visão Geral</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left text-muted-foreground">
                         <th className="pb-3 font-medium">Conta</th><th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Leads</th><th className="pb-3 font-medium">Visitas</th>
                        <th className="pb-3 font-medium">Fatur.</th><th className="pb-3 font-medium">WhatsApp</th><th className="pb-3 font-medium">Calendar</th>
                      </tr></thead>
                      <tbody>{clinicMetrics.map(c => (
                        <tr key={c.id} className="border-b border-border/50">
                          <td className="py-3"><Link to={`/admin/clinic/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link></td>
                          <td className="py-3"><Badge variant="outline" className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                          <td className="py-3">{c.patients}</td>
                          <td className="py-3">{c.appointments}</td>
                          <td className="py-3 font-medium">R$ {c.revenue.toLocaleString("pt-BR")}</td>
                          <td className="py-3">{c.whatsappConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground/40" />}</td>
                          <td className="py-3">{c.gcalConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground/40" />}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {auditLogs.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Atividade Recente</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditLogs.slice(0, 5).map((log: any) => {
                        const clinicName = clinics.find(c => c.id === log.clinic_id)?.name || "—";
                        return (
                          <div key={log.id} className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className={cn("text-[10px]", ACTION_COLORS[log.action])}>{log.action}</Badge>
                            <span className="text-muted-foreground">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                            <span className="text-xs text-muted-foreground">· {clinicName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{format(new Date(log.created_at), "dd/MM HH:mm")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
        </div>
      )}

      {/* ========== CLINICS ========== */}
      {activeTab === "clinics" && (
        <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestão de Contas</h2>
                <Dialog open={newClinicOpen} onOpenChange={setNewClinicOpen}>
                  <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova Conta</Button></DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader><DialogTitle>Cadastrar Nova Conta</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-2">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados da Conta</p>
                        <div><Label>Nome da Conta *</Label><Input placeholder="Ex: Conforto SP" value={newClinic.name} onChange={e => setNewClinic(p => ({ ...p, name: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Cidade</Label><Input placeholder="São Paulo" value={newClinic.city} onChange={e => setNewClinic(p => ({ ...p, city: e.target.value }))} /></div>
                          <div><Label>Estado</Label><Input placeholder="SP" maxLength={2} value={newClinic.state} onChange={e => setNewClinic(p => ({ ...p, state: e.target.value.toUpperCase() }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Telefone</Label><Input placeholder="(11) 99999-0000" value={newClinic.phone} onChange={e => setNewClinic(p => ({ ...p, phone: e.target.value }))} /></div>
                          <div><Label>E-mail</Label><Input type="email" placeholder="contato@cliente.com" value={newClinic.email} onChange={e => setNewClinic(p => ({ ...p, email: e.target.value }))} /></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proprietário</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Nome *</Label><Input placeholder="Fulano da Silva" value={newClinic.ownerName} onChange={e => setNewClinic(p => ({ ...p, ownerName: e.target.value }))} /></div>
                          <div><Label>E-mail de Acesso *</Label><Input type="email" placeholder="fulano@cliente.com" value={newClinic.ownerEmail} onChange={e => setNewClinic(p => ({ ...p, ownerEmail: e.target.value }))} /></div>
                        </div>
                        <div><Label>Senha Inicial *</Label><Input type="password" placeholder="Mínimo 6 caracteres" value={newClinic.ownerPassword} onChange={e => setNewClinic(p => ({ ...p, ownerPassword: e.target.value }))} /></div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identidade Visual</p>
                        <div className="flex items-center gap-4">
                          <div onClick={() => logoInputRef.current?.click()} className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-accent/30 overflow-hidden hover:border-primary/50">
                            {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <div className="flex flex-col items-center gap-1"><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Logo</span></div>}
                          </div>
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          <div className="flex-1 space-y-2">
                            <Label>Cor Primária (HSL)</Label>
                            <Input placeholder="24 95% 53%" value={newClinic.primaryColor} onChange={e => setNewClinic(p => ({ ...p, primaryColor: e.target.value }))} />
                            <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-md border border-border" style={{ backgroundColor: `hsl(${newClinic.primaryColor})` }} /><span className="text-[11px] text-muted-foreground">Preview</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</p><Textarea placeholder="Notas internas..." rows={3} value={newClinic.notes} onChange={e => setNewClinic(p => ({ ...p, notes: e.target.value }))} /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? "Criando..." : "Criar Conta"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex gap-2">
                 <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 w-64 bg-background pl-9 text-sm" placeholder="Buscar conta..." value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>

              <Card><CardContent className="pt-6 overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Conta</th><th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Cidade</th><th className="pb-3 font-medium">Proprietário</th>
                  <th className="pb-3 font-medium">Leads</th><th className="pb-3 font-medium">Integrações</th>
                  <th className="pb-3 font-medium">Ações</th>
                </tr></thead>
                <tbody>{loadingClinics ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filteredClinics.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma conta encontrada</td></tr>
                ) : filteredClinics.map(c => {
                  const m = clinicMetrics.find(cm => cm.id === c.id);
                  return (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-3"><div><span className="font-medium">{c.name}</span><p className="text-xs text-muted-foreground">{c.owner_email}</p></div></td>
                      <td className="py-3">
                        <Select value={c.status} onValueChange={v => updateStatusMutation.mutate({ id: c.id, status: v as Clinic["status"] })}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativa"><span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Ativa</span></SelectItem>
                            <SelectItem value="inativa"><span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-muted-foreground" />Inativa</span></SelectItem>
                            <SelectItem value="cancelada"><span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />Cancelada</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 text-muted-foreground">{c.city || "—"}{c.state ? `, ${c.state}` : ""}</td>
                      <td className="py-3">{c.owner_name}</td>
                      <td className="py-3">{m?.patients || 0}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          <div title="WhatsApp">{m?.whatsappConnected ? <Wifi className="h-3.5 w-3.5 text-green-500" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground/40" />}</div>
                          <div title="Calendar">{m?.gcalConnected ? <Wifi className="h-3.5 w-3.5 text-green-500" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground/40" />}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingClinic(c)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" asChild><Link to={`/admin/clinic/${c.id}`}><Eye className="mr-1 h-3 w-3" />Ver</Link></Button>
                          {c.status === "ativa" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10"
                              disabled={banClinicMutation.isPending}
                              onClick={() => { if (confirm(`Bloquear todos os logins da loja "${c.name}"?`)) banClinicMutation.mutate({ clinic_id: c.id, ban: true }); }}>
                              <Ban className="mr-1 h-3 w-3" />Bloquear
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10"
                              disabled={banClinicMutation.isPending}
                              onClick={() => banClinicMutation.mutate({ clinic_id: c.id, ban: false })}>
                              <ShieldCheck className="mr-1 h-3 w-3" />Reativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table></CardContent></Card>
        </div>
      )}

      {/* ========== METRICS ========== */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
              <h1 className="text-2xl font-bold">Métricas de Uso</h1>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Total Leads</p></div><p className="text-2xl font-bold">{totalLeads}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Visitas</p></div><p className="text-2xl font-bold">{totalAppointments}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Faturamento</p></div><p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><p className="text-sm text-muted-foreground">Orçamentos</p></div><p className="text-2xl font-bold">{allBudgets.length}</p></CardContent></Card>
              </div>

              {/* Ranking Chart */}
              {rankingChart.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Ranking — Clientes e Visitas por Loja</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={rankingChart} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={130} />
                        <Tooltip />
                        <Bar dataKey="clientes" name="Clientes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="visitas" name="Visitas" fill="hsl(var(--primary) / 0.4)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Integration Health */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Status das Integrações por Loja</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Loja</th><th className="pb-3 font-medium">WhatsApp</th><th className="pb-3 font-medium">Google Calendar</th>
                    </tr></thead>
                    <tbody>{clinicMetrics.map(c => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium">{c.name}</td>
                        <td className="py-2.5">{c.whatsappConnected ? <Badge variant="outline" className="text-green-500 border-green-500/20 text-[10px]">Conectado</Badge> : <Badge variant="outline" className="text-muted-foreground text-[10px]">Desconectado</Badge>}</td>
                        <td className="py-2.5">{c.gcalConnected ? <Badge variant="outline" className="text-green-500 border-green-500/20 text-[10px]">Conectado</Badge> : <Badge variant="outline" className="text-muted-foreground text-[10px]">Desconectado</Badge>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Churn Risk */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Lojas com Baixo Uso (Risco de Churn)</CardTitle></CardHeader>
                <CardContent>
                  {churnRisk.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma loja com baixo uso no momento. 🎉</p>
                  ) : (
                    <div className="space-y-2">{churnRisk.map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div><span className="font-medium text-sm">{c.name}</span><p className="text-xs text-muted-foreground">{c.patients} leads · {c.appointments} visitas</p></div>
                        <Badge variant="outline" className="border-destructive/20 text-destructive"><AlertTriangle className="mr-1 h-3 w-3" />Risco</Badge>
                      </div>
                    ))}</div>
                  )}
                </CardContent>
              </Card>
        </div>
      )}

      {/* ========== ACTIVITY ========== */}
      {activeTab === "activity" && (
        <div className="space-y-6">
              <h1 className="text-2xl font-bold">Atividade Recente — Todas as Lojas</h1>
              {auditLogs.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><History className="mx-auto h-12 w-12 text-muted-foreground/30" /><p className="mt-4 text-muted-foreground">Nenhuma atividade registrada.</p></CardContent></Card>
              ) : (
                <Card><CardContent className="pt-6">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {auditLogs.map((log: any) => {
                      const clinicName = clinics.find(c => c.id === log.clinic_id)?.name || "—";
                      return (
                        <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                          <Badge variant="outline" className={ACTION_COLORS[log.action]}>{log.action}</Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                              <Badge variant="secondary" className="text-[10px]">{clinicName}</Badge>
                              <span className="text-xs text-muted-foreground">por {log.user_email || "sistema"}</span>
                            </div>
                            {log.action === "UPDATE" && log.old_data && log.new_data && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {Object.keys(log.new_data).filter(k => JSON.stringify(log.old_data[k]) !== JSON.stringify(log.new_data[k]) && k !== "updated_at").slice(0, 3).map(k => `${k}: ${log.old_data[k]} → ${log.new_data[k]}`).join(", ")}
                              </p>
                            )}
                            {log.action === "INSERT" && log.new_data?.name && <p className="text-xs text-muted-foreground mt-1">Nome: {log.new_data.name}</p>}
                          </div>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</time>
                        </div>
                      );
                    })}
                  </div>
                </CardContent></Card>
              )}
        </div>
      )}

      {/* Edit Clinic Dialog */}
      <Dialog open={!!editingClinic} onOpenChange={open => !open && setEditingClinic(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar Loja — {editingClinic?.name}</DialogTitle></DialogHeader>
          {editingClinic && (
            <div className="space-y-4">
              <div><Label>Nome</Label><Input defaultValue={editingClinic.name} onChange={e => setEditingClinic(c => c ? { ...c, name: e.target.value } : null)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cidade</Label><Input defaultValue={editingClinic.city || ""} onChange={e => setEditingClinic(c => c ? { ...c, city: e.target.value } : null)} /></div>
                <div><Label>Estado</Label><Input defaultValue={editingClinic.state || ""} maxLength={2} onChange={e => setEditingClinic(c => c ? { ...c, state: e.target.value.toUpperCase() } : null)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone</Label><Input defaultValue={editingClinic.phone || ""} onChange={e => setEditingClinic(c => c ? { ...c, phone: e.target.value } : null)} /></div>
                <div><Label>E-mail</Label><Input defaultValue={editingClinic.email || ""} onChange={e => setEditingClinic(c => c ? { ...c, email: e.target.value } : null)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Proprietário</Label><Input defaultValue={editingClinic.owner_name} onChange={e => setEditingClinic(c => c ? { ...c, owner_name: e.target.value } : null)} /></div>
                <div><Label>E-mail Proprietário</Label><Input defaultValue={editingClinic.owner_email} onChange={e => setEditingClinic(c => c ? { ...c, owner_email: e.target.value } : null)} /></div>
              </div>
              <div><Label>Observações</Label><Textarea defaultValue={editingClinic.notes || ""} onChange={e => setEditingClinic(c => c ? { ...c, notes: e.target.value } : null)} /></div>
              <Button className="w-full" onClick={() => editingClinic && updateClinicMutation.mutate(editingClinic)} disabled={updateClinicMutation.isPending}>
                {updateClinicMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
