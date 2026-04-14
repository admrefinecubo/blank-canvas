import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, ClipboardPaste, Copy, Check, Wrench, AlertTriangle,
  Clock, FileJson, Bug, ChevronDown, ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Fix definitions ──
interface Fix {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  severity: "critical" | "warning" | "info";
  apply: (workflow: any) => { workflow: any; changed: boolean; details: string };
}

const BUSINESS_HOURS_FIX_CODE = `const loja = $('Supabase - Carregar Config da Loja (Tenant)').first()?.json || {};
const historico = $('Supabase - Carregar Histórico de Conversa (últimas 25)').all().map(i => i.json);
const lead = $('Supabase - Buscar ou Criar Lead (Upsert)').first().json;
const payloadNode = $('Code - Extrair Campos do Payload').first().json;

// Brasil = UTC-3 fixo (sem DST desde 2019)
const agora = new Date();
const brDate = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
const hBR = brDate.getUTCHours();
const mBR = brDate.getUTCMinutes();
const minutosAgora = hBR * 60 + mBR;
const diaSemana = brDate.getUTCDay(); // 0=Dom, 1=Seg, ..., 6=Sab

const horaInicio = loja.horario_inicio || '08:00';
const horaFim    = loja.horario_fim    || '18:00';
const [hIni, mIni] = horaInicio.split(':').map(Number);
const [hFim, mFim] = horaFim.split(':').map(Number);
const minutosInicio = hIni * 60 + (mIni || 0);
const minutosFim    = hFim * 60 + (mFim || 0);
const dentroHorario_hora = minutosAgora >= minutosInicio && minutosAgora <= minutosFim;

// Dias de funcionamento — aceita "seg", "segunda", "segunda-feira", etc.
const diasMap = {
  dom: 0, domingo: 0, 'domingo-feira': 0,
  seg: 1, segunda: 1, 'segunda-feira': 1,
  ter: 2, terca: 2, terça: 2, 'terca-feira': 2, 'terça-feira': 2,
  qua: 3, quarta: 3, 'quarta-feira': 3,
  qui: 4, quinta: 4, 'quinta-feira': 4,
  sex: 5, sexta: 5, 'sexta-feira': 5,
  sab: 6, sabado: 6, sábado: 6,
};
const diasFuncionamento = loja.dias_funcionamento
  ? loja.dias_funcionamento.split(',').map(d => {
      const key = d.trim().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      return diasMap[key] ?? diasMap[d.trim().toLowerCase()];
    }).filter(d => d !== undefined && d !== null)
  : null;
const dentroDia = !diasFuncionamento || diasFuncionamento.length === 0 || diasFuncionamento.includes(diaSemana);
const dentroHorario = dentroHorario_hora && dentroDia;

// Formatar histórico para o prompt
const historicoFormatado = historico
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map(m => \`\${m.role === 'user' ? 'Cliente' : 'Assistente'}: \${m.content}\`)
  .join('\\n');

const primeiroContato = historico.length === 0;
const nomeAssistente = loja.nome_assistente_ia || loja.nome_assistente || 'Sofia';`;

function findNodeByName(nodes: any[], patterns: string[]): any | null {
  for (const node of nodes) {
    const name = (node.name || "").toLowerCase();
    if (patterns.some(p => name.includes(p.toLowerCase()))) return node;
  }
  return null;
}

