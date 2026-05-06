ALTER TABLE lojas ADD COLUMN IF NOT EXISTS meta_phone_number_id text;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS meta_waba_id text;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS meta_access_token_encrypted text;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS api_provider text DEFAULT 'evolution' CHECK (api_provider IN ('evolution','meta_cloud'));