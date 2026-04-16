CREATE UNIQUE INDEX IF NOT EXISTS produtos_external_loja_uidx 
  ON produtos(external_id, loja_id) 
  WHERE external_id IS NOT NULL;