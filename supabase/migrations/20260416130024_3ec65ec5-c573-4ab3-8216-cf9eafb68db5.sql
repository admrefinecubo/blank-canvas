-- Convert variacoes from TEXT to JSONB
-- First, convert existing text data to JSONB array format
ALTER TABLE public.produtos
  ALTER COLUMN variacoes TYPE jsonb
  USING CASE
    WHEN variacoes IS NULL THEN NULL
    WHEN variacoes = '' THEN NULL
    WHEN variacoes ~ '^\[' THEN variacoes::jsonb
    ELSE jsonb_build_array(jsonb_build_object('nome', variacoes))
  END;

-- Add a comment explaining the expected schema
COMMENT ON COLUMN public.produtos.variacoes IS 'JSON array of variations: [{nome, preco, preco_promocional, checkout_url, estoque}]';