ALTER TABLE public.logs_execucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_processadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins can manage execution logs"
ON public.logs_execucao
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "platform admins can manage processed messages"
ON public.mensagens_processadas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE OR REPLACE FUNCTION public.match_produtos(
  query_embedding extensions.vector,
  loja_id_param uuid,
  match_threshold double precision DEFAULT 0.72,
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text,
  categoria text,
  preco_original numeric,
  preco_promocional numeric,
  estoque_disponivel boolean,
  foto_principal text,
  video_url text,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    id, nome, descricao, categoria,
    preco_original, preco_promocional,
    estoque_disponivel, foto_principal, video_url,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.produtos
  WHERE loja_id = loja_id_param
    AND estoque_disponivel = TRUE
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;