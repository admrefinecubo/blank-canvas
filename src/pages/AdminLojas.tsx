import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Settings2, Copy, Trash2, Plus, Loader2, Building2, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type LojaRow = {
  id: string;
  clinic_id?: string | null;
  nome_loja: string;
  nome_assistente_ia?: string | null;
  instance?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
};

type ClinicRow = {
  id: string;
  name: string;
  owner_email: string;
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminLojas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
   const [createForm, setCreateForm] = useState({ clinic_id: "", nome_loja: "", nome_assistente_ia: "Sofia" });
   const [linkForm, setLinkForm] = useState({ lojaId: null as string | null, clinic_id: "" });
   const [qrDialog, setQrDialog] = useState(false);
   const [qrCode, setQrCode] = useState<string | null>(null);
   const [creatingInstance, setCreatingInstance] = useState(false);

  const { data: lojas, isLoading } = useQuery({
    queryKey: ["admin-lojas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LojaRow[];
    },
  });

   const { data: clinics = [], isLoading: isLoadingClinics } = useQuery({
     queryKey: ["admin-lojas-clinics"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("clinics")
         .select("id, name, owner_email")
         .order("name", { ascending: true });
       if (error) throw error;
       return (data ?? []) as ClinicRow[];
     },
   });

   const clinicsById = useMemo(
     () => Object.fromEntries(clinics.map((clinic) => [clinic.id, clinic])) as Record<string, ClinicRow>,
     [clinics],
   );

  const clinicsWithoutStore = useMemo(
    () => clinics.filter((clinic) => !lojas?.some((loja) => loja.clinic_id === clinic.id)),
    [clinics, lojas],
  );

   const lojaToLink = lojas?.find((loja) => loja.id === linkForm.lojaId) ?? null;

  const createMutation = useMutation({
    mutationFn: async () => {
      // Auto-generate instance name from loja name
      const instanceName = createForm.nome_loja
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "loja";

      const { data, error } = await supabase
        .from("lojas")
        .insert({
          clinic_id: createForm.clinic_id,
          nome_loja: createForm.nome_loja,
          nome_assistente_ia: createForm.nome_assistente_ia,
          instance: instanceName,
        } as any)
        .select("id, clinic_id")
        .single();
      if (error) throw error;

      // Auto-create instance on Evolution API
      try {
        setCreatingInstance(true);
        const { data: evoData, error: evoErr } = await supabase.functions.invoke("evolution-api", {
          body: {
            action: "create_instance",
            clinic_id: data.clinic_id,
            instance_name: instanceName,
          },
        });
        if (!evoErr && evoData?.qrcode) {
          setQrCode(evoData.qrcode);
          setQrDialog(true);
        }
      } catch (e) {
        console.error("Evolution API error:", e);
      } finally {
        setCreatingInstance(false);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
      setShowCreate(false);
      setCreateForm({ clinic_id: "", nome_loja: "", nome_assistente_ia: "Sofia" });
      toast({ title: "Loja criada com sucesso!", description: qrCode ? "Escaneie o QR Code para conectar o WhatsApp." : undefined });
    },
    onError: (e: any) => toast({ title: "Erro ao criar loja", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (lojaId: string) => {
      const { data: original, error: fetchErr } = await supabase
        .from("lojas")
        .select("*")
        .eq("id", lojaId)
        .single();
      if (fetchErr || !original) throw fetchErr || new Error("Loja não encontrada");
      if (!original.clinic_id) throw new Error("Vincule a loja a uma conta antes de duplicar");

      const { id, created_at, ...rest } = original as any;
      const { data: newLoja, error: insertErr } = await supabase
        .from("lojas")
        .insert({ ...rest, nome_loja: `${original.nome_loja} (cópia)` })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      return newLoja;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
      toast({ title: "Loja duplicada!" });
      navigate(`/admin/lojas/${data.id}`);
    },
    onError: (e: any) => toast({ title: "Erro ao duplicar", description: e.message, variant: "destructive" }),
  });

   const linkMutation = useMutation({
     mutationFn: async ({ lojaId, clinicId }: { lojaId: string; clinicId: string }) => {
       const { error } = await supabase
         .from("lojas")
         .update({ clinic_id: clinicId })
         .eq("id", lojaId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
       setLinkForm({ lojaId: null, clinic_id: "" });
       toast({ title: "Conta vinculada com sucesso!" });
     },
     onError: (e: any) => toast({ title: "Erro ao vincular conta", description: e.message, variant: "destructive" }),
   });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lojas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
      setDeleteId(null);
      toast({ title: "Loja excluída" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lojas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as lojas operacionais vinculadas às contas dos clientes</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nova Loja
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !lojas?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Store className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma loja cadastrada</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="h-3.5 w-3.5" /> Criar primeira loja
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Nome da Loja</TableHead>
                  <TableHead className="hidden md:table-cell">Assistente IA</TableHead>
                  <TableHead className="hidden lg:table-cell">Instance Evolution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lojas.map((loja) => (
                  <TableRow key={loja.id}>
                    <TableCell>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(loja.nome_loja)}`}>
                        {loja.nome_loja.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         <p className="font-medium">{loja.nome_loja}</p>
                         {loja.clinic_id ? (
                           <p className="text-xs text-muted-foreground">
                             Conta: {clinicsById[loja.clinic_id]?.name || "Conta vinculada"}
                           </p>
                         ) : (
                           <Badge variant="outline" className="text-xs">Sem conta vinculada</Badge>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="hidden md:table-cell text-muted-foreground">{loja.nome_assistente_ia || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{loja.instance || "—"}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={loja.ativo !== false ? "default" : "destructive"} className="text-xs">
                        {loja.ativo !== false ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {loja.created_at ? format(new Date(loja.created_at), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           title={loja.clinic_id ? "Alterar conta vinculada" : "Vincular conta"}
                           onClick={() => setLinkForm({ lojaId: loja.id, clinic_id: loja.clinic_id || "" })}
                         >
                           <Link2 className="h-4 w-4" />
                         </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurar" onClick={() => navigate(`/admin/lojas/${loja.id}`)}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => duplicateMutation.mutate(loja.id)} disabled={duplicateMutation.isPending || !loja.clinic_id}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => setDeleteId(loja.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!!clinicsWithoutStore.length && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Contas sem loja operacional</h2>
                <p className="text-sm text-muted-foreground">Essas contas existem no sistema, mas ainda não possuem registro em <code>lojas</code>.</p>
              </div>
              <Badge variant="outline">{clinicsWithoutStore.length}</Badge>
            </div>

            <div className="space-y-3">
              {clinicsWithoutStore.map((clinic) => (
                <div key={clinic.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{clinic.name}</p>
                    <p className="text-sm text-muted-foreground">Owner: {clinic.owner_email}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setCreateForm((current) => ({
                        ...current,
                        clinic_id: clinic.id,
                        nome_loja: current.nome_loja || clinic.name,
                      }));
                      setShowCreate(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Criar loja
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Conta *</Label>
              <Select value={createForm.clinic_id || undefined} onValueChange={(value) => setCreateForm((f) => ({ ...f, clinic_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClinics ? "Carregando contas..." : "Selecione a conta"} />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Toda loja precisa nascer vinculada a uma conta do cliente.</p>
            </div>
            <div>
              <Label>Nome da Loja *</Label>
              <Input placeholder="Ex: Colchões Premium" value={createForm.nome_loja} onChange={(e) => setCreateForm((f) => ({ ...f, nome_loja: e.target.value }))} />
            </div>
            <div>
              <Label>Nome da Assistente IA</Label>
              <Input placeholder="Sofia" value={createForm.nome_assistente_ia} onChange={(e) => setCreateForm((f) => ({ ...f, nome_assistente_ia: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">A instância WhatsApp será criada automaticamente ao salvar.</p>
            {!clinics.length && !isLoadingClinics ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Crie a conta do cliente em <code>/admin</code> antes de cadastrar a loja.
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!createForm.clinic_id || !createForm.nome_loja || createMutation.isPending || creatingInstance || !clinics.length}>
              {createMutation.isPending || creatingInstance ? "Criando..." : "Criar Loja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkForm.lojaId} onOpenChange={(open) => !open && setLinkForm({ lojaId: null, clinic_id: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular loja à conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">{lojaToLink?.nome_loja || "Loja"}</p>
              <p className="text-muted-foreground">
                {lojaToLink?.clinic_id && clinicsById[lojaToLink.clinic_id]
                  ? `Conta atual: ${clinicsById[lojaToLink.clinic_id].name}`
                  : "Nenhuma conta vinculada ainda."}
              </p>
            </div>

            <div>
              <Label>Conta *</Label>
              <Select value={linkForm.clinic_id || undefined} onValueChange={(value) => setLinkForm((current) => ({ ...current, clinic_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Essa vinculação define qual conta do cliente terá acesso operacional a essa loja.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkForm({ lojaId: null, clinic_id: "" })}>Cancelar</Button>
            <Button
              onClick={() => linkForm.lojaId && linkMutation.mutate({ lojaId: linkForm.lojaId, clinicId: linkForm.clinic_id })}
              disabled={!linkForm.lojaId || !linkForm.clinic_id || linkMutation.isPending}
            >
              {linkMutation.isPending ? "Salvando..." : "Salvar vínculo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir loja?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados da loja (produtos, leads, mensagens) serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
