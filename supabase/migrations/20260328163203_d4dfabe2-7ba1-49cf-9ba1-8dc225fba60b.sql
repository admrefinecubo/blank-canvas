
-- Extensão para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de lojas/tenants do agente WhatsApp
CREATE TABLE IF NOT EXISTS lojas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_loja TEXT NOT NULL,
  nome_assistente TEXT DEFAULT 'Sofia',
  tom_voz TEXT DEFAULT 'amigável, profissional e consultivo',
  especialidades TEXT DEFAULT 'móveis e colchões',
  horario_inicio TEXT DEFAULT '08:00',
  horario_fim TEXT DEFAULT '18:00',
  endereco TEXT,
  maps_link TEXT,
  formas_pagamento TEXT DEFAULT 'Dinheiro, cartão de crédito/débito e PIX',
  politica_troca TEXT DEFAULT '30 dias para troca',
  prazo_entrega TEXT DEFAULT '7 a 15 dias úteis',
  frete_gratis_acima NUMERIC DEFAULT 1000,
  instance TEXT NOT NULL,
  regras_personalidade TEXT,
  plataforma_ecommerce TEXT DEFAULT 'manual',
  webhook_catalogo_url TEXT,
  checkout_base_url TEXT,
  montagem_disponivel BOOLEAN DEFAULT false,
  desconto_carrinho_abandonado INT DEFAULT 5,
  desconto_promocao_nao_respondida INT DEFAULT 10,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de produtos por loja
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  tags TEXT,
  especificacoes TEXT,
  variacoes TEXT,
  preco_original NUMERIC NOT NULL,
  preco_promocional NUMERIC,
  estoque_disponivel BOOLEAN DEFAULT true,
  foto_principal TEXT,
  foto_detalhe TEXT,
  video_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads captados pelo agente
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  interesse TEXT,
  etapa_pipeline TEXT DEFAULT 'novo',
  origem TEXT DEFAULT 'whatsapp',
  ultima_interacao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS historico_mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  telefone TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controle de mensagens já processadas (anti-duplicidade)
CREATE TABLE IF NOT EXISTS mensagens_processadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-ups agendados
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  tipo TEXT NOT NULL,
  mensagem TEXT,
  agendado_para TIMESTAMPTZ NOT NULL,
  enviado BOOLEAN DEFAULT false,
  enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitas agendadas na loja
CREATE TABLE IF NOT EXISTS visitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  data_visita TIMESTAMPTZ,
  status TEXT DEFAULT 'agendada',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_processadas ENABLE ROW LEVEL SECURITY;
