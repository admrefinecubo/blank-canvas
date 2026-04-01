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
SET search_path = public
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