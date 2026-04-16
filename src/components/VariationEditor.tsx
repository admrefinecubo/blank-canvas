import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Variacao {
  nome: string;
  preco?: number | string;
  preco_promocional?: number | string;
  checkout_url?: string;
}

interface VariationEditorProps {
  value: Variacao[];
  onChange: (value: Variacao[]) => void;
}

export function parseVariacoesFromDb(raw: any): Variacao[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Variacao[];
  // Legacy string fallback
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // comma-separated names
      return raw.split(",").map((s: string) => ({ nome: s.trim() })).filter((v: Variacao) => v.nome);
    }
  }
  return [];
}

export function serializeVariacoes(variacoes: Variacao[]): any | null {
  const filtered = variacoes.filter((v) => v.nome.trim());
  if (!filtered.length) return null;
  return filtered.map((v) => ({
    nome: v.nome.trim(),
    ...(v.preco ? { preco: Number(v.preco) } : {}),
    ...(v.preco_promocional ? { preco_promocional: Number(v.preco_promocional) } : {}),
    ...(v.checkout_url?.trim() ? { checkout_url: v.checkout_url.trim() } : {}),
  }));
}

export default function VariationEditor({ value, onChange }: VariationEditorProps) {
  const addRow = () => onChange([...value, { nome: "", preco: "", checkout_url: "" }]);

  const updateRow = (index: number, field: keyof Variacao, val: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Variações</Label>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={addRow}>
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma variação. Clique em "Adicionar" para criar (ex: Casal, Queen, King).</p>
      )}
      {value.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          <div>
            {i === 0 && <p className="text-xs text-muted-foreground mb-1">Nome</p>}
            <Input
              placeholder="Ex: Casal, Queen"
              value={v.nome}
              onChange={(e) => updateRow(i, "nome", e.target.value)}
            />
          </div>
          <div>
            {i === 0 && <p className="text-xs text-muted-foreground mb-1">Preço</p>}
            <Input
              type="number"
              placeholder="R$"
              className="w-24"
              value={v.preco ?? ""}
              onChange={(e) => updateRow(i, "preco", e.target.value)}
            />
          </div>
          <div>
            {i === 0 && <p className="text-xs text-muted-foreground mb-1">Checkout URL</p>}
            <Input
              placeholder="https://..."
              className="w-40"
              value={v.checkout_url ?? ""}
              onChange={(e) => updateRow(i, "checkout_url", e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={() => removeRow(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
