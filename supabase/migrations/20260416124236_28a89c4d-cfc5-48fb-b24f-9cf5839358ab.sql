ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS plataforma  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS produtos_external_loja_uidx
  ON produtos (external_id, loja_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN DEFAULT false;