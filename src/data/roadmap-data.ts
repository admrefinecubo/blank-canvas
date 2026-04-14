export type ItemStatus = "done" | "in_progress" | "pending";
export type Priority = "Alta" | "Média" | "Baixa";

export interface ChecklistItem {
  number: number;
  functionality: string;
  status: ItemStatus;
  priority: Priority;
  observations?: string;
}

export interface ChecklistBlock {
  name: string;
  items: ChecklistItem[];
}

export interface Workflow {
  id: string;
  name: string;
  nodes: string[];
}

export const checklistBlocks: ChecklistBlock[] = [
  {
    name: "1. Identidade e Personalidade",
    items: [
      { number: 1, functionality: "Nome personalizável do assistente por loja/tenant", status: "pending", priority: "Alta" },
      { number: 2, functionality: "Especialidades configuráveis (colchões, sofás, móveis planejados, etc.)", status: "pending", priority: "Alta" },
      { number: 3, functionality: "Tom de voz configurável por loja", status: "pending", priority: "Alta" },
      { number: 4, functionality: "Regras de personalidade configuráveis por loja", status: "pending", priority: "Alta" },
      { number: 5, functionality: "Atuação como consultor — não apenas atendente", status: "pending", priority: "Alta" },
      { number: 6, functionality: "Comunicação natural, educada, amigável e objetiva", status: "pending", priority: "Alta" },
      { number: 7, functionality: "Respostas curtas que avançam a conversa", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "2. Regras Absolutas e Segurança",
    items: [
      { number: 8, functionality: "NUNCA inventar produtos, preços ou disponibilidade", status: "pending", priority: "Alta" },
      { number: 9, functionality: "Sempre consultar catálogo antes de oferecer produto (buscar_produto_no_catalogo)", status: "pending", priority: "Alta" },
      { number: 10, functionality: "Vender apenas produtos da loja configurada (tenant)", status: "pending", priority: "Alta" },
      { number: 11, functionality: "Informar indisponibilidade e sugerir alternativas", status: "pending", priority: "Alta" },
      { number: 12, functionality: "Nunca iniciar conversa com preço — entender necessidade antes", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "3. Fluxo de Vendas",
    items: [
      { number: 13, functionality: "Recepção / saudação inicial", status: "pending", priority: "Alta" },
      { number: 14, functionality: "Diagnóstico do cliente (perguntas estratégicas)", status: "pending", priority: "Alta" },
      { number: 15, functionality: "Entendimento do ambiente ou necessidade", status: "pending", priority: "Alta" },
      { number: 16, functionality: "Construção de valor (ajudar a imaginar o resultado)", status: "pending", priority: "Alta" },
      { number: 17, functionality: "Apresentação de até 3 opções (econômico / custo-benefício / premium)", status: "pending", priority: "Alta" },
      { number: 18, functionality: "Tratamento de objeções (ex: 'está caro')", status: "pending", priority: "Alta" },
      { number: 19, functionality: "Fechamento da venda", status: "pending", priority: "Alta" },
      { number: 20, functionality: "Cross-sell / Upsell de produtos complementares", status: "pending", priority: "Média" },
      { number: 21, functionality: "Pós-venda", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "4. Diagnóstico e Qualificação",
    items: [
      { number: 22, functionality: "Diagnóstico geral: produto, ambiente, tamanho do espaço, estilo", status: "pending", priority: "Alta" },
      { number: 23, functionality: "Diagnóstico para Sala (rack, painel, TV, sofá)", status: "pending", priority: "Alta" },
      { number: 24, functionality: "Diagnóstico para Quarto (cama, guarda-roupa, criado-mudo)", status: "pending", priority: "Alta" },
      { number: 25, functionality: "Diagnóstico para Sala de Jantar (mesa, cadeiras, aparador)", status: "pending", priority: "Alta" },
      { number: 26, functionality: "Diagnóstico para Colchões (tamanho, peso, dores, mola/espuma)", status: "pending", priority: "Alta" },
      { number: 27, functionality: "Diagnóstico para Móveis Planejados (dimensões + estilo)", status: "pending", priority: "Alta" },
      { number: 28, functionality: "Qualificação por orçamento (faixa, parcelamento, promoções)", status: "pending", priority: "Média" },
      { number: 29, functionality: "Cobertura de outras categorias: puffs, escrivaninhas, beliches, etc.", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "5. Catálogo e RAG",
    items: [
      { number: 30, functionality: "Busca semântica no catálogo via RAG (vetorização por produto)", status: "pending", priority: "Alta" },
      { number: 31, functionality: "Schema completo: nome, descrição, specs, variações, preços, estoque, checkout", status: "pending", priority: "Alta" },
      { number: 32, functionality: "Mídias por produto: foto principal, foto detalhe, vídeo demonstrativo", status: "pending", priority: "Alta" },
      { number: 33, functionality: "Tags por produto para busca semântica", status: "pending", priority: "Alta" },
      { number: 34, functionality: "Campo estoque_disponivel sincronizado em tempo real", status: "pending", priority: "Alta" },
      { number: 35, functionality: "Preço promocional por variação de produto", status: "pending", priority: "Alta" },
      { number: 36, functionality: "Suporte multi-tenant (catálogo separado por loja)", status: "pending", priority: "Alta" },
      { number: 37, functionality: "Re-indexação automática ao atualizar produto no catálogo", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "6. Enviar Link de Produtos E-commerce",
    items: [
      { number: 38, functionality: "Shopify", status: "pending", priority: "Alta" },
      { number: 39, functionality: "Nuvemshop", status: "pending", priority: "Alta" },
      { number: 40, functionality: "Tray", status: "pending", priority: "Média" },
      { number: 41, functionality: "VTEX", status: "pending", priority: "Média" },
      { number: 42, functionality: "VendiZap", status: "pending", priority: "Média" },
      { number: 43, functionality: "Webhook de atualização de estoque e preço em tempo real", status: "pending", priority: "Alta" },
      { number: 44, functionality: "Sync automático do catálogo ao receber webhook", status: "pending", priority: "Alta" },
      { number: 45, functionality: "Links de checkout por variação de produto", status: "pending", priority: "Alta" },
      { number: 46, functionality: "Botão interativo 'Comprar Agora' via WhatsApp Business API", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "7. Ferramentas do Agente (Tool Calling)",
    items: [
      { number: 47, functionality: "buscar_produto_no_catalogo — filtros: query, categoria, tamanho, preço, disponível", status: "pending", priority: "Alta" },
      { number: 48, functionality: "enviar_midia_whatsapp — fotos e vídeos direto no chat (com legenda e delay)", status: "pending", priority: "Alta" },
      { number: 49, functionality: "agendar_visita_loja_fisica — visita presencial com confirmação + Google Maps", status: "pending", priority: "Alta" },
      { number: 50, functionality: "gerar_orcamento_formal — PDF com itens, descontos, pagamento e validade", status: "pending", priority: "Alta" },
      { number: 51, functionality: "agendar_follow_up_medidas — follow-up automático (medidas, carrinho, orçamento)", status: "pending", priority: "Alta" },
      { number: 52, functionality: "cadastrar_lead — CRM com nome, telefone, e-mail, interesse e origem", status: "pending", priority: "Alta" },
      { number: 53, functionality: "mover_pipeline — mover card no funil de vendas entre etapas", status: "pending", priority: "Alta" },
      { number: 54, functionality: "gerar_cobranca — gerar link de pagamento", status: "pending", priority: "Alta" },
      { number: 55, functionality: "transferir_para_humano — transbordo com resumo e prioridade", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "8. Automações de Follow-up",
    items: [
      { number: 56, functionality: "Follow-up para clientes que interagiram pouco (msgs iniciais sem avançar)", status: "pending", priority: "Alta" },
      { number: 57, functionality: "Follow-up de carrinho abandonado (com oferta de desconto 5% ou 10%)", status: "pending", priority: "Alta" },
      { number: 58, functionality: "Follow-up de promoção não respondida (com oferta de desconto 5% ou 10%)", status: "pending", priority: "Alta" },
      { number: 59, functionality: "Follow-up de orçamento pendente", status: "pending", priority: "Alta" },
      { number: 60, functionality: "Follow-up pós-visita à loja", status: "pending", priority: "Média" },
      { number: 61, functionality: "Follow-up de medidas do ambiente (cliente pediu tempo para medir)", status: "pending", priority: "Média" },
      { number: 62, functionality: "Follow-up pós-venda (avaliação da compra e da loja)", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "9. Promoções e Segmentação",
    items: [
      { number: 63, functionality: "Disparo de promoções para clientes com perfil adequado no CRM", status: "pending", priority: "Alta" },
      { number: 64, functionality: "Segmentação por perfil de interesse (ex: colchão premium → promoção de colchão)", status: "pending", priority: "Alta" },
      { number: 65, functionality: "Desconto configurável para recuperação de carrinho abandonado", status: "pending", priority: "Alta" },
      { number: 66, functionality: "Desconto configurável para follow-up de promoção não respondida", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "10. CRM e Pipeline de Vendas",
    items: [
      { number: 67, functionality: "Cadastro automático de lead ao primeiro contato", status: "pending", priority: "Alta" },
      { number: 68, functionality: "Registro do canal de origem (WhatsApp, tráfego pago, Instagram, Google, etc.)", status: "pending", priority: "Alta" },
      { number: 69, functionality: "Histórico do cliente: última interação, produtos vistos, status, follow-ups", status: "pending", priority: "Alta" },
      { number: 70, functionality: "Movimentação automática no funil após cada etapa da venda", status: "pending", priority: "Alta" },
      { number: 71, functionality: "Tracking de visualização de produto ao enviar mídia", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "11. Envio de Mídias e Checkout",
    items: [
      { number: 72, functionality: "Envio de fotos do produto com legenda no WhatsApp", status: "pending", priority: "Alta" },
      { number: 73, functionality: "Envio de vídeos demonstrativos do produto no WhatsApp", status: "pending", priority: "Alta" },
      { number: 74, functionality: "Delay entre envios (anti-spam, 1,5s entre itens)", status: "pending", priority: "Alta" },
      { number: 75, functionality: "Ordem correta de processamento: mídia → texto → CRM", status: "pending", priority: "Alta" },
      { number: 76, functionality: "Botão interativo 'Comprar Agora' com link de checkout e foto", status: "pending", priority: "Alta" },
      { number: 77, functionality: "Follow-up automático de carrinho abandonado 24h após envio do link", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "12. Regras de Negócio por Loja",
    items: [
      { number: 78, functionality: "Horário de funcionamento configurável", status: "pending", priority: "Alta" },
      { number: 79, functionality: "Endereço da loja configurável", status: "pending", priority: "Alta" },
      { number: 80, functionality: "Link do Google Maps configurável", status: "pending", priority: "Alta" },
      { number: 81, functionality: "Formas de pagamento aceitas configuráveis", status: "pending", priority: "Alta" },
      { number: 82, functionality: "Política de troca configurável", status: "pending", priority: "Alta" },
      { number: 83, functionality: "Prazo de entrega configurável", status: "pending", priority: "Alta" },
      { number: 84, functionality: "Frete grátis acima de valor configurável", status: "pending", priority: "Alta" },
      { number: 85, functionality: "Plataforma de e-commerce utilizada configurável", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "13. Cross-sell e Upsell",
    items: [
      { number: 86, functionality: "Sugestão por ambiente: sala (rack+painel+mesa centro), quarto (cama+colchão+criado)", status: "pending", priority: "Alta" },
      { number: 87, functionality: "Upsell: cama → colchão; colchão → travesseiro; rack → painel", status: "pending", priority: "Alta" },
      { number: 88, functionality: "Apresentação de conjuntos completos por ambiente", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "14. Logística",
    items: [
      { number: 89, functionality: "Confirmação de preferência: retirada na loja ou entrega em casa", status: "pending", priority: "Alta" },
      { number: 90, functionality: "Informação de prazo de entrega por região", status: "pending", priority: "Alta" },
      { number: 91, functionality: "Serviço de montagem disponível", status: "pending", priority: "Média" },
      { number: 92, functionality: "Frete grátis acima do valor configurado", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "15. Pós-Venda",
    items: [
      { number: 93, functionality: "Mensagem pós-entrega verificando se tudo ocorreu bem", status: "pending", priority: "Média" },
      { number: 94, functionality: "Mensagem específica pós-colchão ('Como foi sua primeira noite?')", status: "pending", priority: "Média" },
      { number: 95, functionality: "Mensagem específica pós-móvel ('Como ficou o ambiente?')", status: "pending", priority: "Média" },
      { number: 96, functionality: "Solicitação de avaliação da compra e da loja", status: "pending", priority: "Média" },
      { number: 97, functionality: "Oferta de ajuda para complementar o ambiente", status: "pending", priority: "Baixa" },
    ],
  },
  {
    name: "16. Transbordo para Humano",
    items: [
      { number: 98, functionality: "Transferência quando cliente solicitar explicitamente", status: "pending", priority: "Alta" },
      { number: 99, functionality: "Transferência para negociações especiais de preço", status: "pending", priority: "Alta" },
      { number: 100, functionality: "Transferência em casos de reclamação", status: "pending", priority: "Alta" },
      { number: 101, functionality: "Transferência para troca/devolução", status: "pending", priority: "Alta" },
      { number: 102, functionality: "Transferência para projetos de móveis planejados", status: "pending", priority: "Alta" },
      { number: 103, functionality: "Transferência quando agente não conseguir resolver", status: "pending", priority: "Alta" },
      { number: 104, functionality: "Resumo automático da conversa enviado ao vendedor humano", status: "pending", priority: "Alta" },
      { number: 105, functionality: "Nível de prioridade configurável (baixa, média, alta)", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "17. Drive-to-Store",
    items: [
      { number: 106, functionality: "Agendamento de visita presencial para testar colchão ou ver móvel", status: "pending", priority: "Alta" },
      { number: 107, functionality: "Confirmação com endereço, data/hora e link do Google Maps", status: "pending", priority: "Alta" },
      { number: 108, functionality: "Registro dos produtos de interesse para a visita", status: "pending", priority: "Média" },
      { number: 109, functionality: "Atribuição de vendedor responsável pela visita (opcional)", status: "pending", priority: "Baixa" },
    ],
  },
];

export const workflows: Workflow[] = [
  {
    id: "WF-00",
    name: "Setup Supabase — Criar Tabelas e Funções SQL",
    nodes: ["ManualTrigger", "Set", "Code", "HTTP Request", "If"],
  },
  {
    id: "WF-01",
    name: "Agente de Vendas WhatsApp (Principal)",
    nodes: ["Webhook", "If", "Code", "AI Agent (OpenAI)", "Memory Buffer", "Tool HTTP Request", "Tool Workflow", "Evolution API", "Redis", "Respond to Webhook"],
  },
  {
    id: "WF-02",
    name: "Follow-up Automático (Cron)",
    nodes: ["Schedule Trigger", "Supabase", "If", "Split in Batches", "Code", "HTTP Request", "Set"],
  },
  {
    id: "WF-03",
    name: "Buscar Produto no Catálogo (RAG)",
    nodes: ["Execute Workflow Trigger", "Code", "If", "HTTP Request", "Set"],
  },
  {
    id: "WF-04",
    name: "Enviar Mídia WhatsApp",
    nodes: ["Execute Workflow Trigger", "If", "Code", "Split in Batches", "Supabase", "Wait", "HTTP Request", "Set"],
  },
  {
    id: "WF-05",
    name: "Transferir para Humano (Transbordo)",
    nodes: ["Execute Workflow Trigger", "Redis", "If", "Set", "HTTP Request", "Code", "Supabase"],
  },
  {
    id: "WF-06",
    name: "Enviar Mídia WhatsApp (v2)",
    nodes: ["Execute Workflow Trigger", "Evolution API", "Code", "If", "HTTP Request"],
  },
  {
    id: "WF-07",
    name: "Buscar Produto RAG (v2)",
    nodes: ["Execute Workflow Trigger", "Code", "HTTP Request"],
  },
  {
    id: "WF-08",
    name: "Agendar Visita Calendar",
    nodes: ["Execute Workflow Trigger", "Google Calendar", "Code"],
  },
  {
    id: "WF-09",
    name: "Gerar Orçamento Formal (PDF)",
    nodes: ["Execute Workflow Trigger", "Code", "HTTP Request"],
  },
  {
    id: "WF-10",
    name: "Gerar Cobrança (Checkout Genérico)",
    nodes: ["Execute Workflow Trigger", "Code", "HTTP Request"],
  },
  {
    id: "WF-11",
    name: "Indexar Embeddings dos Produtos",
    nodes: ["Manual Trigger", "Webhook", "Code", "HTTP Request"],
  },
  {
    id: "WF-12",
    name: "Handoff Toggle (Pausar/Retomar Agente)",
    nodes: ["Webhook", "Code", "If", "Redis", "HTTP Request", "Respond to Webhook"],
  },
  {
    id: "WF-13",
    name: "Disparar Campanha Promocional",
    nodes: ["Webhook", "Supabase", "Code", "Split in Batches", "HTTP Request", "If", "Respond to Webhook"],
  },
  {
    id: "WF-14",
    name: "Sync Estoque e Preço (E-commerce)",
    nodes: ["Webhook", "Supabase", "If", "Code", "HTTP Request", "Respond to Webhook"],
  },
];

// Computed stats
export function getRoadmapStats() {
  const allItems = checklistBlocks.flatMap((b) => b.items);
  const total = allItems.length;
  const done = allItems.filter((i) => i.status === "done").length;
  const inProgress = allItems.filter((i) => i.status === "in_progress").length;
  const pending = allItems.filter((i) => i.status === "pending").length;
  const highPriority = allItems.filter((i) => i.priority === "Alta").length;
  const highPriorityDone = allItems.filter((i) => i.priority === "Alta" && i.status === "done").length;
  return { total, done, inProgress, pending, highPriority, highPriorityDone };
}
