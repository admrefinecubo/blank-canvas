ALTER TABLE produtos DROP COLUMN IF EXISTS embedding;
ALTER TABLE produtos ADD COLUMN embedding vector(768);

DROP FUNCTION IF EXISTS match_produtos(vector(3072), uuid, int, float);
DROP FUNCTION IF EXISTS match_produtos(vector(768), uuid, int, float);

CREATE OR REPLACE FUNCTION match_produtos(
  query_embedding vector(768),
  loja_id_param uuid,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid, nome text, descricao text, preco_original numeric,
  preco_promocional numeric, estoque_disponivel boolean,
  checkout_url text, foto_principal text, similarity float
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nome, p.descricao, p.preco_original, p.preco_promocional,
    p.estoque_disponivel, p.checkout_url, p.foto_principal,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM produtos p
  WHERE p.loja_id = loja_id_param
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_produtos_embedding
ON produtos USING hnsw (embedding vector_cosine_ops);