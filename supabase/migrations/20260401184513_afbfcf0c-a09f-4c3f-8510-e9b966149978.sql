CREATE OR REPLACE FUNCTION public.match_produtos(
  query_embedding vector(1536),
  loja_id_param uuid DEFAULT NULL,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  loja_id uuid,
  nome text,
  descricao text,
  categoria text,
  tags text,
  especificacoes text,
  preco_original numeric,
  preco_promocional numeric,
  variacoes text,
  estoque_disponivel boolean,
  foto_principal text,
  foto_detalhe text,
  video_url text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.loja_id,
    p.nome,
    p.descricao,
    p.categoria,
    p.tags,
    p.especificacoes,
    p.preco_original,
    p.preco_promocional,
    p.variacoes,
    p.estoque_disponivel,
    p.foto_principal,
    p.foto_detalhe,
    p.video_url,
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM public.produtos p
  WHERE p.embedding IS NOT NULL
    AND (loja_id_param IS NULL OR p.loja_id = loja_id_param)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE TABLE IF NOT EXISTS public.midias_enviadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'foto',
  url text NOT NULL,
  legenda text,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_midias_enviadas_loja_enviado_em
  ON public.midias_enviadas (loja_id, enviado_em DESC);

CREATE INDEX IF NOT EXISTS idx_midias_enviadas_lead_id
  ON public.midias_enviadas (lead_id);

CREATE INDEX IF NOT EXISTS idx_midias_enviadas_produto_id
  ON public.midias_enviadas (produto_id);

ALTER TABLE public.midias_enviadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins full access on midias_enviadas" ON public.midias_enviadas;
CREATE POLICY "Platform admins full access on midias_enviadas"
ON public.midias_enviadas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));