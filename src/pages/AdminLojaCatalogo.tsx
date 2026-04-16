import { useState, useMemo, useRef, ChangeEvent } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Plus, Pencil, Trash2, ImageIcon, Loader2, Package, Upload,
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
import AdminLojaSectionLayout from "@/components/AdminLojaSectionLayout";
import VariationEditor, { parseVariacoesFromDb, serializeVariacoes } from "@/components/VariationEditor";

const CATEGORIAS = ["Sala", "Quarto", "Sala de Jantar", "Colchões", "Planejados", "Outros"];

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  categoria: "",
  tags: "",
  especificacoes: "",
  variacoes: [] as import("@/components/VariationEditor").Variacao[],
  preco_original: "",
  preco_promocional: "",
  estoque_disponivel: true,
  foto_principal: "",
  foto_detalhe: "",
  video_url: "",
};

export default function AdminLojaCatalogo() {
  const { id: lojaId } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: loja } = useQuery({
    queryKey: ["admin-loja-name", lojaId],
    queryFn: async () => {
      const { data } = await supabase.from("lojas").select("nome_loja").eq("id", lojaId!).single();
      return data;
    },
    enabled: !!lojaId,
  });

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["admin-produtos", lojaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, categoria, preco_original, preco_promocional, estoque_disponivel, foto_principal, created_at")
        .eq("loja_id", lojaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!lojaId,
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
      variacoes: parseVariacoesFromDb(data.variacoes),
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
      const payload = {
        loja_id: lojaId!,
        nome: form.nome,
        descricao: form.descricao || null,
        categoria: form.categoria || null,
        tags: form.tags || null,
        especificacoes: form.especificacoes || null,
        variacoes: serializeVariacoes(form.variacoes),
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

      return { produtoId };
    },
    onSuccess: ({ produtoId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-produtos", lojaId] });
      setShowForm(false);
      toast.success("Produto salvo!");
      // Fire-and-forget: trigger embedding re-indexation via edge function
      if (produtoId) {
        supabase.functions.invoke("catalog-actions", {
          body: { action: "reindex_embeddings", loja_id: lojaId, produto_id: produtoId },
        }).catch(() => {});
      }
    },
    onError: (e: any) => toast.error("Erro ao salvar produto", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-produtos", lojaId] });
      setDeleteId(null);
      toast.success("Produto excluído");
    },
    onError: (e: any) => toast.error("Erro ao excluir produto", { description: e.message }),
  });


  const [uploadingField, setUploadingField] = useState<"foto_principal" | "foto_detalhe" | null>(null);
  const principalInputRef = useRef<HTMLInputElement | null>(null);
  const detailInputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, field }: { file: File; field: "foto_principal" | "foto_detalhe" }) => {
      if (!lojaId) throw new Error("Loja não encontrada");
      if (!file.type.startsWith("image/")) throw new Error("Envie apenas arquivos de imagem");
      if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5MB");

      const fileToBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
              reject(new Error("Falha ao processar arquivo"));
              return;
            }
            resolve(result.split(",")[1] ?? "");
          };
          reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
          reader.readAsDataURL(file);
        });

      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("catalog-actions", {
        body: {
          action: "upload_product_image",
          loja_id: lojaId,
          target_field: field,
          file_name: file.name,
          content_type: file.type,
          base64,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { field, url: data?.publicUrl as string };
    },
    onMutate: ({ field }) => setUploadingField(field),
    onSuccess: ({ field, url }) => {
      set(field, url);
      toast.success("Imagem enviada com sucesso!");
    },
    onError: (e: any) => toast.error("Erro ao enviar imagem", { description: e.message }),
    onSettled: () => setUploadingField(null),
  });

  const handleImageSelected = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "foto_principal" | "foto_detalhe",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadMutation.mutateAsync({ file, field });
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AdminLojaSectionLayout
      lojaId={lojaId!}
      currentPath={location.pathname}
      title="Catálogo de Produtos"
      description={`${produtos?.length ?? 0} produto(s) cadastrado(s) para esta loja.`}
      actions={
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      }
    >

      {/* Filters */}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum produto encontrado</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Adicionar produto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="hidden sm:table-cell">Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.foto_principal ? (
                        <img src={p.foto_principal} alt={p.nome} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.categoria ? (
                        <Badge variant="secondary">{p.categoria}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formatPrice(p.preco_original)}</span>
                        {p.preco_promocional && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(p.preco_promocional)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={p.estoque_disponivel ? "default" : "secondary"} className="text-xs">
                        {p.estoque_disponivel ? "Disponível" : "Indisponível"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(p.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => setDeleteId(p.id)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input placeholder="Nome do produto" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={4} placeholder="Descrição detalhada do produto" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <Input placeholder="sofá, retrátil, cinza, 3 lugares" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Tags melhoram a busca semântica do agente</p>
              </div>
            </div>
            <div>
              <Label>Especificações</Label>
              <Textarea rows={3} placeholder="Dimensões: 2,20m x 90cm. Material: tecido suede." value={form.especificacoes} onChange={(e) => set("especificacoes", e.target.value)} />
            </div>
            <VariationEditor value={form.variacoes} onChange={(v) => set("variacoes", v)} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Preço original *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" className="pl-10" value={form.preco_original} onChange={(e) => set("preco_original", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Preço promocional</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" className="pl-10" value={form.preco_promocional} onChange={(e) => set("preco_promocional", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Produto disponível em estoque</p>
              </div>
              <Switch checked={form.estoque_disponivel} onCheckedChange={(v) => set("estoque_disponivel", v)} />
            </div>
            <div className="space-y-2">
              <Label>Foto principal</Label>
              <div className="flex flex-col gap-3">
                {form.foto_principal ? (
                  <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-border">
                    <img src={form.foto_principal} className="w-full h-full object-cover" alt="Principal" />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => set("foto_principal", "")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <input ref={principalInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageSelected(event, "foto_principal")} />
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => principalInputRef.current?.click()} disabled={uploadingField === "foto_principal"}>
                  {uploadingField === "foto_principal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.foto_principal ? "Alterar foto principal" : "Enviar foto principal"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Foto de detalhe</Label>
              <div className="flex flex-col gap-3">
                {form.foto_detalhe ? (
                  <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-border">
                    <img src={form.foto_detalhe} className="w-full h-full object-cover" alt="Detalhe" />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => set("foto_detalhe", "")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <input ref={detailInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageSelected(event, "foto_detalhe")} />
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => detailInputRef.current?.click()} disabled={uploadingField === "foto_detalhe"}>
                  {uploadingField === "foto_detalhe" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.foto_detalhe ? "Alterar foto detalhe" : "Enviar foto detalhe"}
                </Button>
              </div>
            </div>
            <div>
              <Label>URL do vídeo demonstrativo</Label>
              <Input type="url" placeholder="https://..." value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.nome || !form.preco_original || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLojaSectionLayout>
  );
}
