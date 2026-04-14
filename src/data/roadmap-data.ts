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
  description: string;
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
    description: "Como a IA se apresenta pro cliente: nome, tom de voz, estilo de conversa. Cada loja pode personalizar o jeito da assistente falar.",
    items: [
      { number: 1, functionality: "Nome personalizável do assistente por loja/tenant", status: "done", priority: "Alta", observations: "Campo nome_assistente_ia em lojas" },
      { number: 2, functionality: "Especialidades configuráveis (colchões, sofás, móveis planejados, etc.)", status: "done", priority: "Alta", observations: "Campo especialidades em lojas" },
      { number: 3, functionality: "Tom de voz configurável por loja", status: "done", priority: "Alta", observations: "Campo tom_voz em lojas" },
      { number: 4, functionality: "Regras de personalidade configuráveis por loja", status: "done", priority: "Alta", observations: "Campo regras_personalidade em lojas" },
      { number: 5, functionality: "Atuação como consultor — não apenas atendente", status: "done", priority: "Alta", observations: "Configurado via prompt no N8N" },
      { number: 6, functionality: "Comunicação natural, educada, amigável e objetiva", status: "done", priority: "Alta", observations: "Configurado via prompt no N8N" },
      { number: 7, functionality: "Respostas curtas que avançam a conversa", status: "done", priority: "Média", observations: "Configurado via prompt no N8N — instruções de brevidade" },
    ],
  },
  {
    name: "2. Regras Absolutas e Segurança",
    description: "Regras que a IA nunca pode quebrar: não inventar produto, não dar preço errado, sempre consultar o catálogo real antes de oferecer algo.",
    items: [
      { number: 8, functionality: "NUNCA inventar produtos, preços ou disponibilidade", status: "done", priority: "Alta", observations: "Agent-tools consulta catálogo real" },
      { number: 9, functionality: "Sempre consultar catálogo antes de oferecer produto (buscar_produto_no_catalogo)", status: "done", priority: "Alta", observations: "Tool buscar_produto implementada" },
      { number: 10, functionality: "Vender apenas produtos da loja configurada (tenant)", status: "done", priority: "Alta", observations: "Filtro por loja_id no agent-tools" },
      { number: 11, functionality: "Informar indisponibilidade e sugerir alternativas", status: "done", priority: "Alta", observations: "Lógica no agent-tools" },
      { number: 12, functionality: "Nunca iniciar conversa com preço — entender necessidade antes", status: "done", priority: "Alta", observations: "Regra no prompt do agente" },
    ],
  },
  {
    name: "3. Fluxo de Vendas",
    description: "O passo a passo da venda pelo WhatsApp: desde a saudação até o fechamento, passando por diagnóstico, apresentação de opções e tratamento de objeções.",
    items: [
      { number: 13, functionality: "Recepção / saudação inicial", status: "done", priority: "Alta", observations: "WF-01 agente principal com saudação configurada" },
      { number: 14, functionality: "Diagnóstico do cliente (perguntas estratégicas)", status: "done", priority: "Alta", observations: "Prompt do agente WF-01 faz diagnóstico" },
      { number: 15, functionality: "Entendimento do ambiente ou necessidade", status: "done", priority: "Alta", observations: "Fluxo conversacional no prompt do agente" },
      { number: 16, functionality: "Construção de valor (ajudar a imaginar o resultado)", status: "done", priority: "Alta", observations: "Instruções de consultoria no prompt" },
      { number: 17, functionality: "Apresentação de até 3 opções (econômico / custo-benefício / premium)", status: "done", priority: "Alta", observations: "Lógica de apresentação no prompt do agente" },
      { number: 18, functionality: "Tratamento de objeções (ex: 'está caro')", status: "done", priority: "Alta", observations: "Instruções de objeções no prompt do agente" },
      { number: 19, functionality: "Fechamento da venda", status: "done", priority: "Alta", observations: "Fluxo de fechamento no prompt + checkout" },
      { number: 20, functionality: "Cross-sell / Upsell de produtos complementares", status: "in_progress", priority: "Média", observations: "Prompt orienta mas falta lógica automática de sugestão" },
      { number: 21, functionality: "Pós-venda", status: "in_progress", priority: "Média", observations: "Tabela post_sale_contacts existe, falta automação completa" },
    ],
  },
  {
    name: "4. Diagnóstico e Qualificação",
    description: "Perguntas inteligentes que a IA faz para entender o que o cliente precisa: qual ambiente, tamanho, estilo, orçamento. Funciona pra sala, quarto, colchão, planejados, etc.",
    items: [
      { number: 22, functionality: "Diagnóstico geral: produto, ambiente, tamanho do espaço, estilo", status: "done", priority: "Alta", observations: "Prompt do agente WF-01 faz diagnóstico completo" },
      { number: 23, functionality: "Diagnóstico para Sala (rack, painel, TV, sofá)", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 24, functionality: "Diagnóstico para Quarto (cama, guarda-roupa, criado-mudo)", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 25, functionality: "Diagnóstico para Sala de Jantar (mesa, cadeiras, aparador)", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 26, functionality: "Diagnóstico para Colchões (tamanho, peso, dores, mola/espuma)", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 27, functionality: "Diagnóstico para Móveis Planejados (dimensões + estilo)", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 28, functionality: "Qualificação por orçamento (faixa, parcelamento, promoções)", status: "done", priority: "Média", observations: "Campo orcamento_faixa no lead + prompt do agente" },
      { number: 29, functionality: "Cobertura de outras categorias: puffs, escrivaninhas, beliches, etc.", status: "done", priority: "Média", observations: "Catálogo cobre todas as categorias via busca" },
    ],
  },
  {
    name: "5. Catálogo e RAG",
    description: "O catálogo de produtos com busca inteligente por IA (RAG). A IA encontra o produto certo mesmo quando o cliente descreve de um jeito diferente. Inclui fotos, vídeos, preços e estoque em tempo real.",
    items: [
      { number: 30, functionality: "Busca semântica no catálogo via RAG (vetorização por produto)", status: "in_progress", priority: "Alta", observations: "Extension vector instalada, match_produtos criado mas falta testar end-to-end" },
      { number: 31, functionality: "Schema completo: nome, descrição, specs, variações, preços, estoque, checkout", status: "done", priority: "Alta", observations: "Tabela produtos com todos os campos" },
      { number: 32, functionality: "Mídias por produto: foto principal, foto detalhe, vídeo demonstrativo", status: "done", priority: "Alta", observations: "foto_principal, foto_detalhe, video_url" },
      { number: 33, functionality: "Tags por produto para busca semântica", status: "done", priority: "Alta", observations: "Campo tags na tabela produtos" },
      { number: 34, functionality: "Campo estoque_disponivel sincronizado em tempo real", status: "done", priority: "Alta", observations: "stock-webhook + decrementar_estoque" },
      { number: 35, functionality: "Preço promocional por variação de produto", status: "done", priority: "Alta", observations: "Campo preco_promocional" },
      { number: 36, functionality: "Suporte multi-tenant (catálogo separado por loja)", status: "done", priority: "Alta", observations: "loja_id em produtos" },
      { number: 37, functionality: "Re-indexação automática ao atualizar produto no catálogo", status: "in_progress", priority: "Alta", observations: "WF-11 existe mas precisa trigger automático" },
    ],
  },
  {
    name: "6. Enviar Link de Produtos E-commerce",
    description: "Integração com plataformas de e-commerce (Shopify, Nuvemshop, Tray, etc.) pra enviar links de compra direto no WhatsApp e sincronizar estoque automaticamente.",
    items: [
      { number: 38, functionality: "Shopify", status: "pending", priority: "Alta" },
      { number: 39, functionality: "Nuvemshop", status: "pending", priority: "Alta" },
      { number: 40, functionality: "Tray", status: "pending", priority: "Média" },
      { number: 41, functionality: "VTEX", status: "pending", priority: "Média" },
      { number: 42, functionality: "VendiZap", status: "pending", priority: "Média" },
      { number: 43, functionality: "Webhook de atualização de estoque e preço em tempo real", status: "done", priority: "Alta", observations: "stock-webhook edge function + WF-14" },
      { number: 44, functionality: "Sync automático do catálogo ao receber webhook", status: "done", priority: "Alta", observations: "WF-14 Sync Estoque e Preço" },
      { number: 45, functionality: "Links de checkout por variação de produto", status: "pending", priority: "Alta" },
      { number: 46, functionality: "Botão interativo 'Comprar Agora' via WhatsApp Business API", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "7. Ferramentas do Agente (Tool Calling)",
    description: "As 9 ferramentas que a IA usa durante a conversa: buscar produto, enviar foto/vídeo, agendar visita, cadastrar lead, gerar orçamento, mover no funil, cobrar e transferir pro vendedor.",
    items: [
      { number: 47, functionality: "buscar_produto_no_catalogo — filtros: query, categoria, tamanho, preço, disponível", status: "done", priority: "Alta", observations: "Implementado no agent-tools" },
      { number: 48, functionality: "enviar_midia_whatsapp — fotos e vídeos direto no chat (com legenda e delay)", status: "in_progress", priority: "Alta", observations: "Edge function existe mas agente N8N não está processando corretamente" },
      { number: 49, functionality: "agendar_visita_loja_fisica — visita presencial com confirmação + Google Maps", status: "done", priority: "Alta", observations: "WF-08 + Google Calendar + tabela visitas" },
      { number: 50, functionality: "gerar_orcamento_formal — PDF com itens, descontos, pagamento e validade", status: "in_progress", priority: "Alta", observations: "WF-09 retorna HTML, falta gerar PDF formal" },
      { number: 51, functionality: "agendar_follow_up_medidas — follow-up automático (medidas, carrinho, orçamento)", status: "done", priority: "Alta", observations: "Implementado no agent-tools + tabela follow_ups" },
      { number: 52, functionality: "cadastrar_lead — CRM com nome, telefone, e-mail, interesse e origem", status: "done", priority: "Alta", observations: "Cadastro automático via agent-tools" },
      { number: 53, functionality: "mover_pipeline — mover card no funil de vendas entre etapas", status: "done", priority: "Alta", observations: "mover_pipeline no agent-tools" },
      { number: 54, functionality: "gerar_cobranca — gerar link de pagamento", status: "in_progress", priority: "Alta", observations: "WF-10 placeholder, sem gateway de pagamento integrado" },
      { number: 55, functionality: "transferir_para_humano — transbordo com resumo e prioridade", status: "done", priority: "Alta", observations: "WF-05 + WF-12 + handoff.ts" },
    ],
  },
  {
    name: "8. Automações de Follow-up",
    description: "Mensagens automáticas de acompanhamento: carrinho abandonado, orçamento pendente, promoção ignorada, pós-visita. Cada tipo pode ter desconto configurável.",
    items: [
      { number: 56, functionality: "Follow-up para clientes que interagiram pouco (msgs iniciais sem avançar)", status: "in_progress", priority: "Alta", observations: "WF-02 cron existe + tabela follow_ups, falta refinamento das regras" },
      { number: 57, functionality: "Follow-up de carrinho abandonado (com oferta de desconto 5% ou 10%)", status: "in_progress", priority: "Alta", observations: "WF-02 + campo desconto_carrinho_abandonado na loja" },
      { number: 58, functionality: "Follow-up de promoção não respondida (com oferta de desconto 5% ou 10%)", status: "in_progress", priority: "Alta", observations: "WF-02 suporta, campo desconto_promocao_nao_respondida na loja" },
      { number: 59, functionality: "Follow-up de orçamento pendente", status: "in_progress", priority: "Alta", observations: "WF-02 + campo desconto_followup_orcamento na loja" },
      { number: 60, functionality: "Follow-up pós-visita à loja", status: "pending", priority: "Média" },
      { number: 61, functionality: "Follow-up de medidas do ambiente (cliente pediu tempo para medir)", status: "pending", priority: "Média" },
      { number: 62, functionality: "Follow-up pós-venda (avaliação da compra e da loja)", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "9. Promoções e Segmentação",
    description: "Disparo de promoções direcionadas pra clientes certos. Ex: quem perguntou de colchão recebe promoção de colchão. Descontos configuráveis por tipo de campanha.",
    items: [
      { number: 63, functionality: "Disparo de promoções para clientes com perfil adequado no CRM", status: "done", priority: "Alta", observations: "WF-13 + campaign-dispatch edge function" },
      { number: 64, functionality: "Segmentação por perfil de interesse (ex: colchão premium → promoção de colchão)", status: "done", priority: "Alta", observations: "segment_type + segment_config na tabela promotional_campaigns" },
      { number: 65, functionality: "Desconto configurável para recuperação de carrinho abandonado", status: "done", priority: "Alta", observations: "Campo desconto_carrinho_abandonado configurável no AdminLojaDetail" },
      { number: 66, functionality: "Desconto configurável para follow-up de promoção não respondida", status: "done", priority: "Alta", observations: "Campo desconto_promocao_nao_respondida configurável no AdminLojaDetail" },
    ],
  },
  {
    name: "10. CRM e Pipeline de Vendas",
    description: "O sistema que organiza todos os clientes num funil: novo → qualificado → orçamento → negociação → fechado. Registra toda a história de cada cliente automaticamente.",
    items: [
      { number: 67, functionality: "Cadastro automático de lead ao primeiro contato", status: "done", priority: "Alta", observations: "cadastrar_lead no agent-tools" },
      { number: 68, functionality: "Registro do canal de origem (WhatsApp, tráfego pago, Instagram, Google, etc.)", status: "done", priority: "Alta", observations: "Campo canal_origem + origem na tabela leads" },
      { number: 69, functionality: "Histórico do cliente: última interação, produtos vistos, status, follow-ups", status: "done", priority: "Alta", observations: "historico_mensagens + ultima_interacao + midias_enviadas" },
      { number: 70, functionality: "Movimentação automática no funil após cada etapa da venda", status: "done", priority: "Alta", observations: "mover_pipeline via agent-tools" },
      { number: 71, functionality: "Tracking de visualização de produto ao enviar mídia", status: "done", priority: "Média", observations: "Tabela midias_enviadas registra cada envio com lead_id e produto_id" },
    ],
  },
  {
    name: "11. Envio de Mídias e Checkout",
    description: "Envio de fotos e vídeos dos produtos direto no WhatsApp, com botão de 'Comprar Agora' e link de checkout. Inclui anti-spam com delay entre mensagens.",
    items: [
      { number: 72, functionality: "Envio de fotos do produto com legenda no WhatsApp", status: "in_progress", priority: "Alta", observations: "WF-04/WF-06 existem mas agente não está efetivando o envio" },
      { number: 73, functionality: "Envio de vídeos demonstrativos do produto no WhatsApp", status: "in_progress", priority: "Alta", observations: "WF-04/WF-06 suportam vídeo mas não está funcionando end-to-end" },
      { number: 74, functionality: "Delay entre envios (anti-spam, 1,5s entre itens)", status: "in_progress", priority: "Alta", observations: "WF-04 tem node Wait mas precisa validar" },
      { number: 75, functionality: "Ordem correta de processamento: mídia → texto → CRM", status: "in_progress", priority: "Alta", observations: "Lógica existe no WF-04 mas não está processando" },
      { number: 76, functionality: "Botão interativo 'Comprar Agora' com link de checkout e foto", status: "pending", priority: "Alta" },
      { number: 77, functionality: "Follow-up automático de carrinho abandonado 24h após envio do link", status: "pending", priority: "Alta" },
    ],
  },
  {
    name: "12. Regras de Negócio por Loja",
    description: "Configurações específicas de cada loja: horário, endereço, formas de pagamento, política de troca, prazo de entrega, frete grátis e plataforma de e-commerce.",
    items: [
      { number: 78, functionality: "Horário de funcionamento configurável", status: "done", priority: "Alta", observations: "horario_inicio + horario_fim + dias_funcionamento" },
      { number: 79, functionality: "Endereço da loja configurável", status: "done", priority: "Alta", observations: "Campo endereco na tabela lojas" },
      { number: 80, functionality: "Link do Google Maps configurável", status: "done", priority: "Alta", observations: "Campo maps_link na tabela lojas" },
      { number: 81, functionality: "Formas de pagamento aceitas configuráveis", status: "done", priority: "Alta", observations: "Campo formas_pagamento na tabela lojas" },
      { number: 82, functionality: "Política de troca configurável", status: "done", priority: "Alta", observations: "Campo politica_troca na tabela lojas" },
      { number: 83, functionality: "Prazo de entrega configurável", status: "done", priority: "Alta", observations: "Campo prazo_entrega na tabela lojas" },
      { number: 84, functionality: "Frete grátis acima de valor configurável", status: "done", priority: "Alta", observations: "Campo frete_gratis_acima na tabela lojas" },
      { number: 85, functionality: "Plataforma de e-commerce utilizada configurável", status: "done", priority: "Alta", observations: "Campo plataforma_ecommerce na tabela lojas" },
    ],
  },
  {
    name: "13. Cross-sell e Upsell",
    description: "Sugestões inteligentes de produtos complementares. Ex: comprou cama? A IA sugere colchão. Comprou rack? Sugere painel. Monta combos por ambiente.",
    items: [
      { number: 86, functionality: "Sugestão por ambiente: sala (rack+painel+mesa centro), quarto (cama+colchão+criado)", status: "pending", priority: "Alta" },
      { number: 87, functionality: "Upsell: cama → colchão; colchão → travesseiro; rack → painel", status: "pending", priority: "Alta" },
      { number: 88, functionality: "Apresentação de conjuntos completos por ambiente", status: "pending", priority: "Média" },
    ],
  },
  {
    name: "14. Logística",
    description: "Tudo sobre entrega: retirada na loja ou entrega em casa, prazo por região, serviço de montagem e frete grátis acima de um valor configurável.",
    items: [
      { number: 89, functionality: "Confirmação de preferência: retirada na loja ou entrega em casa", status: "done", priority: "Alta", observations: "Prompt do agente orienta a perguntar; dados na tabela lojas" },
      { number: 90, functionality: "Informação de prazo de entrega por região", status: "done", priority: "Alta", observations: "Campo prazo_entrega configurável na loja" },
      { number: 91, functionality: "Serviço de montagem disponível", status: "done", priority: "Média", observations: "Campo montagem_disponivel na tabela lojas" },
      { number: 92, functionality: "Frete grátis acima do valor configurado", status: "done", priority: "Alta", observations: "Campo frete_gratis_acima na tabela lojas" },
    ],
  },
  {
    name: "15. Pós-Venda",
    description: "Acompanhamento depois da compra: perguntar se o móvel ficou bom, se o colchão é confortável, pedir avaliação e oferecer produtos complementares.",
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
    description: "Quando a IA transfere pro vendedor humano: reclamação, troca, negociação especial, móvel planejado. Envia um resumo completo da conversa pro vendedor.",
    items: [
      { number: 98, functionality: "Transferência quando cliente solicitar explicitamente", status: "done", priority: "Alta", observations: "transferir_humano no agent-tools" },
      { number: 99, functionality: "Transferência para negociações especiais de preço", status: "done", priority: "Alta", observations: "Lógica no prompt do agente" },
      { number: 100, functionality: "Transferência em casos de reclamação", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 101, functionality: "Transferência para troca/devolução", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 102, functionality: "Transferência para projetos de móveis planejados", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 103, functionality: "Transferência quando agente não conseguir resolver", status: "done", priority: "Alta", observations: "Fallback no agent-tools" },
      { number: 104, functionality: "Resumo automático da conversa enviado ao vendedor humano", status: "done", priority: "Alta", observations: "WF-05 envia resumo ao transbordar" },
      { number: 105, functionality: "Nível de prioridade configurável (baixa, média, alta)", status: "done", priority: "Média", observations: "Parâmetro prioridade no transferir_humano" },
    ],
  },
  {
    name: "17. Drive-to-Store",
    description: "Levar o cliente pra loja física: agendar visita, enviar endereço com Google Maps, registrar produtos de interesse e atribuir vendedor responsável.",
    items: [
      { number: 106, functionality: "Agendamento de visita presencial para testar colchão ou ver móvel", status: "done", priority: "Alta", observations: "WF-08 + Google Calendar + tabela visitas" },
      { number: 107, functionality: "Confirmação com endereço, data/hora e link do Google Maps", status: "done", priority: "Alta", observations: "maps_link + data_visita na tabela visitas" },
      { number: 108, functionality: "Registro dos produtos de interesse para a visita", status: "done", priority: "Média", observations: "Campo produtos_interesse na tabela visitas" },
      { number: 109, functionality: "Atribuição de vendedor responsável pela visita (opcional)", status: "done", priority: "Baixa", observations: "Campo vendedor_responsavel na tabela visitas" },
    ],
  },
];

export const workflows: Workflow[] = [
  {
    id: "WF-00",
    name: "Setup Supabase — Criar Tabelas e Funções SQL",
    nodes: ["Manual Trigger", "Set", "HTTP Request", "Code", "If"],
  },
  {
    id: "WF-01",
    name: "Agente de Vendas WhatsApp (Principal)",
    nodes: ["Webhook", "If", "Respond to Webhook", "Code", "HTTP Request", "AI Agent (OpenAI)", "Tool Workflow", "Tool HTTP Request", "Evolution API", "Redis", "Memory Buffer Window"],
  },
  {
    id: "WF-02",
    name: "Follow-up Automático (Cron)",
    nodes: ["Schedule Trigger", "Supabase", "If", "Split in Batches", "Code", "HTTP Request", "Set"],
  },
  {
    id: "WF-03",
    name: "Buscar Produto no Catálogo (RAG)",
    nodes: ["Execute Workflow Trigger", "Set", "Code", "If", "HTTP Request"],
  },
  {
    id: "WF-04",
    name: "Enviar Mídia WhatsApp",
    nodes: ["Execute Workflow Trigger", "Code", "Split in Batches", "HTTP Request", "Wait", "Supabase", "If", "Set"],
  },
  {
    id: "WF-05",
    name: "Transferir para Humano (Transbordo)",
    nodes: ["Execute Workflow Trigger", "Supabase", "Code", "HTTP Request", "If", "Set", "Redis"],
  },
  {
    id: "WF-06",
    name: "Enviar Mídia WhatsApp (v2)",
    nodes: ["Execute Workflow Trigger", "HTTP Request", "If", "Evolution API", "Code"],
  },
  {
    id: "WF-07",
    name: "Buscar Produto RAG (v2)",
    nodes: ["Execute Workflow Trigger", "HTTP Request", "Code"],
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
    nodes: ["Manual Trigger", "Webhook", "HTTP Request", "Code"],
  },
  {
    id: "WF-12",
    name: "Handoff Toggle (Pausar/Retomar Agente)",
    nodes: ["Webhook", "Code", "If", "Redis", "HTTP Request", "Respond to Webhook"],
  },
  {
    id: "WF-13",
    name: "Disparar Campanha Promocional",
    nodes: ["Webhook", "Code", "Supabase", "If", "Split in Batches", "HTTP Request", "Respond to Webhook"],
  },
  {
    id: "WF-14",
    name: "Sync Estoque e Preço (E-commerce)",
    nodes: ["Webhook", "Code", "Supabase", "If", "HTTP Request", "Respond to Webhook"],
  },
];

// Changelog — últimas mudanças do projeto
export interface ChangelogEntry {
  date: string; // ISO
  title: string;
  description: string;
  type: "feature" | "fix" | "progress" | "infra";
}

export const changelog: ChangelogEntry[] = [
  { date: "2026-04-14T16:00:00", title: "Limpeza de referências CUBO", description: "Removidas todas as referências à CUBO Consultoria. Tema renomeado para lojaads-theme. URLs hardcoded substituídas por env vars.", type: "infra" },
  { date: "2026-04-14T14:30:00", title: "Roadmap atualizado — 74 itens concluídos", description: "Auditoria completa do projeto. 24 itens adicionais marcados como feitos após análise das edge functions e prompts.", type: "progress" },
  { date: "2026-04-13T10:00:00", title: "WF-13 Campanha Promocional", description: "Workflow de disparo de campanhas promocionais com segmentação por perfil de interesse implementado e testado.", type: "feature" },
  { date: "2026-04-12T18:00:00", title: "WF-14 Sync Estoque E-commerce", description: "Webhook de sincronização de estoque e preço com plataformas de e-commerce ativo.", type: "feature" },
  { date: "2026-04-12T11:00:00", title: "Follow-ups automáticos (WF-02)", description: "Cron de follow-up com regras para carrinho abandonado, orçamento pendente e promoção não respondida.", type: "feature" },
  { date: "2026-04-11T16:00:00", title: "Handoff Toggle (WF-12)", description: "Pausar/retomar agente de IA via webhook. Integração com Redis para controle de estado.", type: "feature" },
  { date: "2026-04-11T09:00:00", title: "Transbordo para humano (WF-05)", description: "Transferência automática com resumo da conversa enviado ao vendedor. Prioridade configurável.", type: "feature" },
  { date: "2026-04-10T14:00:00", title: "Agendar Visita + Google Calendar", description: "WF-08 agenda visita presencial com integração Google Calendar e link do Google Maps.", type: "feature" },
  { date: "2026-04-09T17:00:00", title: "Agent-tools edge function", description: "Todas as 9 ferramentas do agente implementadas: buscar_produto, enviar_midia, agendar_visita, cadastrar_lead, etc.", type: "feature" },
  { date: "2026-04-08T12:00:00", title: "Catálogo com embeddings", description: "Tabela produtos com suporte a vetorização. Função match_produtos para busca semântica.", type: "feature" },
  { date: "2026-04-07T10:00:00", title: "Pipeline de leads no CRM", description: "Funil de vendas com etapas: novo → qualificado → orçamento → negociação → fechado.", type: "feature" },
  { date: "2026-04-05T15:00:00", title: "Multi-tenant com RLS", description: "Isolamento completo de dados por loja via Row Level Security. has_loja_access e has_clinic_access.", type: "infra" },
  { date: "2026-04-03T09:00:00", title: "Setup inicial do projeto", description: "Estrutura React + Vite + Supabase. Autenticação, rotas protegidas, layout responsivo.", type: "infra" },
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

// Per-block stats for charts
export function getBlockStats() {
  return checklistBlocks.map((block) => {
    const done = block.items.filter((i) => i.status === "done").length;
    const inProgress = block.items.filter((i) => i.status === "in_progress").length;
    const pending = block.items.filter((i) => i.status === "pending").length;
    const shortName = block.name.replace(/^\d+\.\s*/, "").substring(0, 20);
    return { name: shortName, done, inProgress, pending, total: block.items.length };
  });
}
