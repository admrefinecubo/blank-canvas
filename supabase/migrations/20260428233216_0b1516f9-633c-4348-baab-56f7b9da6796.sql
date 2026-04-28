CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE VIEW public.vw_catalogo_ia AS
SELECT
  p.loja_id,
  p.id              AS produto_id,
  v.id              AS variacao_id,
  p.plataforma,
  p.external_id     AS produto_external_id,
  v.external_id     AS variacao_external_id,
  COALESCE(v.nome, p.nome)  AS nome_exibicao,
  p.nome            AS nome_produto,
  v.nome            AS nome_variacao,
  COALESCE(v.sku, p.sku)    AS sku,
  COALESCE(v.preco, p.preco_original)          AS preco,
  COALESCE(v.preco_promocional, p.preco_promocional) AS preco_promocional,
  CASE WHEN v.id IS NOT NULL THEN v.estoque ELSE p.estoque END AS estoque,
  CASE WHEN v.id IS NOT NULL THEN v.estoque_disponivel ELSE p.estoque_disponivel END AS estoque_disponivel,
  COALESCE(v.checkout_url, p.checkout_url)     AS checkout_url,
  COALESCE(v.imagem_url, p.foto_principal)     AS imagem_url,
  p.categoria,
  p.tags,
  v.atributos,
  p.descricao,
  p.ativo           AS produto_ativo,
  v.ativo           AS variacao_ativa,
  p.source_updated_at AS produto_source_updated_at,
  v.source_updated_at AS variacao_source_updated_at
FROM produtos p
LEFT JOIN produto_variacoes v ON v.produto_id = p.id
WHERE p.ativo = TRUE
  AND (v.id IS NULL OR v.ativo = TRUE);

CREATE OR REPLACE FUNCTION public.ia_catalogo_buscar(params JSONB)
RETURNS SETOF public.vw_catalogo_ia
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loja_id UUID := (params->>'loja_id')::uuid;
  v_q TEXT := params->>'q';
  v_somente_disponiveis BOOLEAN := COALESCE((params->>'somente_disponiveis')::boolean, true);
  v_sku TEXT := params->>'sku';
  v_atributos JSONB := params->'atributos';
  v_limit INT := LEAST(COALESCE((params->>'limit')::int, 20), 50);
  v_offset INT := COALESCE((params->>'offset')::int, 0);
BEGIN
  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'loja_id e obrigatorio';
  END IF;

  RETURN QUERY
  SELECT *
  FROM vw_catalogo_ia c
  WHERE c.loja_id = v_loja_id
    AND (NOT v_somente_disponiveis OR c.estoque_disponivel = TRUE)
    AND (v_sku IS NULL OR c.sku = v_sku)
    AND (
      v_q IS NULL
      OR trim(v_q) = ''
      OR (
        SELECT bool_and(
          unaccent(COALESCE(c.nome_exibicao, '')) ILIKE '%' || unaccent(word) || '%'
          OR unaccent(COALESCE(c.descricao, '')) ILIKE '%' || unaccent(word) || '%'
          OR unaccent(COALESCE(c.tags, '')) ILIKE '%' || unaccent(word) || '%'
          OR unaccent(COALESCE(c.sku, '')) ILIKE '%' || unaccent(word) || '%'
          OR unaccent(COALESCE(c.categoria, '')) ILIKE '%' || unaccent(word) || '%'
        )
        FROM unnest(string_to_array(trim(v_q), ' ')) AS word
        WHERE word <> ''
      )
    )
    AND (v_atributos IS NULL OR c.atributos @> v_atributos)
  ORDER BY
    c.estoque_disponivel DESC,
    c.estoque DESC,
    c.nome_exibicao
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.ia_catalogo_buscar FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ia_catalogo_buscar TO service_role;