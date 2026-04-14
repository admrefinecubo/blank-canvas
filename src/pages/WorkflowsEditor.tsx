import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Copy,
  FileJson,
  Save,
  Upload,
  Wrench,
  AlertTriangle,
  Database,
  FolderOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  applyWorkflowFixes,
  createStoredWorkflowEntry,
  DEFAULT_SELECTED_FIX_IDS,
  diagnoseWorkflow,
  getWorkflowFixes,
  parseStoredWorkflowLibrary,
  parseWorkflowJson,
  StoredWorkflowEntry,
  WORKFLOW_LIBRARY_STORAGE_KEY,
  WorkflowDiagnosis,
} from "@/lib/workflow-patches";

const PRESET_WORKFLOWS = [
  {
    path: "/workflows/WF-01-fixed.json",
    sourceName: "WF-01 · Agente de Vendas WhatsApp · Patch horário v2",
  },
];

const fixes = getWorkflowFixes();

const badgeVariantByStatus: Record<WorkflowDiagnosis["status"], "default" | "destructive" | "outline" | "secondary"> = {
  fixed: "default",
  invalid: "destructive",
  outdated: "secondary",
  unrecognized: "outline",
};

const badgeVariantBySeverity = {
  critical: "destructive",
  info: "outline",
  warning: "secondary",
} as const;

