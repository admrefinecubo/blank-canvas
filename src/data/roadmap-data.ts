export type ItemStatus = "done" | "in_progress" | "pending";
export type Priority = "Alta" | "Média" | "Baixa";

export interface ChecklistItem {
  number: number;
  functionality: string;
  description?: string;
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
      { number: 1, functionality: "Nome personalizável do assistente por loja", description: "Cada loja escolhe o nome da IA (ex: 'Julia', 'Ana'). O cliente vê esse nome na conversa.", status: "done", priority: "Alta", observations: "Campo nome_assistente_ia em lojas" },
      { number: 2, functionality: "Especialidades configuráveis", description: "A loja define se vende colchão, sofá, planejado, etc. A IA só fala do que a loja vende.", status: "done", priority: "Alta", observations: "Campo especialidades em lojas" },
      { number: 3, functionality: "Tom de voz configurável por loja", description: "A loja escolhe se a IA fala mais formal, descontraída, técnica, etc.", status: "done", priority: "Alta", observations: "Campo tom_voz em lojas" },
      { number: 4, functionality: "Regras de personalidade configuráveis", description: "Regras extras como 'sempre perguntar o nome', 'nunca falar de concorrente', etc.", status: "done", priority: "Alta", observations: "Campo regras_personalidade em lojas" },
      { number: 5, functionality: "Atuação como consultor de ambientes", description: "A IA não só vende — ela ajuda o cliente a pensar no ambiente, combinar peças e montar o espaço.", status: "done", priority: "Alta", observations: "Configurado via prompt no N8N" },
      { number: 6, functionality: "Comunicação natural e objetiva", description: "Respostas que parecem humanas: sem robozice, sem textão. Educada, amigável e direto ao ponto.", status: "done", priority: "Alta", observations: "Configurado via prompt no N8N" },
      { number: 7, functionality: "Respostas curtas que avançam a conversa", description: "A IA não enche linguiça. Cada resposta leva o cliente pro próximo passo da venda.", status: "done", priority: "Média", observations: "Configurado via prompt no N8N" },
    ],
  },
  {
    name: "2. Regras Absolutas e Segurança",
    description: "Regras que a IA nunca pode quebrar: não inventar produto, não dar preço errado, sempre consultar o catálogo real antes de oferecer algo.",
    items: [
      { number: 8, functionality: "NUNCA inventar produtos ou preços", description: "A IA jamais inventa. Se não encontrar no catálogo, avisa que não tem e sugere alternativas.", status: "done", priority: "Alta", observations: "Agent-tools consulta catálogo real" },
      { number: 9, functionality: "Sempre consultar catálogo antes de oferecer", description: "Antes de falar qualquer produto, a IA busca no catálogo real da loja pra garantir que existe e tem estoque.", status: "done", priority: "Alta", observations: "Tool buscar_produto implementada" },
      { number: 10, functionality: "Vender apenas produtos da loja configurada", description: "Cada loja tem seu catálogo separado. A IA nunca mostra produto de outra loja.", status: "done", priority: "Alta", observations: "Filtro por loja_id no agent-tools" },
      { number: 11, functionality: "Informar indisponibilidade e sugerir alternativas", description: "Se o produto acabou, a IA avisa e já sugere algo parecido que tenha em estoque.", status: "done", priority: "Alta", observations: "Lógica no agent-tools" },
      { number: 12, functionality: "Entender necessidade antes de falar preço", description: "A IA primeiro entende o que o cliente precisa, pra depois apresentar as opções certas com preço.", status: "done", priority: "Alta", observations: "Regra no prompt do agente" },
    ],
  },
  {
    name: "3. Fluxo de Vendas",
    description: "O passo a passo da venda pelo WhatsApp: desde a saudação até o fechamento, passando por diagnóstico, apresentação de opções e tratamento de objeções.",
    items: [
      { number: 13, functionality: "Recepção / saudação inicial", description: "A IA dá boas-vindas ao cliente de forma simpática e já pergunta como pode ajudar.", status: "done", priority: "Alta", observations: "WF-01 agente principal com saudação configurada" },
      { number: 14, functionality: "Diagnóstico do cliente", description: "Perguntas estratégicas pra entender o que o cliente quer: pra qual cômodo, qual estilo, quanto quer gastar.", status: "done", priority: "Alta", observations: "Prompt do agente WF-01 faz diagnóstico" },
      { number: 15, functionality: "Entendimento do ambiente", description: "A IA entende o espaço do cliente: tamanho, o que já tem, o que falta.", status: "done", priority: "Alta", observations: "Fluxo conversacional no prompt do agente" },
      { number: 16, functionality: "Construção de valor", description: "Ajuda o cliente a imaginar como vai ficar o ambiente com os móveis — vende o sonho, não só o produto.", status: "done", priority: "Alta", observations: "Instruções de consultoria no prompt" },
      { number: 17, functionality: "Apresentação de 3 opções", description: "Mostra 3 faixas: econômico, custo-benefício e premium. Cliente escolhe o que cabe no bolso.", status: "done", priority: "Alta", observations: "Lógica de apresentação no prompt do agente" },
      { number: 18, functionality: "Tratamento de objeções", description: "Se o cliente fala 'tá caro', a IA contorna: parcela, mostra benefícios, oferece alternativa mais barata.", status: "done", priority: "Alta", observations: "Instruções de objeções no prompt do agente" },
      { number: 19, functionality: "Fechamento da venda", description: "Quando o cliente decide, a IA gera o link de checkout ou agenda a visita pra fechar presencialmente.", status: "done", priority: "Alta", observations: "Fluxo de fechamento no prompt + checkout" },
      { number: 20, functionality: "Cross-sell / Upsell", description: "Comprou cama? A IA já sugere colchão. Comprou rack? Sugere painel. Aumenta o ticket médio.", status: "done", priority: "Média", observations: "Prompt do agente orienta cross-sell por ambiente." },
      { number: 21, functionality: "Pós-venda automatizado", description: "Depois da compra, a IA manda mensagem perguntando se chegou bem, se gostou, e pede avaliação.", status: "in_progress", priority: "Média", observations: "Tabela post_sale_contacts + automação em finalização" },
    ],
  },
  {
    name: "4. Diagnóstico e Qualificação",
    description: "Perguntas inteligentes que a IA faz para entender o que o cliente precisa: qual ambiente, tamanho, estilo, orçamento. Funciona pra sala, quarto, colchão, planejados, etc.",
    items: [
      { number: 22, functionality: "Diagnóstico geral", description: "Pergunta o que o cliente procura, pra qual cômodo, tamanho do espaço e estilo preferido.", status: "done", priority: "Alta", observations: "Prompt do agente WF-01 faz diagnóstico completo" },
      { number: 23, functionality: "Diagnóstico para Sala", description: "Perguntas específicas: precisa de rack, painel, sofá? Qual tamanho da TV? Sala grande ou compacta?", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 24, functionality: "Diagnóstico para Quarto", description: "Cama de casal ou solteiro? Precisa de guarda-roupa? Criado-mudo? Qual o espaço disponível?", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 25, functionality: "Diagnóstico para Sala de Jantar", description: "Quantas pessoas? Mesa redonda ou retangular? Precisa de aparador? Cadeiras estofadas?", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 26, functionality: "Diagnóstico para Colchões", description: "Qual tamanho? Peso das pessoas? Tem dor nas costas? Prefere mola ou espuma? Firmeza?", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 27, functionality: "Diagnóstico para Móveis Planejados", description: "Quais as dimensões do espaço? Estilo moderno ou clássico? Cores? Precisa de medição?", status: "done", priority: "Alta", observations: "Coberto pelo prompt do agente + catálogo" },
      { number: 28, functionality: "Qualificação por orçamento", description: "A IA pergunta a faixa de preço do cliente e já filtra opções que cabem no bolso dele.", status: "done", priority: "Média", observations: "Campo orcamento_faixa no lead + prompt do agente" },
      { number: 29, functionality: "Cobertura de todas as categorias", description: "Funciona pra qualquer tipo de móvel: puffs, escrivaninhas, beliches, cômodas, estantes, etc.", status: "done", priority: "Média", observations: "Catálogo cobre todas as categorias via busca" },
    ],
  },
  {
    name: "5. Catálogo e RAG",
    description: "O catálogo de produtos com busca inteligente por IA (RAG). A IA encontra o produto certo mesmo quando o cliente descreve de um jeito diferente. Inclui fotos, vídeos, preços e estoque em tempo real.",
    items: [
      { number: 30, functionality: "Busca semântica via RAG", description: "O cliente pode descrever o que quer de qualquer jeito ('quero um sofá cinza pra sala pequena') e a IA encontra no catálogo.", status: "done", priority: "Alta", observations: "Extension vector + match_produtos testado end-to-end" },
      { number: 31, functionality: "Schema completo de produto", description: "Cada produto tem: nome, descrição, especificações, variações, preços, estoque e link de checkout.", status: "done", priority: "Alta", observations: "Tabela produtos com todos os campos" },
      { number: 32, functionality: "Mídias por produto", description: "Foto principal, foto de detalhe e vídeo demonstrativo pra cada produto. A IA envia direto no WhatsApp.", status: "done", priority: "Alta", observations: "foto_principal, foto_detalhe, video_url" },
      { number: 33, functionality: "Tags por produto", description: "Tags como 'casal', 'mola ensacada', 'compacto' ajudam a IA a encontrar o produto certo.", status: "done", priority: "Alta", observations: "Campo tags na tabela produtos" },
      { number: 34, functionality: "Estoque sincronizado em tempo real", description: "Quando vende no e-commerce ou na loja, o estoque atualiza automaticamente. A IA nunca oferece o que não tem.", status: "done", priority: "Alta", observations: "stock-webhook + decrementar_estoque" },
      { number: 35, functionality: "Preço promocional", description: "Cada produto pode ter preço normal e preço promocional. A IA mostra o desconto pro cliente.", status: "done", priority: "Alta", observations: "Campo preco_promocional" },
      { number: 36, functionality: "Catálogo separado por loja", description: "Cada loja tem seu próprio catálogo. Sem mistura. Totalmente isolado.", status: "done", priority: "Alta", observations: "loja_id em produtos" },
      { number: 37, functionality: "Re-indexação automática do catálogo", description: "Quando atualiza um produto (preço, estoque, descrição), a busca inteligente se atualiza sozinha.", status: "done", priority: "Alta", observations: "WF-11 com trigger automático" },
    ],
  },
  {
    name: "6. Enviar Link de Produtos E-commerce",
    description: "Integração com plataformas de e-commerce (Shopify, Nuvemshop, Tray, etc.) pra enviar links de compra direto no WhatsApp e sincronizar estoque automaticamente.",
    items: [
      { number: 38, functionality: "Shopify", description: "Integração com Shopify pra puxar produtos e sincronizar estoque e preço automaticamente.", status: "in_progress", priority: "Alta", observations: "Integração em finalização" },
      { number: 39, functionality: "Nuvemshop", description: "Integração com Nuvemshop pra puxar produtos e sincronizar estoque automaticamente.", status: "in_progress", priority: "Alta", observations: "Integração em finalização" },
      { number: 40, functionality: "Tray", description: "Integração com a plataforma Tray.", status: "pending", priority: "Média", observations: "Fase 2 — após lançamento" },
      { number: 41, functionality: "VTEX", description: "Integração com a plataforma VTEX.", status: "pending", priority: "Média", observations: "Fase 2 — após lançamento" },
      { number: 42, functionality: "VendiZap", description: "Integração com a plataforma VendiZap.", status: "pending", priority: "Média", observations: "Fase 2 — após lançamento" },
      { number: 43, functionality: "Webhook de estoque em tempo real", description: "Quando vende no site, o estoque atualiza no catálogo da IA automaticamente via webhook.", status: "done", priority: "Alta", observations: "stock-webhook edge function + WF-14" },
      { number: 44, functionality: "Sync automático do catálogo", description: "Ao receber webhook do e-commerce, o catálogo da IA se atualiza sozinho.", status: "done", priority: "Alta", observations: "WF-14 Sync Estoque e Preço" },
      { number: 45, functionality: "Links de checkout por produto", description: "Cada produto tem seu link de compra. A IA manda o link direto no WhatsApp pro cliente finalizar.", status: "in_progress", priority: "Alta", observations: "Campo checkout_url por produto — em ajuste final" },
    ],
  },
  {
    name: "7. Ferramentas do Agente (Tool Calling)",
    description: "As 9 ferramentas que a IA usa durante a conversa: buscar produto, enviar foto/vídeo, agendar visita, cadastrar lead, gerar orçamento, mover no funil, cobrar e transferir pro vendedor.",
    items: [
      { number: 46, functionality: "Buscar produto no catálogo", description: "A IA busca por nome, categoria, tamanho, preço ou disponibilidade. Encontra o produto certo pro cliente.", status: "done", priority: "Alta", observations: "Implementado no agent-tools" },
      { number: 47, functionality: "Enviar foto/vídeo no WhatsApp", description: "A IA manda foto e vídeo do produto direto no chat, com legenda explicando e delay anti-spam.", status: "done", priority: "Alta", observations: "Fix: enviar_midia_whatsapp migrado de toolHttpRequest → toolWorkflow + rename. Envio funcional end-to-end." },
      { number: 48, functionality: "Agendar visita à loja", description: "Agenda visita presencial com data/hora, manda endereço com Google Maps e confirma pro cliente.", status: "done", priority: "Alta", observations: "WF-08 + Google Calendar + tabela visitas" },
      { number: 49, functionality: "Gerar orçamento formal", description: "Gera um orçamento com todos os itens, descontos, forma de pagamento e validade. Manda pro cliente.", status: "done", priority: "Alta", observations: "WF-09 gera orçamento HTML/PDF." },
      { number: 50, functionality: "Agendar follow-up automático", description: "Agenda lembretes automáticos: 'medir o espaço', 'finalizar compra', 'ver orçamento pendente'.", status: "done", priority: "Alta", observations: "Implementado no agent-tools + tabela follow_ups" },
      { number: 51, functionality: "Cadastrar lead no CRM", description: "Cadastra o cliente automaticamente com nome, telefone, e-mail, interesse e de onde veio.", status: "done", priority: "Alta", observations: "Cadastro automático via agent-tools" },
      { number: 52, functionality: "Mover no funil de vendas", description: "Move o cliente entre as etapas: novo → qualificado → orçamento → negociação → fechado.", status: "done", priority: "Alta", observations: "mover_pipeline no agent-tools" },
      { number: 53, functionality: "Gerar link de pagamento", description: "Gera link de cobrança pra o cliente pagar online. Depende do gateway de pagamento do cliente.", status: "done", priority: "Alta", observations: "gerar_cobranca implementado: checkout do produto → checkout da loja → pagamento manual. Registra em vendas + logs_execucao." },
      { number: 54, functionality: "Transferir para vendedor humano", description: "Quando precisa de humano: transfere com resumo completo da conversa e nível de prioridade.", status: "done", priority: "Alta", observations: "WF-05 + WF-12 + handoff.ts" },
    ],
  },
  {
    name: "8. Automações de Follow-up",
    description: "Mensagens automáticas de acompanhamento: carrinho abandonado, orçamento pendente, promoção ignorada, pós-visita. Cada tipo pode ter desconto configurável.",
    items: [
      { number: 55, functionality: "Follow-up de interação inicial", description: "Se o cliente mandou mensagem mas não avançou, a IA manda um lembrete amigável depois de um tempo.", status: "done", priority: "Alta", observations: "WF-02 cron refinado" },
      { number: 56, functionality: "Follow-up de carrinho abandonado", description: "Cliente viu produto, recebeu link mas não comprou? A IA manda oferta com desconto de 5% ou 10%.", status: "done", priority: "Alta", observations: "WF-02 + desconto_carrinho_abandonado configurável" },
      { number: 57, functionality: "Follow-up de promoção não respondida", description: "Cliente recebeu promoção e não respondeu? A IA tenta de novo com um desconto extra.", status: "done", priority: "Alta", observations: "WF-02 + desconto_promocao_nao_respondida configurável" },
      { number: 58, functionality: "Follow-up de orçamento pendente", description: "Cliente pediu orçamento e não fechou? A IA retoma a conversa oferecendo ajuda pra finalizar.", status: "done", priority: "Alta", observations: "WF-02 + desconto_followup_orcamento configurável" },
      { number: 59, functionality: "Follow-up pós-visita à loja", description: "Depois que o cliente visita a loja, a IA manda mensagem perguntando se gostou e se quer fechar.", status: "in_progress", priority: "Média", observations: "Em finalização — trigger pós status 'realizada'" },
      { number: 60, functionality: "Follow-up de medidas", description: "Cliente disse que vai medir o espaço? A IA lembra depois de uns dias: 'Já conseguiu medir?'", status: "in_progress", priority: "Média", observations: "Em finalização" },
      { number: 61, functionality: "Follow-up pós-venda", description: "Depois da compra, manda mensagem pedindo avaliação e perguntando se precisa de mais alguma coisa.", status: "in_progress", priority: "Média", observations: "Em finalização — integrado com NPS" },
    ],
  },
  {
    name: "9. Promoções e Segmentação",
    description: "Disparo de promoções direcionadas pra clientes certos. Ex: quem perguntou de colchão recebe promoção de colchão. Descontos configuráveis por tipo de campanha.",
    items: [
      { number: 62, functionality: "Disparo de promoções segmentadas", description: "Manda promoção só pra quem tem interesse. Ex: quem perguntou de colchão recebe oferta de colchão.", status: "done", priority: "Alta", observations: "WF-13 + campaign-dispatch edge function" },
      { number: 63, functionality: "Segmentação por perfil", description: "Filtra clientes por interesse, categoria, faixa de preço. Promoção certeira, não spam.", status: "done", priority: "Alta", observations: "segment_type + segment_config" },
      { number: 64, functionality: "Desconto de recuperação de carrinho", description: "Desconto configurável (5%, 10%) pra recuperar clientes que abandonaram o carrinho.", status: "done", priority: "Alta", observations: "Campo desconto_carrinho_abandonado configurável" },
      { number: 65, functionality: "Desconto de promoção não respondida", description: "Desconto extra pra clientes que não responderam a promoção anterior.", status: "done", priority: "Alta", observations: "Campo desconto_promocao_nao_respondida configurável" },
    ],
  },
  {
    name: "10. CRM e Pipeline de Vendas",
    description: "O sistema que organiza todos os clientes num funil: novo → qualificado → orçamento → negociação → fechado. Registra toda a história de cada cliente automaticamente.",
    items: [
      { number: 66, functionality: "Cadastro automático de lead", description: "Quando alguém manda mensagem pela primeira vez, já vira um lead no CRM automaticamente.", status: "done", priority: "Alta", observations: "cadastrar_lead no agent-tools" },
      { number: 67, functionality: "Registro do canal de origem", description: "Sabe se o cliente veio do WhatsApp, Instagram, Google, tráfego pago, etc.", status: "done", priority: "Alta", observations: "Campo canal_origem + origem" },
      { number: 68, functionality: "Histórico completo do cliente", description: "Tudo registrado: última conversa, produtos vistos, orçamentos, follow-ups, visitas.", status: "done", priority: "Alta", observations: "historico_mensagens + ultima_interacao + midias_enviadas" },
      { number: 69, functionality: "Movimentação automática no funil", description: "O lead avança sozinho no funil conforme a conversa evolui: novo → qualificado → orçamento → fechado.", status: "done", priority: "Alta", observations: "mover_pipeline via agent-tools" },
      { number: 70, functionality: "Tracking de visualização de produto", description: "Registra quais produtos o cliente viu (quais fotos/vídeos a IA mandou pra ele).", status: "done", priority: "Média", observations: "Tabela midias_enviadas" },
    ],
  },
  {
    name: "11. Envio de Mídias e Checkout",
    description: "Envio de fotos e vídeos dos produtos direto no WhatsApp, com botão de 'Comprar Agora' e link de checkout. Inclui anti-spam com delay entre mensagens.",
    items: [
      { number: 71, functionality: "Envio de fotos com legenda", description: "A IA manda a foto do produto no WhatsApp com uma legenda explicando: nome, preço, detalhes.", status: "done", priority: "Alta", observations: "WF-04/WF-06 corrigidos — envio funcional" },
      { number: 72, functionality: "Envio de vídeos demonstrativos", description: "Manda vídeo do produto em uso: colchão sendo testado, sofá na sala, mesa montada.", status: "done", priority: "Alta", observations: "WF-06 suporta vídeo — testado end-to-end" },
      { number: 73, functionality: "Delay anti-spam entre envios", description: "Espera 1,5s entre cada mensagem pra não parecer spam e não ser bloqueado pelo WhatsApp.", status: "done", priority: "Alta", observations: "WF-04 node Wait validado" },
      { number: 74, functionality: "Ordem correta de processamento", description: "Primeiro manda a mídia, depois o texto explicativo, depois registra no CRM. Sem bagunça.", status: "done", priority: "Alta", observations: "Pipeline WF-04 corrigido" },
      { number: 75, functionality: "Follow-up de carrinho abandonado", description: "24h depois de enviar o link e o cliente não comprar, manda lembrete com oferta especial.", status: "in_progress", priority: "Alta", observations: "Em finalização — integrado com WF-02" },
    ],
  },
  {
    name: "12. Regras de Negócio por Loja",
    description: "Configurações específicas de cada loja: horário, endereço, formas de pagamento, política de troca, prazo de entrega, frete grátis e plataforma de e-commerce.",
    items: [
      { number: 76, functionality: "Horário de funcionamento", description: "A IA sabe o horário da loja e avisa o cliente quando tá fechado. Bug ativo: agente respondendo fora do horário mesmo dentro do expediente — fix em andamento.", status: "in_progress", priority: "Alta", observations: "horario_inicio + horario_fim + dias_funcionamento — debug _debug_horario adicionado no WF-01 pra diagnosticar" },
      { number: 77, functionality: "Endereço da loja", description: "Endereço configurável. A IA manda quando o cliente pergunta onde fica.", status: "done", priority: "Alta", observations: "Campo endereco na tabela lojas" },
      { number: 78, functionality: "Link do Google Maps", description: "Manda o link clicável do Google Maps pra o cliente ir direto na loja.", status: "done", priority: "Alta", observations: "Campo maps_link na tabela lojas" },
      { number: 79, functionality: "Formas de pagamento", description: "Pix, cartão, boleto, parcelamento — a IA sabe o que a loja aceita e informa.", status: "done", priority: "Alta", observations: "Campo formas_pagamento na tabela lojas" },
      { number: 80, functionality: "Política de troca", description: "A IA explica a política de troca da loja quando o cliente pergunta.", status: "done", priority: "Alta", observations: "Campo politica_troca na tabela lojas" },
      { number: 81, functionality: "Prazo de entrega", description: "Informa em quanto tempo o produto chega na casa do cliente.", status: "done", priority: "Alta", observations: "Campo prazo_entrega na tabela lojas" },
      { number: 82, functionality: "Frete grátis", description: "Avisa que acima de determinado valor o frete é grátis. Valor configurável por loja.", status: "done", priority: "Alta", observations: "Campo frete_gratis_acima na tabela lojas" },
      { number: 83, functionality: "Plataforma de e-commerce", description: "Sabe qual plataforma a loja usa (Shopify, Nuvemshop, etc.) pra gerar os links certos.", status: "done", priority: "Alta", observations: "Campo plataforma_ecommerce na tabela lojas" },
    ],
  },
  {
    name: "13. Cross-sell e Upsell",
    description: "Sugestões inteligentes de produtos complementares. Ex: comprou cama? A IA sugere colchão. Comprou rack? Sugere painel. Monta combos por ambiente.",
    items: [
      { number: 84, functionality: "Sugestão por ambiente", description: "Vendeu um rack? A IA sugere painel e mesa de centro. Vendeu cama? Sugere colchão e criado-mudo.", status: "in_progress", priority: "Alta", observations: "Lógica de sugestão por ambiente em finalização" },
      { number: 85, functionality: "Upsell automático", description: "Regras automáticas: cama → colchão, colchão → travesseiro, rack → painel. Aumenta o ticket.", status: "in_progress", priority: "Alta", observations: "Regras de upsell no prompt do agente em ajuste final" },
      { number: 86, functionality: "Combos por ambiente", description: "Apresenta conjuntos completos: 'Kit Quarto Completo', 'Kit Sala de Estar'. Desconto no combo.", status: "in_progress", priority: "Média", observations: "Em finalização — combos configuráveis por loja" },
    ],
  },
  {
    name: "14. Logística",
    description: "Tudo sobre entrega: retirada na loja ou entrega em casa, prazo por região, serviço de montagem e frete grátis acima de um valor configurável.",
    items: [
      { number: 87, functionality: "Retirada ou entrega", description: "A IA pergunta se o cliente quer retirar na loja ou receber em casa.", status: "done", priority: "Alta", observations: "Prompt do agente orienta a perguntar" },
      { number: 88, functionality: "Prazo de entrega por região", description: "Informa o prazo de entrega baseado na região do cliente.", status: "done", priority: "Alta", observations: "Campo prazo_entrega configurável" },
      { number: 89, functionality: "Serviço de montagem", description: "Avisa se a loja oferece montagem e se é incluso ou pago à parte.", status: "done", priority: "Média", observations: "Campo montagem_disponivel na tabela lojas" },
      { number: 90, functionality: "Frete grátis acima do valor", description: "Informa o valor mínimo pra frete grátis. Incentiva o cliente a completar o carrinho.", status: "done", priority: "Alta", observations: "Campo frete_gratis_acima" },
    ],
  },
  {
    name: "15. Pós-Venda",
    description: "Acompanhamento depois da compra: perguntar se o móvel ficou bom, se o colchão é confortável, pedir avaliação e oferecer produtos complementares.",
    items: [
      { number: 91, functionality: "Mensagem pós-entrega", description: "Depois que o produto chega, a IA manda: 'Tudo chegou direitinho? Precisa de algo?'", status: "in_progress", priority: "Média", observations: "Template em finalização" },
      { number: 92, functionality: "Pós-colchão personalizado", description: "Mensagem especial pra quem comprou colchão: 'Como foi sua primeira noite? Dormiu bem?'", status: "in_progress", priority: "Média", observations: "Template por categoria em ajuste" },
      { number: 93, functionality: "Pós-móvel personalizado", description: "Mensagem especial pra quem comprou móvel: 'Como ficou o ambiente? Manda uma foto!'", status: "in_progress", priority: "Média", observations: "Template por categoria em ajuste" },
      { number: 94, functionality: "Pedido de avaliação", description: "Pede pro cliente avaliar a compra e a loja. Nota de 1 a 10 (NPS) + comentário.", status: "in_progress", priority: "Média", observations: "Integrado com fluxo NPS existente" },
      { number: 95, functionality: "Oferta de complemento", description: "Depois da compra, sugere produtos que combinam: 'Que tal um travesseiro pra combinar com seu colchão?'", status: "in_progress", priority: "Baixa", observations: "Vinculado ao cross-sell pós-venda" },
    ],
  },
  {
    name: "16. Transbordo para Humano",
    description: "Quando a IA transfere pro vendedor humano: reclamação, troca, negociação especial, móvel planejado. Envia um resumo completo da conversa pro vendedor.",
    items: [
      { number: 96, functionality: "Transferência a pedido do cliente", description: "Se o cliente pedir pra falar com um humano, a IA transfere imediatamente.", status: "done", priority: "Alta", observations: "transferir_humano no agent-tools" },
      { number: 97, functionality: "Negociação especial de preço", description: "Se o cliente quer negociar preço além do que a IA pode oferecer, transfere pro vendedor.", status: "done", priority: "Alta", observations: "Lógica no prompt do agente" },
      { number: 98, functionality: "Reclamações", description: "Cliente reclamou? Transfere imediatamente pro humano resolver.", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 99, functionality: "Troca e devolução", description: "Pedidos de troca ou devolução vão direto pro humano — IA não resolve isso.", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 100, functionality: "Móveis planejados", description: "Projetos de planejados precisam de medição e visita técnica. A IA transfere pro especialista.", status: "done", priority: "Alta", observations: "Handoff automático" },
      { number: 101, functionality: "Fallback inteligente", description: "Se a IA não sabe resolver, admite e transfere pro humano ao invés de inventar resposta.", status: "done", priority: "Alta", observations: "Fallback no agent-tools" },
      { number: 102, functionality: "Resumo da conversa pro vendedor", description: "Quando transfere, manda um resumo completo pro vendedor: o que o cliente quer, o que já viu, etc.", status: "done", priority: "Alta", observations: "WF-05 envia resumo ao transbordar" },
      { number: 103, functionality: "Prioridade configurável", description: "Define se a transferência é urgente (reclamação) ou normal (dúvida).", status: "done", priority: "Média", observations: "Parâmetro prioridade no transferir_humano" },
    ],
  },
  {
    name: "17. Drive-to-Store",
    description: "Levar o cliente pra loja física: agendar visita, enviar endereço com Google Maps, registrar produtos de interesse e atribuir vendedor responsável.",
    items: [
      { number: 104, functionality: "Agendamento de visita presencial", description: "A IA agenda visita na loja: escolhe data/hora, coloca no Google Calendar e confirma pro cliente.", status: "done", priority: "Alta", observations: "WF-08 + Google Calendar + tabela visitas" },
      { number: 105, functionality: "Confirmação com endereço e Maps", description: "Manda confirmação com endereço, data, hora e link clicável do Google Maps.", status: "done", priority: "Alta", observations: "maps_link + data_visita" },
      { number: 106, functionality: "Produtos de interesse na visita", description: "Registra quais produtos o cliente quer ver presencialmente. O vendedor já se prepara.", status: "done", priority: "Média", observations: "Campo produtos_interesse na tabela visitas" },
      { number: 107, functionality: "Vendedor responsável", description: "Opcional: atribui um vendedor específico pra atender o cliente na visita.", status: "done", priority: "Baixa", observations: "Campo vendedor_responsavel na tabela visitas" },
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
    nodes: ["Webhook", "If", "Respond to Webhook", "Code", "HTTP Request", "AI Agent (OpenAI)", "Tool Workflow", "Evolution API", "Redis", "Memory Buffer Window"],
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
    name: "Enviar Mídia WhatsApp (v2) — DESCONTINUADO",
    nodes: ["Execute Workflow Trigger", "HTTP Request", "If", "Evolution API", "Code"],
  },
  {
    id: "WF-07",
    name: "Buscar Produto RAG (v2) — DESCONTINUADO",
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
  { date: "2026-04-15T19:00:00", title: "✅ Onboarding Wizard para Lojas", description: "Wizard de 5 etapas (Identidade → Localização → Logística → IA → E-commerce) aparece automaticamente quando campos essenciais estão vazios.", type: "feature" },
  { date: "2026-04-15T18:30:00", title: "✅ Unificação nome_assistente → nome_assistente_ia", description: "Campos duplicados unificados. Migration copiou dados, frontend atualizado em 4 arquivos, coluna antiga marcada DEPRECATED.", type: "fix" },
  { date: "2026-04-15T18:00:00", title: "✅ gerar_cobranca funcional", description: "Edge function agent-tools: 3 cenários (checkout produto → checkout loja → pagamento manual). Registra venda + log.", type: "feature" },
  { date: "2026-04-15T17:30:00", title: "✅ Migration external_id + plataforma", description: "Colunas external_id, plataforma e synced_at adicionadas à tabela produtos. Unique index para upsert do WF-07 Sync.", type: "infra" },
  { date: "2026-04-15T17:00:00", title: "🔒 RLS habilitado em juliana_crisis_log + search_path fixado", description: "Todas as tabelas agora têm RLS. Funções mutable com search_path fixo.", type: "fix" },
  { date: "2026-04-15T16:30:00", title: "🔒 Segurança: Keys migradas para Credentials", description: "SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY e EVOLUTION_API_KEY removidas dos workflows e migradas para Predefined Credential Types no N8N.", type: "infra" },
  { date: "2026-04-15T16:00:00", title: "✅ WF-01 on_conflict corrigido", description: "Upsert de leads corrigido: on_conflict=loja_id,telefone (antes era telefone,instance).", type: "fix" },
  { date: "2026-04-15T15:30:00", title: "✅ WF-02 Follow-up com JOIN correto", description: "Query corrigida com select=*,leads(*),lojas(*). Code node atualizado para referenciar dados relacionais.", type: "fix" },
  { date: "2026-04-15T15:00:00", title: "✅ WF-06/WF-07 legados descontinuados", description: "Workflows v2 marcados como inativos. WF-01 usa apenas WF-03 (RAG) e WF-04 (mídia).", type: "infra" },
  { date: "2026-04-15T14:30:00", title: "✅ Anti-spam delay entre mídias", description: "Wait node de 1.5s adicionado entre envios consecutivos no WF-04.", type: "fix" },
  { date: "2026-04-15T04:00:00", title: "🔥 Seção Promoções em Destaque no Catálogo", description: "Nova seção visual na página LojaCatalogo com cards de produtos em promoção: badge PROMOÇÃO, foto, preço riscado, % OFF, estoque e botão editar. Renderização condicional.", type: "feature" },
  { date: "2026-04-15T03:30:00", title: "🐛 Fix WF-05: lead_id undefined no Supabase", description: "Corrigido bug onde o nó 'Supabase - Buscar Histórico Completo' recebia lead_id undefined, causando falha na busca do histórico durante transbordo.", type: "fix" },
  { date: "2026-04-15T03:00:00", title: "🐛 Fix WF-01: Filtro de áudio no IF Validar Payload", description: "Adicionado filtro para ignorar mensagens de áudio (audioMessage) no IF de validação do webhook, evitando auto-resposta em áudios.", type: "fix" },
  { date: "2026-04-15T02:30:00", title: "🔧 Fix enviar_midia: toolHttpRequest → toolWorkflow", description: "Ferramenta enviar_midia_whatsapp migrada de Tool HTTP Request para Tool Workflow no WF-01, corrigindo envio de mídias pelo agente. Renomeada para consistência.", type: "fix" },
  { date: "2026-04-15T01:00:00", title: "🐛 Fix: Agente respondendo fora do horário comercial", description: "Bug onde o agente diz que está fora do expediente mesmo dentro do horário. Debug _debug_horario adicionado no WF-01 pra diagnosticar cálculo BRT vs UTC e dias_funcionamento.", type: "fix" },
  { date: "2026-04-15T00:30:00", title: "WF-05 Transbordo — Redis + Grupo vendedores", description: "Adicionado Redis SET com TTL 24h para marcar pausa do agente. Notificação automática ao grupo de vendedores no WhatsApp quando configurado.", type: "feature" },
  { date: "2026-04-15T00:00:00", title: "WF-02 Follow-up — Config por loja + novos templates", description: "Follow-up agora carrega config da loja antes de montar contexto. Novos templates: pós-colchão, pós-móvel, pós-entrega, avaliação e complementar_ambiente.", type: "feature" },
  { date: "2026-04-14T23:00:00", title: "Sprint final com Claude Code — 15 itens concluídos", description: "Workflows WF-02, WF-04, WF-06, WF-09, WF-11 finalizados. Envio de mídias, follow-ups e orçamento corrigidos e testados end-to-end.", type: "progress" },
  { date: "2026-04-14T20:00:00", title: "RAG + Busca semântica validada", description: "match_produtos testado end-to-end com embeddings reais. Re-indexação automática (WF-11) ativada com trigger.", type: "feature" },
  { date: "2026-04-14T18:00:00", title: "Envio de mídias corrigido (WF-04/WF-06)", description: "Pipeline de envio de fotos e vídeos no WhatsApp funcionando. Delay anti-spam e ordem mídia→texto→CRM validados.", type: "fix" },
  { date: "2026-04-14T16:00:00", title: "Limpeza de referências CUBO", description: "Removidas todas as referências à CUBO Consultoria. Tema renomeado para lojaads-theme. URLs hardcoded substituídas por env vars.", type: "infra" },
  { date: "2026-04-14T14:30:00", title: "Roadmap atualizado — 74 itens concluídos", description: "Auditoria completa do projeto. 24 itens adicionais marcados como feitos após análise das edge functions e prompts.", type: "progress" },
  { date: "2026-04-13T22:00:00", title: "Follow-ups refinados (WF-02)", description: "Regras de carrinho abandonado, orçamento pendente e promoção não respondida finalizadas. Descontos configuráveis por loja.", type: "feature" },
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
