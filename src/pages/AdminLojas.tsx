import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Settings2, Copy, Trash2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [createForm, setCreateForm] = useState({ nome_loja: "", nome_assistente: "Sofia", instance: "" });

  type LojaRow = {
    id: string;
    nome_loja: string;
    nome_assistente?: string | null;
    nome_assistente_ia?: string | null;
    instance?: string | null;
    ativo?: boolean | null;
    created_at?: string | null;
  };

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("lojas")
        .insert({
          nome_loja: createForm.nome_loja,
          nome_assistente_ia: createForm.nome_assistente,
          instance: createForm.instance,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lojas"] });
      setShowCreate(false);
      setCreateForm({ nome_loja: "", nome_assistente: "Sofia", instance: "" });
      toast({ title: "Loja criada com sucesso!" });
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
          <p className="text-sm text-muted-foreground">Gerencie os tenants do agente WhatsApp</p>
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
                    <TableCell className="font-medium">{loja.nome_loja}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{loja.nome_assistente || loja.nome_assistente_ia || "—"}</TableCell>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurar" onClick={() => navigate(`/admin/lojas/${loja.id}`)}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => duplicateMutation.mutate(loja.id)} disabled={duplicateMutation.isPending}>
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Loja *</Label>
              <Input placeholder="Ex: Colchões Premium" value={createForm.nome_loja} onChange={(e) => setCreateForm((f) => ({ ...f, nome_loja: e.target.value }))} />
            </div>
            <div>
              <Label>Nome da Assistente IA</Label>
              <Input placeholder="Sofia" value={createForm.nome_assistente} onChange={(e) => setCreateForm((f) => ({ ...f, nome_assistente: e.target.value }))} />
            </div>
            <div>
              <Label>Instance Evolution *</Label>
              <Input placeholder="minha-loja" value={createForm.instance} onChange={(e) => setCreateForm((f) => ({ ...f, instance: e.target.value }))} />
              <p className="mt-1 text-xs text-muted-foreground">Identificador da instância na Evolution API</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!createForm.nome_loja || !createForm.instance || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Loja"}
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
