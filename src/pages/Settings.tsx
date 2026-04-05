import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WifiOff, Wifi, Plus, Trash2, UserPlus, Users, Shield, FileText, Calendar, Bot, Loader2, Target, History, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  clinic_owner: "Proprietário",
  clinic_staff: "Vendedor",
  clinic_receptionist: "Recepcionista",
};

// ===================== LGPD Tab =====================
function LgpdTab({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [termContent, setTermContent] = useState("");
  const [termTitle, setTermTitle] = useState("Termo de Consentimento");

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ["consent-terms", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("consent_terms").select("*").eq("clinic_id", clinicId).order("version", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const activeTerm = terms.find((t: any) => t.active);

  useEffect(() => {
    if (activeTerm) { setTermContent(activeTerm.content); setTermTitle(activeTerm.title); }
  }, [activeTerm]);

  const { data: consents = [] } = useQuery({
    queryKey: ["patient-consents", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("patient_consents").select("*, patients(name)").eq("clinic_id", clinicId).order("consented_at", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      if (activeTerm) await supabase.from("consent_terms").update({ active: false }).eq("clinic_id", clinicId);
      const nextVersion = (terms[0]?.version || 0) + 1;
      const { error } = await supabase.from("consent_terms").insert({ clinic_id: clinicId, title: termTitle, content: termContent, version: nextVersion, active: true });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consent-terms"] }); toast({ title: "Termo salvo com sucesso!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

   if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Termos de Consentimento LGPD</CardTitle></div></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Título do Termo</Label><Input value={termTitle} onChange={e => setTermTitle(e.target.value)} placeholder="Ex: Termo de Consentimento para Tratamento" /></div>
          <div><Label>Conteúdo do Termo</Label><Textarea value={termContent} onChange={e => setTermContent(e.target.value)} placeholder="Escreva aqui o texto do termo..." className="min-h-[200px]" /></div>
          {activeTerm && <p className="text-xs text-muted-foreground">Versão atual: v{activeTerm.version} — Salvar criará uma nova versão.</p>}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !termContent.trim()}>{saveMutation.isPending ? "Salvando..." : activeTerm ? "Salvar Nova Versão" : "Criar Termo"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Registros de Consentimento</CardTitle></div></CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="py-8 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Nenhum consentimento registrado.</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>{consents.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.patients?.name || "—"}</TableCell>
                  <TableCell className="capitalize">{c.consent_type === "treatment" ? "Tratamento" : c.consent_type === "marketing" ? "Marketing" : "Compartilhamento"}</TableCell>
                  <TableCell><Badge variant={c.consented ? (c.revoked_at ? "destructive" : "default") : "secondary"}>{c.revoked_at ? "Revogado" : c.consented ? "Consentido" : "Recusado"}</Badge></TableCell>
                  <TableCell>{new Date(c.consented_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ===================== Integrations Tab =====================
function IntegrationsTab({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [gcalForm, setGcalForm] = useState({ api_key: "", calendar_id: "" });
  const [showGcalSetup, setShowGcalSetup] = useState(false);

  const { data: evolutionStatus } = useQuery({
    queryKey: ["evolution-status-settings", clinicId],
    queryFn: async () => { if (!clinicId) return { status: "disconnected" }; const { data } = await supabase.functions.invoke("evolution-api", { body: { action: "status", clinic_id: clinicId } }); return data || { status: "disconnected" }; },
    enabled: !!clinicId,
  });

  const { data: gcalStatus } = useQuery({
    queryKey: ["gcal-status", clinicId],
    queryFn: async () => { if (!clinicId) return { status: "disconnected" }; const { data } = await supabase.functions.invoke("google-calendar", { body: { action: "status", clinic_id: clinicId } }); return data || { status: "disconnected" }; },
    enabled: !!clinicId,
  });

  const connectGcalMutation = useMutation({
    mutationFn: async () => { const { data, error } = await supabase.functions.invoke("google-calendar", { body: { action: "connect", clinic_id: clinicId, ...gcalForm } }); if (error) throw error; if (data?.error) throw new Error(data.error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gcal-status"] }); setShowGcalSetup(false); setGcalForm({ api_key: "", calendar_id: "" }); toast({ title: "Google Calendar conectado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const disconnectGcalMutation = useMutation({
    mutationFn: async () => { const { data, error } = await supabase.functions.invoke("google-calendar", { body: { action: "disconnect", clinic_id: clinicId } }); if (error) throw error; if (data?.error) throw new Error(data.error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gcal-status"] }); toast({ title: "Google Calendar desconectado" }); },
  });

  const evConnected = evolutionStatus?.status === "connected";
  const gcConnected = gcalStatus?.status === "connected";

  return (
    <>
      <Card className="bg-card">
        <CardHeader><CardTitle className="text-sm">Integrações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {evConnected ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-destructive" />}
              <div><p className="text-sm font-medium">WhatsApp (Evolution API)</p><p className="text-xs text-muted-foreground">{evConnected ? `Conectado — ${evolutionStatus?.instance || ""}` : "Não conectado"}</p></div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/whatsapp")}>{evConnected ? "Gerenciar" : "Configurar"}</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {gcConnected ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-destructive" />}
              <div><p className="text-sm font-medium">Google Calendar</p><p className="text-xs text-muted-foreground">{gcConnected ? `Conectado — ${gcalStatus?.calendar_id || ""}` : "Não conectado"}</p></div>
            </div>
            {gcConnected ? (
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => disconnectGcalMutation.mutate()}>Desconectar</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowGcalSetup(true)}>Configurar</Button>
            )}
          </div>
        </CardContent>
      </Card>
      {!gcConnected && (
        <Card className="bg-card">
          <CardHeader><CardTitle className="text-sm">Como conectar o Google Calendar</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></p>
            <p>2. Crie um projeto e ative a <strong>Google Calendar API</strong></p>
            <p>3. Crie uma <strong>API Key</strong> em Credenciais</p>
            <p>4. No Google Calendar, vá em Configurações do calendário → Integrar calendário → copie o <strong>ID do calendário</strong></p>
            <p>5. Torne o calendário <strong>público</strong> (Configurações → Permissões de acesso)</p>
          </CardContent>
        </Card>
      )}
      <Dialog open={showGcalSetup} onOpenChange={setShowGcalSetup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conectar Google Calendar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>API Key do Google *</Label><Input type="password" placeholder="AIza..." value={gcalForm.api_key} onChange={e => setGcalForm(f => ({ ...f, api_key: e.target.value }))} /></div>
            <div><Label>ID do Calendário *</Label><Input placeholder="seuemail@gmail.com ou ID" value={gcalForm.calendar_id} onChange={e => setGcalForm(f => ({ ...f, calendar_id: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => connectGcalMutation.mutate()} disabled={!gcalForm.api_key || !gcalForm.calendar_id || connectGcalMutation.isPending}>{connectGcalMutation.isPending ? "Conectando..." : "Testar e Conectar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== Goals Tab =====================
function GoalsTab({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const currentPeriod = format(new Date(), "yyyy-MM");
  const [goalForm, setGoalForm] = useState({ period: currentPeriod, target_amount: "", professional_name: "" });

  const { data: goals = [] } = useQuery({
    queryKey: ["revenue-goals", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("revenue_goals").select("*").eq("clinic_id", clinicId).order("period", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["goals-budgets", clinicId, currentPeriod],
    queryFn: async () => {
      if (!clinicId) return [];
      const start = `${currentPeriod}-01`;
      const { data } = await supabase.from("budgets").select("total, status, created_at").eq("clinic_id", clinicId).eq("status", "aprovado").gte("created_at", start);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const currentRevenue = budgets.reduce((s, b: any) => s + Number(b.total || 0), 0);
  const currentGoal = goals.find((g: any) => g.period === currentPeriod && !g.professional_name);
  const goalProgress = currentGoal ? Math.min(Math.round((currentRevenue / Number(currentGoal.target_amount)) * 100), 100) : 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      const { error } = await supabase.from("revenue_goals").upsert({
        clinic_id: clinicId,
        period: goalForm.period,
        target_amount: parseFloat(goalForm.target_amount) || 0,
        professional_name: goalForm.professional_name || null,
      }, { onConflict: "clinic_id,period,professional_name" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-goals"] });
      setGoalForm(f => ({ ...f, target_amount: "", professional_name: "" }));
      toast({ title: "Meta salva!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("revenue_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["revenue-goals"] }); toast({ title: "Meta removida" }); },
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <>
      {/* Current Progress */}
      {currentGoal && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Meta do Mês Atual — {format(new Date(), "MMMM yyyy", { locale: ptBR })}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-2xl font-bold">R$ {currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">de R$ {Number(currentGoal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-lg font-semibold">{goalProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goalProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Goal */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Definir Meta de Faturamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Período</Label><Input type="month" value={goalForm.period} onChange={e => setGoalForm(f => ({ ...f, period: e.target.value }))} /></div>
            <div><Label>Meta (R$)</Label><Input type="number" value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="50000" /></div>
            <div><Label>Vendedor (opcional)</Label><Input value={goalForm.professional_name} onChange={e => setGoalForm(f => ({ ...f, professional_name: e.target.value }))} placeholder="Geral da loja" /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !goalForm.target_amount}>{saveMutation.isPending ? "Salvando..." : "Salvar Meta"}</Button>
        </CardContent>
      </Card>

      {/* Goals List */}
      {goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Metas Cadastradas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Meta</TableHead><TableHead>Vendedor</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{goals.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell>{g.period}</TableCell>
                  <TableCell className="font-medium">R$ {Number(g.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{g.professional_name || "Geral"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ===================== Audit Tab =====================
function AuditTab({ clinicId }: { clinicId: string }) {
  const [filterTable, setFilterTable] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", clinicId, filterTable],
    queryFn: async () => {
      if (!clinicId) return [];
      let q = supabase.from("audit_logs").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(100);
      if (filterTable !== "all") q = q.eq("table_name", filterTable);
      const { data } = await q;
      return data || [];
    },
    enabled: !!clinicId,
  });

  const ACTION_COLORS: Record<string, string> = {
    INSERT: "bg-green-500/10 text-green-500",
    UPDATE: "bg-blue-500/10 text-blue-500",
    DELETE: "bg-destructive/10 text-destructive",
  };

  const TABLE_LABELS: Record<string, string> = {
    patients: "Clientes",
    appointments: "Visitas",
    budgets: "Orçamentos",
    financial_installments: "Financeiro",
  };

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Logs de Auditoria</CardTitle></div>
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas tabelas</SelectItem>
              {Object.entries(TABLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Nenhum log registrado ainda.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">As ações no sistema serão registradas automaticamente.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <Badge variant="outline" className={ACTION_COLORS[log.action]}>{log.action}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                    <span className="text-xs text-muted-foreground">por {log.user_email || "sistema"}</span>
                  </div>
                  {log.action === "UPDATE" && log.old_data && log.new_data && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {Object.keys(log.new_data).filter(k => JSON.stringify(log.old_data[k]) !== JSON.stringify(log.new_data[k]) && k !== "updated_at").slice(0, 3).map(k => `${k}: ${log.old_data[k]} → ${log.new_data[k]}`).join(", ")}
                    </p>
                  )}
                  {log.action === "INSERT" && log.new_data?.name && (
                    <p className="text-xs text-muted-foreground mt-1">Nome: {log.new_data.name}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Post-Procedure Tab =====================
function PostProcedureTab({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ procedure_id: "", name: "", delay_hours: "24", message_template: "" });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures-for-post", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("procedures").select("id, name").eq("clinic_id", clinicId);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["post-procedure-templates", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("post_procedure_templates").select("*, procedures(name)").eq("clinic_id", clinicId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      const { error } = await supabase.from("post_procedure_templates").insert({
        clinic_id: clinicId,
        procedure_id: form.procedure_id || null,
        name: form.name,
        delay_hours: parseInt(form.delay_hours) || 24,
        message_template: form.message_template,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] });
      setForm({ procedure_id: "", name: "", delay_hours: "24", message_template: "" });
      toast({ title: "Template pós-venda salvo!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("post_procedure_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] }); toast({ title: "Template removido" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("post_procedure_templates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["post-procedure-templates"] }); },
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-sm">Novo Template Pós-Venda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome do fluxo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pós-entrega colchão" /></div>
            <div><Label>Produto (opcional)</Label>
              <Select value={form.procedure_id} onValueChange={v => setForm(f => ({ ...f, procedure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos procedimentos" /></SelectTrigger>
                <SelectContent>{procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Enviar após (horas)</Label><Input type="number" value={form.delay_hours} onChange={e => setForm(f => ({ ...f, delay_hours: e.target.value }))} /></div>
          <div><Label>Mensagem (use {`{{nome}}`} para o nome do cliente)</Label>
            <Textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Olá {{nome}}, como está sua experiência com o produto?" className="min-h-[100px]" />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.message_template}>{saveMutation.isPending ? "Salvando..." : "Criar Template"}</Button>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Templates Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t.name}</p>
                      {t.procedures?.name && <Badge variant="secondary" className="text-[10px]">{t.procedures.name}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{t.delay_hours}h após</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.message_template}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch checked={t.active} onCheckedChange={v => toggleMutation.mutate({ id: t.id, active: v })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ===================== Main Settings Page =====================
export default function SettingsPage() {
  const { clinicId, isPlatformAdmin, appMode, activeLojaId } = useAuth();
  const queryClient = useQueryClient();

  const [clinicForm, setClinicForm] = useState({ name: "", phone: "", email: "" });
  const [storeForm, setStoreForm] = useState({
    nome_loja: "",
    nome_assistente: "",
    tom_voz: "amigável",
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
  });
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", password: "", role: "clinic_staff" });
  const showAdminControls = isPlatformAdmin && appMode === "admin";

  const { data: clinic } = useQuery({
    queryKey: ["clinic-settings", clinicId],
    queryFn: async () => { if (!clinicId) return null; const { data } = await supabase.from("clinics").select("*").eq("id", clinicId).single(); return data; },
    enabled: !!clinicId,
  });

  const { data: adminClinics } = useQuery({
    queryKey: ["clinics-for-settings"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("*"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const [selectedClinicId, setSelectedClinicId] = useState("");
  const effectiveClinic = clinic || adminClinics?.find(c => c.id === selectedClinicId);
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: activeLoja } = useQuery({
    queryKey: ["settings-loja", activeLojaId],
    queryFn: async () => {
      if (!activeLojaId) return null;
      const { data, error } = await supabase
        .from("lojas")
        .select("id, nome_loja, nome_assistente, tom_voz, especialidades, regras_personalidade, horario_inicio, horario_fim, formas_pagamento, politica_troca, prazo_entrega, frete_gratis_acima, montagem_disponivel, desconto_carrinho_abandonado, desconto_promocao_nao_respondida")
        .eq("id", activeLojaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !showAdminControls && !!activeLojaId,
  });

  useEffect(() => { if (effectiveClinic) setClinicForm({ name: effectiveClinic.name || "", phone: effectiveClinic.phone || "", email: effectiveClinic.email || "" }); }, [effectiveClinic]);
  useEffect(() => { if (adminClinics?.length && !selectedClinicId) setSelectedClinicId(adminClinics[0].id); }, [adminClinics, selectedClinicId]);
  useEffect(() => {
    if (!activeLoja) return;

    setStoreForm({
      nome_loja: activeLoja.nome_loja || "",
      nome_assistente: activeLoja.nome_assistente || "",
      tom_voz: activeLoja.tom_voz || "amigável",
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
    });
  }, [activeLoja]);

  const parseOptionalNumber = (value: string, fieldLabel: string) => {
    if (!value.trim()) return null;
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) throw new Error(`${fieldLabel} inválido`);
    return parsedValue;
  };

  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ["team-members", effectiveClinicId],
    queryFn: async () => { if (!effectiveClinicId) return []; const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "list", clinic_id: effectiveClinicId } }); if (error) throw error; return data?.users || []; },
    enabled: showAdminControls && !!effectiveClinicId,
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => { if (!effectiveClinicId) throw new Error("Nenhuma loja"); const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "create", ...newMember, clinic_id: effectiveClinicId } }); if (error) throw error; if (data?.error) throw new Error(data.error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); setTeamDialogOpen(false); setNewMember({ email: "", password: "", role: "clinic_staff" }); toast({ title: "Membro adicionado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async ({ role_id, user_id }: { role_id: string; user_id: string }) => { const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "delete", role_id, user_id } }); if (error) throw error; if (data?.error) throw new Error(data.error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast({ title: "Membro removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ role_id, new_role }: { role_id: string; new_role: string }) => { const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "update_role", role_id, new_role } }); if (error) throw error; if (data?.error) throw new Error(data.error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast({ title: "Cargo atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => { if (!effectiveClinicId) throw new Error("Nenhuma loja"); const { error } = await supabase.from("clinics").update({ name: clinicForm.name, phone: clinicForm.phone || null, email: clinicForm.email || null }).eq("id", effectiveClinicId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clinic-settings"] }); queryClient.invalidateQueries({ queryKey: ["clinics-for-settings"] }); toast({ title: "Dados salvos!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

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
        })
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
          {!showAdminControls && <TabsTrigger value="ai-agent"><MessageSquare className="h-3.5 w-3.5 mr-1" />Agente de IA</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="team">Equipe</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="goals"><Target className="h-3.5 w-3.5 mr-1" />Metas</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="post-procedure">Pós-Venda</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="integrations">Integrações</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="lgpd">LGPD</TabsTrigger>}
          {showAdminControls && <TabsTrigger value="audit"><History className="h-3.5 w-3.5 mr-1" />Auditoria</TabsTrigger>}
        </TabsList>

        <TabsContent value="clinic" className="mt-4 space-y-4">
          {showAdminControls && !clinicId && adminClinics && adminClinics.length > 0 && (
            <div className="flex gap-2">{adminClinics.map(c => (<Button key={c.id} variant={selectedClinicId === c.id ? "default" : "outline"} size="sm" onClick={() => setSelectedClinicId(c.id)}>{c.name}</Button>))}</div>
          )}
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">{showAdminControls ? "Informações da Conta" : "Dados da Loja"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nome da Loja</Label><Input value={showAdminControls ? clinicForm.name : storeForm.nome_loja} onChange={e => setClinicForm(f => ({ ...f, name: e.target.value }))} readOnly={!showAdminControls} /></div>
                <div><Label>Telefone</Label><Input value={clinicForm.phone} onChange={e => setClinicForm(f => ({ ...f, phone: e.target.value }))} readOnly={!showAdminControls} /></div>
                <div><Label>E-mail</Label><Input value={clinicForm.email} onChange={e => setClinicForm(f => ({ ...f, email: e.target.value }))} readOnly={!showAdminControls} /></div>
              </div>
              {showAdminControls ? (
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}</Button>
              ) : (
                <p className="text-sm text-muted-foreground">Nome da loja, telefone e e-mail são somente leitura para o cliente.</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">Horário de Funcionamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Horário de abertura</Label><Input type="time" value={showAdminControls ? (activeLoja?.horario_inicio || "08:00") : storeForm.horario_inicio} onChange={e => setStoreForm(f => ({ ...f, horario_inicio: e.target.value }))} disabled /></div>
                <div><Label>Horário de fechamento</Label><Input type="time" value={showAdminControls ? (activeLoja?.horario_fim || "18:00") : storeForm.horario_fim} onChange={e => setStoreForm(f => ({ ...f, horario_fim: e.target.value }))} disabled /></div>
              </div>
              <p className="text-sm text-muted-foreground">{showAdminControls ? "Os horários operacionais da loja são editados no detalhe da loja em Admin > Lojas." : "Os horários da loja agora são editados na aba Agente de IA."}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {!showAdminControls && <TabsContent value="ai-agent" className="mt-4 space-y-4">
          {!activeLojaId ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma loja ativa encontrada para este usuário.</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm">Identidade</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Nome do assistente</Label>
                      <Input value={storeForm.nome_assistente} onChange={e => setStoreForm(f => ({ ...f, nome_assistente: e.target.value }))} placeholder="Ex: Clara" />
                    </div>
                    <div>
                      <Label>Tom de voz</Label>
                      <Select value={storeForm.tom_voz} onValueChange={value => setStoreForm(f => ({ ...f, tom_voz: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amigável">Amigável</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="descontraído">Descontraído</SelectItem>
                          <SelectItem value="consultivo">Consultivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Especialidades</Label>
                    <Textarea value={storeForm.especialidades} onChange={e => setStoreForm(f => ({ ...f, especialidades: e.target.value }))} placeholder="Descreva em que o agente é especialista." className="min-h-[110px]" />
                  </div>
                  <div>
                    <Label>Regras de personalidade</Label>
                    <Textarea value={storeForm.regras_personalidade} onChange={e => setStoreForm(f => ({ ...f, regras_personalidade: e.target.value }))} placeholder="Ex: nunca prometer prazo sem confirmar estoque." className="min-h-[110px]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Horário de Funcionamento</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Horário início</Label>
                    <Input type="time" value={storeForm.horario_inicio} onChange={e => setStoreForm(f => ({ ...f, horario_inicio: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Horário fim</Label>
                    <Input type="time" value={storeForm.horario_fim} onChange={e => setStoreForm(f => ({ ...f, horario_fim: e.target.value }))} />
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

              <div className="flex justify-end">
                <Button onClick={() => saveAiAgentMutation.mutate()} disabled={saveAiAgentMutation.isPending}>
                  {saveAiAgentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar configurações
                </Button>
              </div>
            </>
          )}
        </TabsContent>}

        {showAdminControls && <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Membros da Equipe</CardTitle>
                <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                  <DialogTrigger asChild><Button size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Adicionar Membro</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Membro da Equipe</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>E-mail</Label><Input value={newMember.email} onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
                      <div><Label>Senha Inicial</Label><Input type="password" value={newMember.password} onChange={e => setNewMember(m => ({ ...m, password: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
                      <div><Label>Cargo</Label>
                        <Select value={newMember.role} onValueChange={v => setNewMember(m => ({ ...m, role: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="clinic_owner">Proprietário</SelectItem><SelectItem value="clinic_staff">Vendedor</SelectItem><SelectItem value="clinic_receptionist">Recepcionista</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full" onClick={() => createMemberMutation.mutate()} disabled={createMemberMutation.isPending || !newMember.email || !newMember.password}>{createMemberMutation.isPending ? "Criando..." : "Criar Membro"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
              ) : !teamMembers?.length ? (
                <div className="py-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Nenhum membro cadastrado.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Cargo</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{teamMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell>
                        <Select value={member.role} onValueChange={v => updateRoleMutation.mutate({ role_id: member.role_id, new_role: v })}>
                          <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="clinic_owner">Proprietário</SelectItem><SelectItem value="clinic_staff">Vendedor</SelectItem><SelectItem value="clinic_receptionist">Recepcionista</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteMemberMutation.mutate({ role_id: member.role_id, user_id: member.id })}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>}

        <TabsContent value="goals" className="mt-4 space-y-4">
          <GoalsTab clinicId={effectiveClinicId} />
        </TabsContent>

        <TabsContent value="post-procedure" className="mt-4 space-y-4">
          <PostProcedureTab clinicId={effectiveClinicId} />
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          <IntegrationsTab clinicId={effectiveClinicId} />
        </TabsContent>

        <TabsContent value="lgpd" className="mt-4 space-y-4">
          <LgpdTab clinicId={effectiveClinicId} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <AuditTab clinicId={effectiveClinicId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
