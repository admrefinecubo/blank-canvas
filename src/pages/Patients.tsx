import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Users, Tag, X, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const STAGE_LABELS: Record<string, string> = {
  lead: "Novo Lead",
  contacted: "Contatado",
  visit_scheduled: "Visita Agendada",
  measurement: "Medição / Projeto",
  budget_sent: "Orçamento Enviado",
  negotiation: "Negociação",
  approved: "Aprovado / Venda",
  lost: "Perdido",
  vip: "VIP",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  visit_scheduled: "bg-primary/10 text-primary border-primary/20",
  measurement: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  budget_sent: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  negotiation: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
  vip: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

const SUGGESTED_TAGS = ["VIP", "Reforma", "Mudança", "Colchão", "Sala Planejada", "Quarto", "Escritório", "Indicação"];

export default function Patients() {
  const navigate = useNavigate();
  const { clinicId, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", gender: "", source: "manual", stage: "lead", notes: "", tags: [] as string[], utm_source: "", utm_medium: "", utm_campaign: "" });
  const [tagInput, setTagInput] = useState("");

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-select"],
    queryFn: async () => { const { data } = await supabase.from("clinics").select("id, name"); return data || []; },
    enabled: isPlatformAdmin && !clinicId,
  });

  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const effectiveClinicId = clinicId || selectedClinicId;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", effectiveClinicId],
    queryFn: async () => {
      let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (effectiveClinicId) q = q.eq("clinic_id", effectiveClinicId);
      const { data } = await q;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveClinicId) throw new Error("Selecione uma loja");
      const { error } = await supabase.from("patients").insert({
        clinic_id: effectiveClinicId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        cpf: form.cpf || null,
        gender: form.gender || null,
        source: form.source,
        stage: form.stage,
        notes: form.notes || null,
        tags: form.tags,
        utm_source: form.utm_source || null,
        utm_medium: form.utm_medium || null,
        utm_campaign: form.utm_campaign || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", cpf: "", gender: "", source: "manual", stage: "lead", notes: "", tags: [], utm_source: "", utm_medium: "", utm_campaign: "" });
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  // Collect all unique tags from existing patients
  const allTags = [...new Set(patients.flatMap((p: any) => p.tags || []))];

  const filtered = patients.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = filterStage === "all" || p.stage === filterStage;
    const matchesTag = !filterTag || (p.tags && p.tags.includes(filterTag));
    return matchesSearch && matchesStage && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Clientes / Leads</h1>
        <div className="flex gap-2">
          {isPlatformAdmin && !clinicId && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
              <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Novo Cliente</Button>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, telefone ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas etapas</SelectItem>
              {Object.entries(STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          {allTags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas tags</SelectItem>
                {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(filterStage !== "all" || filterTag) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterStage("all"); setFilterTag(""); }} className="gap-1 text-xs">
              <X className="h-3 w-3" /> Limpar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum cliente encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Clique em "Novo Cliente" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium hidden md:table-cell">Telefone</th>
                <th className="p-3 font-medium hidden lg:table-cell">E-mail</th>
                <th className="p-3 font-medium">Etapa</th>
                <th className="p-3 font-medium hidden md:table-cell">Tags</th>
                <th className="p-3 font-medium hidden lg:table-cell">Origem</th>
                <th className="p-3 font-medium hidden sm:table-cell">Cadastro</th>
              </tr></thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30 cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-sm hidden md:table-cell">{p.phone || "—"}</td>
                    <td className="p-3 text-sm hidden lg:table-cell">{p.email || "—"}</td>
                    <td className="p-3"><Badge variant="outline" className={STAGE_COLORS[p.stage || "lead"]}>{STAGE_LABELS[p.stage || "lead"] || p.stage}</Badge></td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {(p.tags || []).slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                        ))}
                        {(p.tags || []).length > 3 && <span className="text-xs text-muted-foreground">+{p.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-sm capitalize hidden lg:table-cell">
                      {p.utm_campaign ? `${p.source || "—"} (${p.utm_campaign})` : (p.source || "—")}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {isPlatformAdmin && !clinicId && (
              <div><Label>Loja *</Label>
                <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar loja" /></SelectTrigger>
                  <SelectContent>{clinics?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <div><Label>Gênero</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Origem</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Etapa</Label>
                <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Adicionar tag..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                  className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).slice(0, 6).map(t => (
                  <button key={t} onClick={() => addTag(t)} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-accent transition-colors">{t}</button>
                ))}
              </div>
            </div>

            {/* UTM Tracking */}
            <div className="border-t border-border pt-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rastreamento de Campanha (opcional)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input value={form.utm_source} onChange={e => setForm(f => ({ ...f, utm_source: e.target.value }))} placeholder="utm_source" className="text-xs" />
                <Input value={form.utm_medium} onChange={e => setForm(f => ({ ...f, utm_medium: e.target.value }))} placeholder="utm_medium" className="text-xs" />
                <Input value={form.utm_campaign} onChange={e => setForm(f => ({ ...f, utm_campaign: e.target.value }))} placeholder="utm_campaign" className="text-xs" />
              </div>
            </div>

            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações sobre o cliente..." /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Cadastrar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