export default function WorkflowsEditor() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputJson, setInputJson] = useState("");
  const [slotName, setSlotName] = useState("");
  const [selectedFixes, setSelectedFixes] = useState<string[]>(DEFAULT_SELECTED_FIX_IDS);
  const [appliedResults, setAppliedResults] = useState<{ changed: boolean; details: string; id: string }[]>([]);
  const [outputJson, setOutputJson] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<StoredWorkflowEntry[]>([]);
  const [presetWorkflows, setPresetWorkflows] = useState<StoredWorkflowEntry[]>([]);

  const parsedInput = useMemo(() => parseWorkflowJson(inputJson), [inputJson]);
  const parsedOutput = useMemo(() => parseWorkflowJson(outputJson), [outputJson]);

  const currentDiagnosis = useMemo(
    () => (parsedInput && parsedInput !== "invalid" ? diagnoseWorkflow(parsedInput) : null),
    [parsedInput],
  );

  const outputDiagnosis = useMemo(
    () => (parsedOutput && parsedOutput !== "invalid" ? diagnoseWorkflow(parsedOutput) : null),
    [parsedOutput],
  );

  const workflowName = parsedInput && parsedInput !== "invalid" ? parsedInput.name || "Workflow sem nome" : "";
  const nodeCount = parsedInput && parsedInput !== "invalid" ? parsedInput.nodes?.length || 0 : 0;
  const recommendedFixes = currentDiagnosis?.recommendedFixIds || [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSavedWorkflows(parseStoredWorkflowLibrary(window.localStorage.getItem(WORKFLOW_LIBRARY_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    let active = true;

    const loadPresets = async () => {
      const loaded = await Promise.all(
        PRESET_WORKFLOWS.map(async (preset) => {
          try {
            const response = await fetch(preset.path);
            const data = await response.json();
            const json = JSON.stringify(data, null, 2);
            return createStoredWorkflowEntry(data.name || preset.sourceName, json, "preset");
          } catch (error) {
            console.error(`Erro ao carregar preset ${preset.path}:`, error);
            return null;
          }
        }),
      );

      if (active) {
        setPresetWorkflows(loaded.filter(Boolean) as StoredWorkflowEntry[]);
      }
    };

    loadPresets();

    return () => {
      active = false;
    };
  }, []);

  const resetOutputState = () => {
    setOutputJson("");
    setAppliedResults([]);
    setShowPreview(false);
  };

  const persistSavedWorkflows = (entries: StoredWorkflowEntry[]) => {
    setSavedWorkflows(entries);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKFLOW_LIBRARY_STORAGE_KEY, JSON.stringify(entries));
    }
  };

  const saveWorkflowToLibrary = (json: string, fallbackName?: string) => {
    const parsed = parseWorkflowJson(json);

    if (!parsed || parsed === "invalid") {
      toast.error("JSON inválido. Corrija antes de salvar.");
      return;
    }

    const name = (slotName || fallbackName || parsed.name || "Workflow salvo").trim();
    const nextEntry = createStoredWorkflowEntry(name, JSON.stringify(parsed, null, 2), "local");

    persistSavedWorkflows([
      nextEntry,
      ...savedWorkflows.filter((entry) => entry.name !== name),
    ]);

    setSlotName(name);
    toast.success(`Workflow "${name}" salvo no navegador.`);
  };

  const loadWorkflowIntoEditor = (entry: StoredWorkflowEntry) => {
    setInputJson(entry.json);
    setSlotName(entry.name);
    resetOutputState();
    toast.success(`Workflow "${entry.name}" carregado no editor.`);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputJson(text);
      resetOutputState();
      toast.success("JSON colado no editor.");
    } catch {
      toast.error("Não foi possível acessar a área de transferência.");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setInputJson(text);
      setSlotName(file.name.replace(/\.json$/i, ""));
      resetOutputState();
      toast.success(`Arquivo ${file.name} carregado no editor.`);
    } catch {
      toast.error("Não foi possível ler o arquivo enviado.");
    } finally {
      event.target.value = "";
    }
  };

  const handleApplyFixes = () => {
    if (!parsedInput || parsedInput === "invalid") {
      toast.error("JSON inválido. Corrija antes de aplicar os fixes.");
      return;
    }

    const { results, workflow } = applyWorkflowFixes(parsedInput, selectedFixes);
    const nextJson = JSON.stringify(workflow, null, 2);
    const changedCount = results.filter((result) => result.changed).length;
    const correctedName = `${slotName || workflowName || "Workflow"} · Corrigido`;

    setAppliedResults(results);
    setOutputJson(nextJson);
    setShowPreview(true);

    if (changedCount > 0) {
      const nextEntry = createStoredWorkflowEntry(correctedName, nextJson, "local");
      persistSavedWorkflows([
        nextEntry,
        ...savedWorkflows.filter((entry) => entry.name !== correctedName),
      ]);
      toast.success(`${changedCount} fix(es) aplicado(s) e workflow salvo na biblioteca.`);
      return;
    }

    toast.info("Nenhuma alteração foi necessária.");
  };

  const handleCopy = async (json: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success(successMessage);
    } catch {
      toast.error("Erro ao copiar JSON.");
    }
  };

  const toggleFix = (id: string) => {
    setSelectedFixes((current) => (current.includes(id) ? current.filter((fixId) => fixId !== id) : [...current, id]));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/roadmap")}> 
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Workflow Editor</h1>
          </div>
          <Badge variant="outline" className="ml-auto">repositório local de workflows</Badge>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardPaste className="h-4 w-4" /> JSON do workflow
                </CardTitle>
                <CardDescription>Cole, envie um .json ou carregue um workflow salvo para eu corrigir aqui no editor.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePaste} variant="outline" size="sm">
                  <ClipboardPaste className="mr-1 h-4 w-4" /> Colar JSON
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <Upload className="mr-1 h-4 w-4" /> Enviar .json
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleUpload} />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <Textarea
                value={inputJson}
                onChange={(event) => {
                  setInputJson(event.target.value);
                  resetOutputState();
                }}
                placeholder='{"name":"WF-01 · Agente de Vendas...","nodes":[...]}'
                className="min-h-[220px] font-mono text-xs"
              />
              <input
                value={slotName}
                onChange={(event) => setSlotName(event.target.value)}
                placeholder="Nome do slot"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button onClick={() => saveWorkflowToLibrary(outputJson || inputJson, workflowName)} disabled={!(outputJson || inputJson).trim()} className="h-10">
                <Save className="mr-2 h-4 w-4" /> Salvar slot
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {parsedInput === "invalid" && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> JSON inválido
                </Badge>
              )}

              {parsedInput && parsedInput !== "invalid" && currentDiagnosis && (
                <>
                  <Badge variant={badgeVariantByStatus[currentDiagnosis.status]}>{currentDiagnosis.statusLabel}</Badge>
                  <span className="text-muted-foreground">{workflowName} — {nodeCount} nodes</span>
                  <Badge variant="outline">assinatura: {currentDiagnosis.patchSignature}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {currentDiagnosis && parsedInput && parsedInput !== "invalid" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" /> Diagnóstico do workflow carregado
              </CardTitle>
              <CardDescription>{currentDiagnosis.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Branch crítico</p>
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                  {currentDiagnosis.branchSummary.map((item) => (
                    <p key={item} className="text-sm">{item}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Checks</p>
                <div className="space-y-2">
                  {currentDiagnosis.nodeChecks.map((check) => (
                    <div key={check.label} className="rounded-lg border border-border/60 bg-card p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{check.label}</span>
                        <Badge variant={check.ok ? "default" : "secondary"}>{check.ok ? "OK" : "Atenção"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{check.details}</p>
                    </div>
                  ))}
                </div>
                {recommendedFixes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Recomendado agora: {fixes.filter((fix) => recommendedFixes.includes(fix.id)).map((fix) => fix.label).join(", ")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-primary" /> Fixes disponíveis
            </CardTitle>
            <CardDescription>Aplico os patches no JSON carregado e salvo a versão corrigida na biblioteca local.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fixes.map((fix) => {
              const result = appliedResults.find((item) => item.id === fix.id);
              const isRecommended = recommendedFixes.includes(fix.id);

              return (
                <div key={fix.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/30">
                  <Checkbox id={fix.id} checked={selectedFixes.includes(fix.id)} onCheckedChange={() => toggleFix(fix.id)} className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <label htmlFor={fix.id} className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-medium">
                      {fix.label}
                      <Badge variant={badgeVariantBySeverity[fix.severity]}>{fix.severity}</Badge>
                      {isRecommended && <Badge variant="outline">recomendado</Badge>}
                    </label>
                    <p className="text-xs text-muted-foreground">{fix.description}</p>
                  </div>
                  {result && (
                    <Badge variant={result.changed ? "default" : "outline"} className="whitespace-nowrap text-[10px]">
                      {result.changed ? "Aplicado" : "Sem alteração"}
                    </Badge>
                  )}
                </div>
              );
            })}

            <Button onClick={handleApplyFixes} disabled={!parsedInput || parsedInput === "invalid" || selectedFixes.length === 0} className="w-full">
              <Wrench className="mr-2 h-4 w-4" /> Aplicar {selectedFixes.length} fix(es)
            </Button>

            {appliedResults.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="text-xs font-medium text-muted-foreground">Resultado do patch</p>
                {appliedResults.map((result) => (
                  <p key={result.id} className="text-xs font-mono">{result.details}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {outputJson && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Check className="h-4 w-4 text-primary" /> JSON corrigido
                  </CardTitle>
                  <CardDescription>
                    {outputDiagnosis ? `${outputDiagnosis.statusLabel} — ${outputDiagnosis.patchSignature}` : "Workflow corrigido pronto para importar no n8n."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowPreview((current) => !current)} variant="outline" size="sm">
                    {showPreview ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                    {showPreview ? "Ocultar" : "Preview"}
                  </Button>
                  <Button onClick={() => handleCopy(outputJson, "JSON corrigido copiado.")} size="sm">
                    <Copy className="mr-1 h-4 w-4" /> Copiar JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/40 p-4 text-xs font-mono whitespace-pre-wrap break-all">
                  {outputJson}
                </pre>
              </CardContent>
            )}
          </Card>
        )}

        {savedWorkflows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-4 w-4 text-primary" /> Workflows salvos no navegador
              </CardTitle>
              <CardDescription>Os JSONs corrigidos ficam aqui para você reabrir, copiar e manter versões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedWorkflows.map((workflow) => (
                <WorkflowListItem key={workflow.id} workflow={workflow} onCopy={handleCopy} onLoad={loadWorkflowIntoEditor} />
              ))}
            </CardContent>
          </Card>
        )}

        {presetWorkflows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileJson className="h-4 w-4 text-primary" /> Presets prontos para importar
              </CardTitle>
              <CardDescription>WF-01 corrigido e versionado dentro do próprio editor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {presetWorkflows.map((workflow) => (
                <WorkflowListItem key={workflow.id} workflow={workflow} onCopy={handleCopy} onLoad={loadWorkflowIntoEditor} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function WorkflowListItem({
  workflow,
  onCopy,
  onLoad,
}: {
  workflow: StoredWorkflowEntry;
  onCopy: (json: string, successMessage: string) => Promise<void>;
  onLoad: (workflow: StoredWorkflowEntry) => void;
}) {
  const parsed = parseWorkflowJson(workflow.json);
  const nodesCount = parsed && parsed !== "invalid" ? parsed.nodes?.length || 0 : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{workflow.name}</span>
          <Badge variant={workflow.source === "preset" ? "outline" : "secondary"}>{workflow.source === "preset" ? "preset" : "salvo"}</Badge>
          <Badge variant={badgeVariantByStatus[workflow.diagnosis.status]}>{workflow.diagnosis.statusLabel}</Badge>
          <Badge variant="outline">{nodesCount} nodes</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{workflow.diagnosis.patchSignature} · {new Date(workflow.updatedAt).toLocaleString("pt-BR")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onLoad(workflow)}>
          <FolderOpen className="mr-1 h-4 w-4" /> Abrir no editor
        </Button>
        <Button size="sm" onClick={() => void onCopy(workflow.json, `${workflow.name} copiado.`)}>
          <Copy className="mr-1 h-4 w-4" /> Copiar JSON
        </Button>
      </div>
    </div>
  );
}