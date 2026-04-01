import { useMemo, useState } from "react";
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIAS = ["Sala", "Quarto", "Sala de Jantar", "Colchões", "Planejados", "Outros"];

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  categoria: "",
  tags: "",
  especificacoes: "",
  variacoes: "",
  preco_original: "",
  preco_promocional: "",
  estoque_disponivel: true,
  foto_principal: "",
  foto_detalhe: "",
  video_url: "",
};

export default function LojaCatalogo() {
  const { activeLojaId } = useAuth();
  const queryClient = useQueryClient();
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["loja-produtos", activeLojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, categoria, preco_original, preco_promocional, estoque_disponivel, foto_principal, created_at")
        .eq("loja_id", activeLojaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const filtered = useMemo(() => {
    if (!produtos) return [];
    return produtos.filter((p) => {
      if (filterCat !== "all" && p.categoria !== filterCat) return false;
      if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [produtos, filterCat, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = async (prodId: string) => {
    const { data } = await supabase.from("produtos").select("*").eq("id", prodId).single();
    if (!data) return;
    setEditId(prodId);
    setForm({
      nome: data.nome || "",
      descricao: data.descricao || "",
      categoria: data.categoria || "",
      tags: data.tags || "",
      especificacoes: data.especificacoes || "",
      variacoes: data.variacoes || "",
      preco_original: data.preco_original?.toString() || "",
      preco_promocional: data.preco_promocional?.toString() || "",
      estoque_disponivel: data.estoque_disponivel ?? true,
      foto_principal: data.foto_principal || "",
      foto_detalhe: data.foto_detalhe || "",
      video_url: data.video_url || "",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const webhookUrl = (import.meta as any).env?.VITE_WF06_WEBHOOK_URL;
      const payload = {
        loja_id: activeLojaId!,
        nome: form.nome,
        descricao: form.descricao || null,
        categoria: form.categoria || null,
        tags: form.tags || null,
        especificacoes: form.especificacoes || null,
        variacoes: form.variacoes || null,
        preco_original: Number(form.preco_original),
        preco_promocional: form.preco_promocional ? Number(form.preco_promocional) : null,
        estoque_disponivel: form.estoque_disponivel,
        foto_principal: form.foto_principal || null,
        foto_detalhe: form.foto_detalhe || null,
        video_url: form.video_url || null,
      };

      let produtoId = editId;
      if (editId) {
        const { data, error } = await supabase.from("produtos").update(payload).eq("id", editId).select("id").single();
        if (error) throw error;
        produtoId = data.id;
      } else {
        const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
        if (error) throw error;
        produtoId = data.id;
      }

      if (!webhookUrl || !produtoId) return;

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loja_id: activeLojaId, produto_id: produtoId, action: "upsert" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-produtos", activeLojaId] });
      setShowForm(false);
      toast.success("Produto salvo!");
    },
    onError: (e: any) => toast.error("Erro ao salvar produto", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-produtos", activeLojaId] });
      setDeleteId(null);
      toast.success("Produto excluído");
    },
    onError: (e: any) => toast.error("Erro ao excluir produto", { description: e.message }),
  });

  const reindexMutation = useMutation({
    mutationFn: async () => {
      const webhookUrl = (import.meta as any).env?.VITE_WF06_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("URL do webhook WF-06 não configurada");
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loja_id: activeLojaId }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
    },
    onSuccess: () => toast.success("Re-indexação iniciada!"),
    onError: (e: any) => toast.error("Erro ao re-indexar", { description: e.message }),
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!activeLojaId) {
    return <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">Nenhuma loja operacional vinculada a esta conta.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Catálogo de produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os produtos que alimentam a operação comercial da sua loja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => reindexMutation.mutate()} disabled={reindexMutation.isPending}>
            <RefreshCw className={`h-4 w-4 ${reindexMutation.isPending ? "animate-spin" : ""}`} />
            Re-indexar Embeddings
          </Button>
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Produto</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum produto encontrado</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Adicionar produto</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-muted/40">
                          {produto.foto_principal ? <img src={produto.foto_principal} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">{new Date(produto.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{produto.categoria || "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{formatPrice(Number(produto.preco_promocional ?? produto.preco_original ?? 0))}</p>
                        {produto.preco_promocional ? <p className="text-xs text-muted-foreground line-through">{formatPrice(Number(produto.preco_original || 0))}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={produto.estoque_disponivel ? "default" : "secondary"}>{produto.estoque_disponivel ? "Disponível" : "Indisponível"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(produto.id)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(produto.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editId ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
            <div><Label>Categoria</Label><Select value={form.categoria} onValueChange={(value) => set("categoria", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{CATEGORIAS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Preço original</Label><Input type="number" value={form.preco_original} onChange={(e) => set("preco_original", e.target.value)} /></div>
            <div><Label>Preço promocional</Label><Input type="number" value={form.preco_promocional} onChange={(e) => set("preco_promocional", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={4} /></div>
            <div className="md:col-span-2"><Label>Tags</Label><Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="sofá, premium, lançamento" /></div>
            <div className="md:col-span-2"><Label>Especificações</Label><Textarea value={form.especificacoes} onChange={(e) => set("especificacoes", e.target.value)} rows={3} /></div>
            <div className="md:col-span-2"><Label>Variações</Label><Textarea value={form.variacoes} onChange={(e) => set("variacoes", e.target.value)} rows={3} /></div>
            <div><Label>Foto principal</Label><Input value={form.foto_principal} onChange={(e) => set("foto_principal", e.target.value)} placeholder="https://..." /></div>
            <div><Label>Foto detalhe</Label><Input value={form.foto_detalhe} onChange={(e) => set("foto_detalhe", e.target.value)} placeholder="https://..." /></div>
            <div className="md:col-span-2"><Label>Vídeo</Label><Input value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://..." /></div>
            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium">Produto disponível em estoque</p>
                <p className="text-sm text-muted-foreground">Desative quando o item não puder mais ser vendido.</p>
              </div>
              <Switch checked={form.estoque_disponivel} onCheckedChange={(value) => set("estoque_disponivel", value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.nome || !form.preco_original}>{saveMutation.isPending ? "Salvando..." : "Salvar produto"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação remove o produto do catálogo da sua loja.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId!)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}