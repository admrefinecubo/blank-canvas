-- 1. Recriar coluna embedding com 3072 dims (gemini-embedding-001)
ALTER TABLE produtos DROP COLUMN IF EXISTS embedding;
ALTER TABLE produtos ADD COLUMN embedding vector(3072);

-- 2. Recriar função match_produtos com nova dimensão
DROP FUNCTION IF EXISTS public.match_produtos(vector, uuid, int, float);
DROP FUNCTION IF EXISTS public.match_produtos(vector, uuid, float, int);
DROP FUNCTION IF EXISTS public.match_produtos(vector, uuid, double precision, integer);

CREATE OR REPLACE FUNCTION public.match_produtos(
  query_embedding vector(3072),
  loja_id_param uuid,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  preco_original numeric,
  preco_promocional numeric,
  estoque_disponivel boolean,
  checkout_url text,
  foto_principal text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nome,
    p.descricao,
    p.preco_original,
    p.preco_promocional,
    p.estoque_disponivel,
    p.checkout_url,
    p.foto_principal,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM produtos p
  WHERE p.loja_id = loja_id_param
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;