ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS onboarding_concluido boolean DEFAULT false;
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS external_id text;