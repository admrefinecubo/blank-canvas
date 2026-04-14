export type WorkflowJson = {
  connections?: Record<string, { main?: Array<Array<{ index: number; node: string; type: string }>> }>;
  name?: string;
  nodes?: Array<{
    id?: string;
    name?: string;
    parameters?: Record<string, any>;
    type?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
};

export type WorkflowFixSeverity = "critical" | "warning" | "info";
export type WorkflowDiagnosisStatus = "fixed" | "outdated" | "unrecognized" | "invalid";

export interface WorkflowFixDefinition {
  description: string;
  id: string;
  label: string;
  severity: WorkflowFixSeverity;
}

export interface WorkflowFixApplyResult {
  changed: boolean;
  details: string;
  id: string;
}

export interface WorkflowNodeCheck {
  details: string;
  label: string;
  ok: boolean;
}

export interface WorkflowDiagnosis {
  branchSummary: string[];
  description: string;
  nodeChecks: WorkflowNodeCheck[];
  patchSignature: string;
  recommendedFixIds: string[];
  status: WorkflowDiagnosisStatus;
  statusLabel: string;
}

export interface StoredWorkflowEntry {
  diagnosis: WorkflowDiagnosis;
  id: string;
  json: string;
  name: string;
  source: "local" | "preset";
  updatedAt: string;
}

export const WORKFLOW_LIBRARY_STORAGE_KEY = "workflows-editor-library-v2";

export const HOURS_IF_EXPRESSION = "={{ Boolean($json.dentroHorario ?? $json.dentro_horario) }}";

export const BUSINESS_HOURS_FIX_CODE = `const lojaNode = $('Supabase - Carregar Config da Loja (Tenant)').first()?.json ?? {};
const leadNode = $('Supabase - Buscar ou Criar Lead (Upsert)').first()?.json ?? {};
const payloadNode = $('Code - Extrair Campos do Payload').first()?.json ?? {};
const historico = $('Supabase - Carregar Histórico de Conversa (últimas 25)')
  .all()
  .flatMap((item) => Array.isArray(item.json) ? item.json : [item.json])
  .filter(Boolean);

const loja = Array.isArray(lojaNode) ? (lojaNode[0] ?? {}) : lojaNode;
const lead = Array.isArray(leadNode) ? (leadNode[0] ?? {}) : leadNode;

const normalizarTexto = (valor = '') => String(valor)
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const diasMap = {
  dom: 0,
  domingo: 0,
  'domingo-feira': 0,
  seg: 1,
  segunda: 1,
  'segunda-feira': 1,
  ter: 2,
  terca: 2,
  terça: 2,
  'terca-feira': 2,
  'terça-feira': 2,
  qua: 3,
  quarta: 3,
  'quarta-feira': 3,
  qui: 4,
  quinta: 4,
  'quinta-feira': 4,
  sex: 5,
  sexta: 5,
  'sexta-feira': 5,
  sab: 6,
  sabado: 6,
  sábado: 6,
};

const parseHora = (valor, fallback) => {
  const base = String(valor || fallback || '00:00');
  const [horaBruta, minutoBruto] = base.split(':');
  const hora = Number(horaBruta);
  const minuto = Number(minutoBruto);

  return {
    raw: base,
    minutos: (Number.isFinite(hora) ? hora : 0) * 60 + (Number.isFinite(minuto) ? minuto : 0),
  };
};

const agora = new Date();
const brDate = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
const hBR = brDate.getUTCHours();
const mBR = brDate.getUTCMinutes();
const minutosAgora = hBR * 60 + mBR;
const diaSemana = brDate.getUTCDay();

const horaInicioInfo = parseHora(loja.horario_inicio, '08:00');
const horaFimInfo = parseHora(loja.horario_fim, '18:00');
const horaInicio = horaInicioInfo.raw;
const horaFim = horaFimInfo.raw;

const diasBrutos = Array.isArray(loja.dias_funcionamento)
  ? loja.dias_funcionamento
  : String(loja.dias_funcionamento || '')
      .split(',')
      .map((dia) => dia.trim())
      .filter(Boolean);

const diasParseados = diasBrutos
  .map((dia) => diasMap[normalizarTexto(dia)] ?? null)
  .filter((dia) => dia !== null);

const dentroHorario_hora = minutosAgora >= horaInicioInfo.minutos && minutosAgora <= horaFimInfo.minutos;
const dentroDia = diasParseados.length === 0 || diasParseados.includes(diaSemana);
const dentroHorario = dentroHorario_hora && dentroDia;

const historicoFormatado = historico
  .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
  .map((mensagem) => (mensagem.role === 'user' ? 'Cliente' : 'Assistente') + ': ' + (mensagem.content ?? ''))
  .join('\n');

const primeiroContato = historico.length === 0;
const nomeAssistente = loja.nome_assistente_ia || loja.nome_assistente || 'Sofia';

return [{
  json: {
    lead_id: lead.id,
    telefone: lead.telefone,
    nome_lead: lead.nome,
    etapa_pipeline: lead.etapa_pipeline,
    interesse_lead: lead.interesse,
    loja_id: loja.id,
    nome_loja: loja.nome_loja,
    nome_assistente: nomeAssistente,
    tom_voz: loja.tom_voz || 'amigável, profissional e consultivo',
    especialidades: loja.especialidades || 'móveis e colchões',
    horario_inicio: horaInicio,
    horario_fim: horaFim,
    dias_funcionamento: loja.dias_funcionamento || 'seg,ter,qua,qui,sex',
    endereco: loja.endereco || 'Consulte-nos',
    maps_link: loja.maps_link || '',
    formas_pagamento: loja.formas_pagamento || 'Dinheiro, cartão de crédito/débito e PIX',
    politica_troca: loja.politica_troca || '30 dias para troca',
    prazo_entrega: loja.prazo_entrega || '7 a 15 dias úteis',
    frete_gratis_acima: loja.frete_gratis_acima || 1000,
    desconto_carrinho_abandonado: loja.desconto_carrinho_abandonado || 5,
    desconto_promocao_nao_respondida: loja.desconto_promocao_nao_respondida || 10,
    desconto_followup_orcamento: loja.desconto_followup_orcamento || 5,
    regras_personalidade: loja.regras_personalidade || '',
    plataforma_ecommerce: loja.plataforma_ecommerce || 'manual',
    checkout_base_url: loja.checkout_base_url || '',
    montagem_disponivel: loja.montagem_disponivel || false,
    instance: payloadNode.instance,
    remoteJid: payloadNode.remoteJid,
    mensagem_usuario: payloadNode.mensagem_usuario,
    message_id: payloadNode.message_id,
    historico_formatado: historicoFormatado,
    primeiro_contato: primeiroContato,
    dentroHorario: dentroHorario,
    dentro_horario: dentroHorario,
    msg_fora_horario: 'Olá! 🌙 Nossa loja está fechada no momento.\nFuncionamos das ' + horaInicio + ' às ' + horaFim + ' (horário de Brasília), de ' + (loja.dias_funcionamento || 'seg a sex') + '.\nDeixa sua mensagem que retornamos assim que abrirmos! 😊',
    _debug_horario: {
      utc_agora: agora.toISOString(),
      brt_hora: String(hBR).padStart(2, '0') + ':' + String(mBR).padStart(2, '0'),
      minutos_agora: minutosAgora,
      minutos_inicio: horaInicioInfo.minutos,
      minutos_fim: horaFimInfo.minutos,
      dentro_hora: dentroHorario_hora,
      dia_semana_num: diaSemana,
      dias_func_db: loja.dias_funcionamento ?? null,
      dias_parseados: diasParseados,
      dentro_dia: dentroDia,
      dentroHorario: dentroHorario,
      dentro_horario: dentroHorario,
    },
  },
}];`;

const workflowFixes: WorkflowFixDefinition[] = [
  {
    id: "fix-horario",
    label: "Patch horário WF-01",
    description: "Substitui o node de contexto por uma versão robusta com parse de dias, alias dentro_horario e debug confiável.",
    severity: "critical",
  },
  {
    id: "fix-if-boolean",
    label: "Fix IF Dentro do Horário",
    description: "Força validação booleana strict e usa expressão resiliente para dentroHorario/dentro_horario.",
    severity: "warning",
  },
  {
    id: "fix-payload-if",
    label: "Fix IF Validar Payload",
    description: "Troca o typeValidation do payload para strict para evitar comparação frouxa no n8n.",
    severity: "info",
  },
  {
    id: "remove-debug",
    label: "Remover _debug_horario",
    description: "Limpa o bloco de debug do retorno final após validar o comportamento do workflow.",
    severity: "info",
  },
];

export const DEFAULT_SELECTED_FIX_IDS = ["fix-horario", "fix-if-boolean"];

export function getWorkflowFixes(): WorkflowFixDefinition[] {
  return workflowFixes;
}

export function parseWorkflowJson(input: string): WorkflowJson | "invalid" | null {
  if (!input.trim()) return null;

  try {
    return JSON.parse(input) as WorkflowJson;
  } catch {
    return "invalid";
  }
}

export function parseStoredWorkflowLibrary(rawValue: string | null): StoredWorkflowEntry[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createStoredWorkflowEntry(
  name: string,
  json: string,
  source: StoredWorkflowEntry["source"],
): StoredWorkflowEntry {
  const parsed = parseWorkflowJson(json);

  return {
    diagnosis: parsed && parsed !== "invalid" ? diagnoseWorkflow(parsed) : getInvalidDiagnosis(),
    id: slugify(name) + "-" + Date.now(),
    json,
    name,
    source,
    updatedAt: new Date().toISOString(),
  };
}

export function applyWorkflowFixes(workflow: WorkflowJson, selectedFixIds: string[]) {
  const nextWorkflow = JSON.parse(JSON.stringify(workflow)) as WorkflowJson;
  const results: WorkflowFixApplyResult[] = [];

  for (const fix of workflowFixes) {
    if (!selectedFixIds.includes(fix.id)) continue;

    let result: Omit<WorkflowFixApplyResult, "id">;

    switch (fix.id) {
      case "fix-horario":
        result = applyHorarioFix(nextWorkflow);
        break;
      case "fix-if-boolean":
        result = applyHorarioIfFix(nextWorkflow);
        break;
      case "fix-payload-if":
        result = applyPayloadIfFix(nextWorkflow);
        break;
      case "remove-debug":
        result = applyRemoveDebugFix(nextWorkflow);
        break;
      default:
        result = { changed: false, details: "Fix desconhecido." };
    }

    results.push({ id: fix.id, ...result });
  }

  return { results, workflow: nextWorkflow };
}

export function diagnoseWorkflow(workflow: WorkflowJson): WorkflowDiagnosis {
  const nodes = workflow.nodes || [];
  const codeNode = findNodeByName(nodes, ["Checar Horário", "Montar Contexto"]);
  const horarioIfNode = findNodeByName(nodes, ["Dentro do Horário", "Dentro do Horario"]);
  const payloadIfNode = findNodeByName(nodes, ["Validar Payload"]);

  const code = String(codeNode?.parameters?.jsCode || "");
  const horarioCondition = horarioIfNode?.parameters?.conditions?.conditions?.[0];
  const horarioTypeValidation = horarioIfNode?.parameters?.conditions?.options?.typeValidation;
  const payloadTypeValidation = payloadIfNode?.parameters?.conditions?.options?.typeValidation;

  const hasPatchedCode = ["dentro_horario", "dias_parseados", "Array.isArray(lojaNode)"].every((signature) => code.includes(signature));
  const hasStrictHorarioIf = horarioTypeValidation === "strict";
  const hasRobustHorarioExpression = String(horarioCondition?.leftValue || "").includes(HOURS_IF_EXPRESSION.replace("={{ ", "").replace(" }}", ""));
  const hasStrictPayloadIf = payloadTypeValidation === "strict";

  const recommendedFixIds = [
    !hasPatchedCode && "fix-horario",
    (!hasStrictHorarioIf || !hasRobustHorarioExpression) && "fix-if-boolean",
    !hasStrictPayloadIf && payloadIfNode && "fix-payload-if",
  ].filter(Boolean) as string[];

  const status: WorkflowDiagnosisStatus = !codeNode && !horarioIfNode
    ? "unrecognized"
    : hasPatchedCode && hasStrictHorarioIf && hasRobustHorarioExpression
      ? "fixed"
      : "outdated";

  const branchSummary = buildBranchSummary(workflow, codeNode?.name, horarioIfNode?.name);
  const nodeChecks: WorkflowNodeCheck[] = [
    {
      label: "Node de horário",
      ok: Boolean(codeNode),
      details: codeNode ? (hasPatchedCode ? "Patch v2 detectado." : "Node encontrado, mas ainda em versão antiga.") : "Node principal de horário não encontrado.",
    },
    {
      label: "IF Dentro do Horário",
      ok: Boolean(horarioIfNode) && hasStrictHorarioIf && hasRobustHorarioExpression,
      details: horarioIfNode
        ? hasStrictHorarioIf && hasRobustHorarioExpression
          ? "IF está em strict com expressão resiliente."
          : "IF encontrado, mas ainda aceita configuração antiga."
        : "IF do horário não encontrado.",
    },
    {
      label: "IF Validar Payload",
      ok: !payloadIfNode || hasStrictPayloadIf,
      details: payloadIfNode
        ? hasStrictPayloadIf
          ? "Payload IF já está em strict."
          : "Payload IF ainda está com typeValidation loose."
        : "IF de payload não encontrado.",
    },
  ];

  if (status === "fixed") {
    return {
      branchSummary,
      description: "Workflow reconhecido e com o patch de horário v2 aplicado.",
      nodeChecks,
      patchSignature: "wf01-business-hours-v2",
      recommendedFixIds,
      status,
      statusLabel: "Corrigido",
    };
  }

  if (status === "outdated") {
    return {
      branchSummary,
      description: "Workflow reconhecido, mas ainda com sinais da versão antiga do WF-01.",
      nodeChecks,
      patchSignature: "wf01-legacy-hours",
      recommendedFixIds,
      status,
      statusLabel: "Desatualizado",
    };
  }

  return {
    branchSummary,
    description: "Não encontrei a estrutura esperada do WF-01 para aplicar o diagnóstico completo.",
    nodeChecks,
    patchSignature: "workflow-unrecognized",
    recommendedFixIds,
    status,
    statusLabel: "Não reconhecido",
  };
}

function getInvalidDiagnosis(): WorkflowDiagnosis {
  return {
    branchSummary: [],
    description: "O JSON atual não pôde ser lido.",
    nodeChecks: [],
    patchSignature: "invalid-json",
    recommendedFixIds: [],
    status: "invalid",
    statusLabel: "JSON inválido",
  };
}

function findNodeByName(nodes: WorkflowJson["nodes"] = [], patterns: string[]) {
  return nodes.find((node) => {
    const normalizedName = String(node?.name || "").toLowerCase();
    return patterns.some((pattern) => normalizedName.includes(pattern.toLowerCase()));
  }) || null;
}

function applyHorarioFix(workflow: WorkflowJson) {
  const node = findNodeByName(workflow.nodes, ["Checar Horário", "Montar Contexto"]);

  if (!node) {
    return {
      changed: false,
      details: "Node principal de horário não encontrado.",
    };
  }

  const currentCode = String(node.parameters?.jsCode || "");
  const changed = currentCode !== BUSINESS_HOURS_FIX_CODE;
  node.parameters = { ...(node.parameters || {}), jsCode: BUSINESS_HOURS_FIX_CODE };

  return {
    changed,
    details: changed
      ? "✅ Node de horário substituído pelo patch v2 com dias parseados e alias dentro_horario."
      : "Patch v2 de horário já estava aplicado.",
  };
}

function applyHorarioIfFix(workflow: WorkflowJson) {
  const node = findNodeByName(workflow.nodes, ["Dentro do Horário", "Dentro do Horario"]);

  if (!node) {
    return {
      changed: false,
      details: "IF de horário não encontrado.",
    };
  }

  const conditions = node.parameters?.conditions;

  if (!conditions || !Array.isArray(conditions.conditions) || !conditions.conditions[0]) {
    return {
      changed: false,
      details: "IF de horário não tem conditions válidas.",
    };
  }

  const previousType = conditions.options?.typeValidation;
  const previousExpression = conditions.conditions[0].leftValue;

  conditions.options = {
    ...(conditions.options || {}),
    typeValidation: "strict",
  };
  conditions.conditions[0] = {
    ...conditions.conditions[0],
    leftValue: HOURS_IF_EXPRESSION,
    rightValue: true,
  };

  const changed = previousType !== "strict" || previousExpression !== HOURS_IF_EXPRESSION;

  return {
    changed,
    details: changed
      ? "✅ IF de horário atualizado para strict com fallback dentroHorario/dentro_horario."
      : "IF de horário já estava com a configuração correta.",
  };
}

function applyPayloadIfFix(workflow: WorkflowJson) {
  const node = findNodeByName(workflow.nodes, ["Validar Payload"]);

  if (!node) {
    return {
      changed: false,
      details: "IF de payload não encontrado.",
    };
  }

  const conditions = node.parameters?.conditions;

  if (!conditions) {
    return {
      changed: false,
      details: "IF de payload não tem conditions.",
    };
  }

  const previousType = conditions.options?.typeValidation;
  conditions.options = {
    ...(conditions.options || {}),
    typeValidation: "strict",
  };

  return {
    changed: previousType !== "strict",
    details: previousType !== "strict"
      ? "✅ IF de payload alterado para strict."
      : "IF de payload já estava em strict.",
  };
}

function applyRemoveDebugFix(workflow: WorkflowJson) {
  const node = findNodeByName(workflow.nodes, ["Checar Horário", "Montar Contexto"]);

  if (!node) {
    return {
      changed: false,
      details: "Node de horário não encontrado para remover _debug_horario.",
    };
  }

  const currentCode = String(node.parameters?.jsCode || "");

  if (!currentCode.includes("_debug_horario")) {
    return {
      changed: false,
      details: "_debug_horario já não está presente.",
    };
  }

  const nextCode = currentCode.replace(/\n\s*_debug_horario:\s*\{[\s\S]*?\},/m, "");
  node.parameters = { ...(node.parameters || {}), jsCode: nextCode };

  return {
    changed: nextCode !== currentCode,
    details: nextCode !== currentCode
      ? "✅ Bloco _debug_horario removido do node de horário."
      : "Não foi possível remover _debug_horario automaticamente.",
  };
}

function buildBranchSummary(workflow: WorkflowJson, codeNodeName?: string, horarioIfName?: string) {
  const summary: string[] = [
    codeNodeName ? `Code horário: ${codeNodeName}` : "Code horário: não encontrado",
    horarioIfName ? `IF horário: ${horarioIfName}` : "IF horário: não encontrado",
  ];

  if (!horarioIfName) return summary;

  const connections = workflow.connections?.[horarioIfName]?.main || [];
  const trueBranch = (connections[0] || []).map((item) => item.node).join(", ") || "sem destino";
  const falseBranch = (connections[1] || []).map((item) => item.node).join(", ") || "sem destino";

  summary.push(`Saída TRUE: ${trueBranch}`);
  summary.push(`Saída FALSE: ${falseBranch}`);

  return summary;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "workflow";
}