const fixes: Fix[] = [
  {
    id: "fix-horario",
    label: "Fix Horário Comercial (BRT)",
    description: "Corrige mapeamento de dias (aceita 'seg', 'segunda', 'segunda-feira', etc.), normaliza acentos, e garante conversão UTC→BRT correta com getUTCHours(). Também corrige parse de minutos com fallback para 0.",
    icon: <Clock className="h-4 w-4" />,
    severity: "critical",
    apply: (workflow) => {
      const nodes = workflow.nodes || [];
      const node = findNodeByName(nodes, ["Checar Horário", "Montar Contexto"]);
      if (!node) return { workflow, changed: false, details: "Node 'Checar Horário + Montar Contexto' não encontrado." };

      const oldCode = node.parameters?.jsCode || "";
      if (!oldCode.includes("diasNumericos") && !oldCode.includes("dentroHorario")) {
        return { workflow, changed: false, details: "Node encontrado mas não contém lógica de horário." };
      }

      // Extract the return statement part (everything after the business hours logic)
      const returnMatch = oldCode.match(/return \[\{[\s\S]*$/);
      if (!returnMatch) return { workflow, changed: false, details: "Não encontrou bloco return no código." };

      node.parameters.jsCode = BUSINESS_HOURS_FIX_CODE + "\n\n" + returnMatch[0];
      return {
        workflow,
        changed: true,
        details: "✅ Mapeamento de dias expandido (seg/segunda/segunda-feira + sem acento). Conversão UTC→BRT validada. Parse de minutos com fallback."
      };
    }
  },
  {
    id: "fix-if-boolean",
    label: "Fix IF Boolean (typeValidation)",
    description: "Altera typeValidation do IF de horário de 'loose' para 'strict' para evitar comparação incorreta de boolean.",
    icon: <Bug className="h-4 w-4" />,
    severity: "warning",
    apply: (workflow) => {
      const nodes = workflow.nodes || [];
      const node = findNodeByName(nodes, ["Dentro do Horário", "IF - Dentro"]);
      if (!node) return { workflow, changed: false, details: "Node IF de horário não encontrado." };

      const conditions = node.parameters?.conditions;
      if (!conditions) return { workflow, changed: false, details: "Node IF não tem conditions." };

      if (conditions.options?.typeValidation === "loose") {
        conditions.options.typeValidation = "strict";
        return { workflow, changed: true, details: "✅ typeValidation alterado de 'loose' para 'strict'." };
      }
      return { workflow, changed: false, details: "typeValidation já está correto." };
    }
  },
  {
    id: "remove-debug",
    label: "Remover _debug_horario",
    description: "Remove o bloco _debug_horario do return para limpar o output em produção.",
    icon: <Wrench className="h-4 w-4" />,
    severity: "info",
    apply: (workflow) => {
      const nodes = workflow.nodes || [];
      const node = findNodeByName(nodes, ["Checar Horário", "Montar Contexto"]);
      if (!node) return { workflow, changed: false, details: "Node não encontrado." };

      const code = node.parameters?.jsCode || "";
      if (!code.includes("_debug_horario")) {
        return { workflow, changed: false, details: "_debug_horario não encontrado no código." };
      }

      // Remove the debug block
      node.parameters.jsCode = code.replace(/,?\s*\/\/\s*DEBUG[\s\S]*?_debug_horario:\s*\{[\s\S]*?\}\s*\n/g, "\n");
      return { workflow, changed: true, details: "✅ Bloco _debug_horario removido." };
    }
  }
];

export default function WorkflowsEditor() {
  const navigate = useNavigate();
  const [inputJson, setInputJson] = useState("");
  const [selectedFixes, setSelectedFixes] = useState<string[]>(["fix-horario", "fix-if-boolean"]);
  const [appliedResults, setAppliedResults] = useState<{ id: string; details: string; changed: boolean }[]>([]);
  const [outputJson, setOutputJson] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [fixedWorkflows, setFixedWorkflows] = useState<{ name: string; json: string }[]>([]);

  // Load pre-fixed workflows
  const loadFixedWF01 = async () => {
    try {
      const res = await fetch("/workflows/WF-01-fixed.json");
      const data = await res.json();
      const jsonStr = JSON.stringify(data, null, 2);
      setFixedWorkflows(prev => {
        const exists = prev.find(w => w.name === "WF-01");
        if (exists) return prev;
        return [...prev, { name: "WF-01 · Agente de Vendas (CORRIGIDO)", json: jsonStr }];
      });
    } catch (e) {
      console.error("Erro ao carregar WF-01 fixado:", e);
    }
  };

  useEffect(() => { loadFixedWF01(); }, []);

  const parsedInput = useMemo(() => {
    if (!inputJson.trim()) return null;
    try {
      return JSON.parse(inputJson);
    } catch {
      return "invalid";
    }
  }, [inputJson]);

  const nodeCount = parsedInput && parsedInput !== "invalid" ? (parsedInput.nodes?.length || 0) : 0;
  const workflowName = parsedInput && parsedInput !== "invalid" ? (parsedInput.name || "Sem nome") : "";

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputJson(text);
      setOutputJson("");
      setAppliedResults([]);
      toast.success("JSON colado da área de transferência");
    } catch {
      toast.error("Não foi possível acessar a área de transferência");
    }
  };

  const handleApplyFixes = () => {
    if (!parsedInput || parsedInput === "invalid") {
      toast.error("JSON inválido. Corrija antes de aplicar fixes.");
      return;
    }

    let wf = JSON.parse(JSON.stringify(parsedInput)); // deep clone
    const results: typeof appliedResults = [];

    for (const fix of fixes) {
      if (!selectedFixes.includes(fix.id)) continue;
      const result = fix.apply(wf);
      wf = result.workflow;
      results.push({ id: fix.id, details: result.details, changed: result.changed });
    }

    setAppliedResults(results);
    setOutputJson(JSON.stringify(wf, null, 2));

    const changedCount = results.filter(r => r.changed).length;
    if (changedCount > 0) {
      toast.success(`${changedCount} fix(es) aplicado(s) com sucesso!`);
    } else {
      toast.info("Nenhuma alteração foi necessária.");
    }
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputJson || inputJson);
      toast.success("JSON copiado para a área de transferência!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const toggleFix = (id: string) => {
    setSelectedFixes(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/roadmap")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Workflow Editor</h1>
          </div>
          <Badge variant="outline" className="ml-auto">n8n JSON Patcher</Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Input */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4" /> Colar Workflow JSON
                </CardTitle>
                <CardDescription>Cole o JSON exportado do n8n aqui</CardDescription>
              </div>
              <Button onClick={handlePaste} variant="outline" size="sm">
                <ClipboardPaste className="h-4 w-4 mr-1" /> Colar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={inputJson}
              onChange={(e) => { setInputJson(e.target.value); setOutputJson(""); setAppliedResults([]); }}
              placeholder='{"name": "WF-01 · Agente de Vendas...", "nodes": [...]}'
              className="font-mono text-xs min-h-[160px] max-h-[300px]"
            />
            <div className="flex items-center gap-3 text-sm">
              {parsedInput === "invalid" && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> JSON inválido
                </Badge>
              )}
              {parsedInput && parsedInput !== "invalid" && (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> JSON válido
                  </Badge>
                  <span className="text-muted-foreground">{workflowName} — {nodeCount} nodes</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fixes */}
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" /> Fixes Disponíveis
            </CardTitle>
            <CardDescription>Selecione os patches para aplicar no workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fixes.map((fix) => (
              <div key={fix.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-accent/30 transition-colors">
                <Checkbox
                  id={fix.id}
                  checked={selectedFixes.includes(fix.id)}
                  onCheckedChange={() => toggleFix(fix.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <label htmlFor={fix.id} className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                    {fix.icon}
                    {fix.label}
                    <Badge variant={fix.severity === "critical" ? "destructive" : fix.severity === "warning" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                      {fix.severity}
                    </Badge>
                  </label>
                  <p className="text-xs text-muted-foreground">{fix.description}</p>
                </div>
                {appliedResults.find(r => r.id === fix.id) && (
                  <Badge variant={appliedResults.find(r => r.id === fix.id)?.changed ? "default" : "outline"} className="text-[10px] whitespace-nowrap">
                    {appliedResults.find(r => r.id === fix.id)?.changed ? "Aplicado" : "Sem alteração"}
                  </Badge>
                )}
              </div>
            ))}

            <Button
              onClick={handleApplyFixes}
              disabled={!parsedInput || parsedInput === "invalid" || selectedFixes.length === 0}
              className="w-full"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Aplicar {selectedFixes.length} Fix(es)
            </Button>

            {/* Results */}
            {appliedResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-xs font-medium text-muted-foreground">Resultados:</p>
                {appliedResults.map((r) => (
                  <p key={r.id} className="text-xs font-mono">{r.details}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output */}
        {outputJson && (
          <Card className="border-green-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> JSON Corrigido
                  </CardTitle>
                  <CardDescription>Copie e cole no n8n (importar workflow)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
                    {showPreview ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {showPreview ? "Ocultar" : "Preview"}
                  </Button>
                  <Button onClick={handleCopyOutput} size="sm">
                    <Copy className="h-4 w-4 mr-1" /> Copiar JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap break-all">
                  {outputJson}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {/* Pre-fixed Workflows */}
        {fixedWorkflows.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Workflows Corrigidos (prontos para importar)
              </CardTitle>
              <CardDescription>JSONs já corrigidos — copie e importe no n8n</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fixedWorkflows.map((wf, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{wf.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {JSON.parse(wf.json).nodes?.length || 0} nodes
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOutputJson(wf.json);
                        setShowPreview(true);
                        toast.success(`Preview do ${wf.name} carregado`);
                      }}
                    >
                      <ChevronDown className="h-4 w-4 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(wf.json);
                          toast.success(`${wf.name} copiado! Cole no n8n (importar workflow)`);
                        } catch {
                          toast.error("Erro ao copiar");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar JSON
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
