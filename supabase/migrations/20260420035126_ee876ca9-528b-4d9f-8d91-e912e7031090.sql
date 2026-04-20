-- Limpar embeddings antigos (modelo diferente = vetores incompatíveis)
UPDATE produtos SET embedding = NULL;

-- Recriar coluna com 768 dimensões (Gemini text-embedding-004)
ALTER TABLE produtos ALTER COLUMN embedding TYPE vector(768);

-- Recriar função match_produtos para 768 dims
DROP FUNCTION IF EXISTS public.match_produtos(vector, uuid, float, int);
DROP FUNCTION IF EXISTS public.match_produtos(vector, uuid, double precision, integer);

CREATE OR REPLACE FUNCTION public.match_produtos(
  query_embedding vector(768),
  loja_id_param uuid,
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  categoria text,
  tags text,
  especificacoes text,
  variacoes jsonb,
  preco_original numeric,
  preco_promocional numeric,
  estoque_disponivel boolean,
  foto_principal text,
  foto_detalhe text,
  video_url text,
  checkout_url text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.nome, p.descricao, p.categoria, p.tags,
    p.especificacoes, p.variacoes, p.preco_original, p.preco_promocional,
    p.estoque_disponivel, p.foto_principal, p.foto_detalhe, p.video_url, p.checkout_url,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM produtos p
  WHERE p.loja_id = loja_id_param
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;