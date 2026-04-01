import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FileText, Calendar, DollarSign, Settings, BarChart3, MessageSquare, Zap, Star, Package, LayoutDashboard } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: "patient" | "page";
  url: string;
  icon: React.ElementType;
}

const PAGES: SearchResult[] = [
  { id: "dashboard", label: "Dashboard", type: "page", url: "/dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Clientes / Leads", type: "page", url: "/patients", icon: Users },
  { id: "agenda", label: "Agenda / Visitas", type: "page", url: "/agenda", icon: Calendar },
  { id: "budgets", label: "Orçamentos", type: "page", url: "/budgets", icon: FileText },
  { id: "financial", label: "Financeiro", type: "page", url: "/financial", icon: DollarSign },
  { id: "whatsapp", label: "WhatsApp", type: "page", url: "/whatsapp", icon: MessageSquare },
  { id: "procedures", label: "Catálogo de Produtos", type: "page", url: "/procedures", icon: Package },
  { id: "automations", label: "Automações", type: "page", url: "/automations", icon: Zap },
  { id: "reports", label: "Relatórios", type: "page", url: "/reports", icon: BarChart3 },
  { id: "nps", label: "Pós-Venda / Satisfação", type: "page", url: "/nps", icon: Star },
  { id: "settings", label: "Configurações", type: "page", url: "/settings", icon: Settings },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { clinicId } = useAuth();

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    document.addEventListener("open-global-search", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.removeEventListener("open-global-search", openHandler);
    };
  }, []);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults(PAGES);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const pageResults = PAGES.filter(p => p.label.toLowerCase().includes(q));

    if (!clinicId || query.length < 2) {
      setResults(pageResults);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data: patients } = await supabase
          .from("patients")
          .select("id, name, phone, email")
          .eq("clinic_id", clinicId)
          .ilike("name", `%${query}%`)
          .limit(8);

        const patientResults: SearchResult[] = (patients || []).map(p => ({
          id: p.id,
          label: p.name,
          sublabel: p.phone || p.email || "",
          type: "patient" as const,
          url: `/patients/${p.id}`,
          icon: Users,
        }));

        setResults([...patientResults, ...pageResults]);
        setSelectedIndex(0);
      } catch {
        setResults(pageResults);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, clinicId]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selectedIndex, handleSelect]);

  const patients = results.filter(r => r.type === "patient");
  const pages = results.filter(r => r.type === "page");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar clientes, páginas..."
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
            autoFocus
          />
          <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {patients.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Clientes</p>
              {patients.map((r, i) => {
                const globalIdx = results.indexOf(r);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      globalIdx === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <r.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.label}</p>
                      {r.sublabel && <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {pages.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">Páginas</p>
              {pages.map(r => {
                const globalIdx = results.indexOf(r);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      globalIdx === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <r.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {results.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum resultado encontrado</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
