CREATE UNIQUE INDEX IF NOT EXISTS leads_loja_telefone_uidx 
  ON leads(loja_id, telefone);