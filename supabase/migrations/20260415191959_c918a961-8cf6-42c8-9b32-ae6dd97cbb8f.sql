-- Backfill: copiar nome_assistente para nome_assistente_ia onde nome_assistente_ia é NULL
UPDATE public.lojas
SET nome_assistente_ia = nome_assistente
WHERE nome_assistente_ia IS NULL
  AND nome_assistente IS NOT NULL;

-- Adicionar comentário de deprecação
COMMENT ON COLUMN public.lojas.nome_assistente IS 'DEPRECATED: use nome_assistente_ia. Mantido temporariamente para compatibilidade com workflows N8N.';