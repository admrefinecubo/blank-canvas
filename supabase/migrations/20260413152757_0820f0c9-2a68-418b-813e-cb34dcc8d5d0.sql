-- Add columns to visitas for items #108-109
ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS produtos_interesse text,
  ADD COLUMN IF NOT EXISTS vendedor_responsavel text;

-- Add dias_funcionamento to lojas for item #78
ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS dias_funcionamento text;

-- Add nps_comentario to leads for post-sale flow
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS nps_comentario text;