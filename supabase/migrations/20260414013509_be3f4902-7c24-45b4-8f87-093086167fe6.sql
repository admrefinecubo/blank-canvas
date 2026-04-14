-- Adicionar coluna de estoque numérico à tabela produtos (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produtos' AND column_name = 'estoque'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN estoque integer DEFAULT 0;
  END IF;
END $$;

-- Função RPC para decrementar estoque com segurança (não permite negativo)
CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_quantidade int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE produtos
  SET estoque = GREATEST(estoque - p_quantidade, 0)
  WHERE id = p_produto_id;
END;
$$;

-- Tabela de vendas para rastrear transações
CREATE TABLE IF NOT EXISTS public.vendas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid REFERENCES public.produtos(id),
  lead_id uuid REFERENCES public.leads(id),
  loja_id uuid REFERENCES public.lojas(id),
  valor_total numeric,
  descricao text,
  checkout_url text,
  status text DEFAULT 'link_gerado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Políticas de acesso RLS para a tabela vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas loja access"
ON public.vendas
FOR ALL
TO authenticated
USING (public.has_loja_access(auth.uid(), loja_id))
WITH CHECK (public.has_loja_access(auth.uid(), loja_id));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendas_updated_at
BEFORE UPDATE ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();