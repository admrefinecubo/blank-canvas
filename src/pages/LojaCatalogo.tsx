import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Package, Upload, ImageIcon, ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
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

const productFormSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto").max(120, "Nome muito longo"),
  descricao: z.string().trim().max(3000, "Descrição muito longa").optional(),
  categoria: z.string().trim().max(80, "Categoria muito longa").optional(),
  preco_original: z.coerce.number().positive("Preço deve ser maior que zero"),
  preco_promocional: z.coerce.number().nonnegative("Preço promocional inválido").nullable(),
  estoque_disponivel: z.boolean(),
  foto_principal: z.string().trim().url("URL da foto principal inválida").nullable(),
  foto_detalhe: z.string().trim().url("URL da foto detalhe inválida").nullable(),
  video_url: z.string().trim().url("URL do vídeo inválida").nullable(),
  checkout_url: z.string().trim().url("Checkout URL inválida").nullable(),
});

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  categoria: "",
  tags: "",
  variacoes: "",
  preco_original: "",
  preco_promocional: "",
  estoque_disponivel: true,
  foto_principal: "",
  foto_detalhe: "",
  video_url: "",
  checkout_url: "",
};

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

const normalizeOptionalUrl = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseTagsInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string" || !item.trim())) {
      throw new Error("Tags devem ser um array JSON de strings ou uma lista separada por vírgula");
    }
    return JSON.stringify(parsed.map((item) => item.trim()));
  }

  const tags = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!tags.length) {
    throw new Error("Informe ao menos uma tag válida");
  }

  return JSON.stringify(tags);
};

const parseVariationsInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) {
    throw new Error("Variações devem ser um array JSON");
  }
  return JSON.stringify(parsed);
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
  
  const [uploadingField, setUploadingField] = useState<"foto_principal" | "foto_detalhe" | null>(null);
  const principalInputRef = useRef<HTMLInputElement | null>(null);
  const detailInputRef = useRef<HTMLInputElement | null>(null);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["loja-produtos", activeLojaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .select("id, nome, categoria, preco_original, preco_promocional, estoque_disponivel, foto_principal, checkout_url, created_at")
        .eq("loja_id", activeLojaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  const categoryOptions = useMemo(() => {
    const dynamicCategories = (produtos ?? [])
      .map((item) => item.categoria)
      .filter((item): item is string => Boolean(item));
    return Array.from(new Set([...CATEGORIAS, ...dynamicCategories])).sort((a, b) => a.localeCompare(b));
  }, [produtos]);

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
    const { data } = await (supabase as any).from("produtos").select("*").eq("id", prodId).single();
    if (!data) return;
    setEditId(prodId);
    setForm({
      nome: data.nome || "",
      descricao: data.descricao || "",
      categoria: data.categoria || "",
      tags: data.tags || "",
      variacoes: data.variacoes || "",
      preco_original: data.preco_original?.toString() || "",
      preco_promocional: data.preco_promocional?.toString() || "",
      estoque_disponivel: data.estoque_disponivel ?? true,
      foto_principal: data.foto_principal || "",
      foto_detalhe: data.foto_detalhe || "",
      video_url: data.video_url || "",
      checkout_url: data.checkout_url || "",
    });
    
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = parseTagsInput(form.tags);
      const variacoes = parseVariationsInput(form.variacoes);

      const parsedForm = productFormSchema.parse({
        nome: form.nome,
        descricao: form.descricao.trim() || undefined,
        categoria: form.categoria.trim() || undefined,
        preco_original: form.preco_original,
        preco_promocional: form.preco_promocional.trim() ? form.preco_promocional : null,
        estoque_disponivel: form.estoque_disponivel,
        foto_principal: normalizeOptionalUrl(form.foto_principal),
        foto_detalhe: normalizeOptionalUrl(form.foto_detalhe),
        video_url: normalizeOptionalUrl(form.video_url),
        checkout_url: normalizeOptionalUrl(form.checkout_url),
      });

      const payload = {
        loja_id: activeLojaId!,
        nome: parsedForm.nome,
        descricao: parsedForm.descricao || null,
        categoria: parsedForm.categoria || null,
        tags,
        variacoes,
        preco_original: parsedForm.preco_original,
        preco_promocional: parsedForm.preco_promocional,
        estoque_disponivel: parsedForm.estoque_disponivel,
        foto_principal: parsedForm.foto_principal,
        foto_detalhe: parsedForm.foto_detalhe,
        video_url: parsedForm.video_url,
        checkout_url: parsedForm.checkout_url,
      };

      let produtoId = editId;
      if (editId) {
        const { data, error } = await (supabase as any).from("produtos").update(payload).eq("id", editId).select("id").single();
        if (error) throw error;
        produtoId = data.id;
      } else {
        const { data, error } = await (supabase as any).from("produtos").insert(payload).select("id").single();
        if (error) throw error;
        produtoId = data.id;
      }

      return { produtoId };
    },
    onSuccess: ({ produtoId }) => {
      queryClient.invalidateQueries({ queryKey: ["loja-produtos", activeLojaId] });
      setShowForm(false);
      toast.success("Produto salvo!");
      // Fire-and-forget: trigger embedding re-indexation via edge function
      if (produtoId) {
        supabase.functions.invoke("catalog-actions", {
          body: { action: "reindex_embeddings", loja_id: activeLojaId, produto_id: produtoId },
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
      queryClient.invalidateQueries({ queryKey: ["loja-produtos", activeLojaId] });
      setDeleteId(null);
      toast.success("Produto excluído");
    },
    onError: (e: any) => toast.error("Erro ao excluir produto", { description: e.message }),
  });


  const uploadMutation = useMutation({
    mutationFn: async ({ file, field }: { file: File; field: "foto_principal" | "foto_detalhe" }) => {
      if (!activeLojaId) throw new Error("Loja não encontrada");
      if (!file.type.startsWith("image/")) throw new Error("Envie apenas arquivos de imagem");
      if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5MB");

      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("catalog-actions", {
        body: {
          action: "upload_product_image",
          loja_id: activeLojaId,
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

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleImageSelected = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "foto_principal" | "foto_detalhe",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadMutation.mutateAsync({ file, field });
  };

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
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Produto</Button>
        </div>
      </div>


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {(() => {
        const promos = (produtos ?? []).filter(
          (p) => p.preco_promocional != null && Number(p.preco_promocional) > 0
        );
        if (!promos.length) return null;
        return (
          <>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">🔥 Promoções em Destaque</h2>
                <p className="text-sm text-muted-foreground">{promos.length} produto{promos.length > 1 ? "s" : ""} em oferta</p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {promos.map((produto) => {
                  const original = Number(produto.preco_original || 0);
                  const promo = Number(produto.preco_promocional);
                  const discount = original > 0 ? Math.round((1 - promo / original) * 100) : 0;
                  return (
                    <Card key={produto.id} className="relative overflow-hidden">
                      <Badge className="absolute right-2 top-2 z-10 bg-destructive text-destructive-foreground">PROMOÇÃO</Badge>
                      <div className="aspect-square w-full overflow-hidden bg-muted/40">
                        {produto.foto_principal ? (
                          <img src={produto.foto_principal} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium">{produto.nome}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-destructive">{formatPrice(promo)}</span>
                          {discount > 0 && (
                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">{discount}% OFF</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-through">{formatPrice(original)}</p>
                        <Badge variant={produto.estoque_disponivel ? "default" : "secondary"} className="text-[10px]">
                          {produto.estoque_disponivel ? "Disponível" : "Esgotado"}
                        </Badge>
                        <Button variant="outline" size="sm" className="mt-1 w-full gap-1.5" onClick={() => openEdit(produto.id)}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        );
      })()}

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
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                          {produto.foto_principal ? <img src={produto.foto_principal} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
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
                        {produto.checkout_url ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={produto.checkout_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
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
            <div><Label>Categoria</Label><Select value={form.categoria} onValueChange={(value) => set("categoria", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Preço</Label><Input type="number" min="0" step="0.01" value={form.preco_original} onChange={(e) => set("preco_original", e.target.value)} /></div>
            <div><Label>Preço promocional</Label><Input type="number" value={form.preco_promocional} onChange={(e) => set("preco_promocional", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={4} /></div>
            <div className="md:col-span-2"><Label>Tags</Label><Textarea value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder='["colchão","casal","mola"] ou separado por vírgula' rows={2} /></div>
            <div className="md:col-span-2"><Label>Variações (JSON)</Label><Textarea value={form.variacoes} onChange={(e) => set("variacoes", e.target.value)} placeholder='[{"tamanho":"Queen","preco":1899}]' rows={4} /></div>
            <div className="md:col-span-2"><Label>Checkout URL</Label><Input value={form.checkout_url} onChange={(e) => set("checkout_url", e.target.value)} placeholder="https://checkout.sualoja.com/produto" /></div>
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
              <Label>Foto detalhe</Label>
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