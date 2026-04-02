ALTER TABLE public.nps_responses
  ALTER COLUMN patient_id DROP NOT NULL;

ALTER TABLE public.nps_responses
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS loja_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nps_responses_target_check'
      AND conrelid = 'public.nps_responses'::regclass
  ) THEN
    ALTER TABLE public.nps_responses
      ADD CONSTRAINT nps_responses_target_check
      CHECK (patient_id IS NOT NULL OR lead_id IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nps_responses_lead_id_fkey'
      AND conrelid = 'public.nps_responses'::regclass
  ) THEN
    ALTER TABLE public.nps_responses
      ADD CONSTRAINT nps_responses_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nps_responses_loja_id_fkey'
      AND conrelid = 'public.nps_responses'::regclass
  ) THEN
    ALTER TABLE public.nps_responses
      ADD CONSTRAINT nps_responses_loja_id_fkey
      FOREIGN KEY (loja_id) REFERENCES public.lojas(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nps_responses_lead_id ON public.nps_responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_loja_id_created_at ON public.nps_responses(loja_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_sale_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (loja_id, lead_id)
);

ALTER TABLE public.post_sale_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_sale_contacts'
      AND policyname = 'post_sale_contacts access'
  ) THEN
    CREATE POLICY "post_sale_contacts access"
    ON public.post_sale_contacts
    FOR ALL
    TO authenticated
    USING (public.has_loja_access(auth.uid(), loja_id))
    WITH CHECK (public.has_loja_access(auth.uid(), loja_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_post_sale_contacts_loja_sent_at ON public.post_sale_contacts(loja_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_sale_contacts_lead_id ON public.post_sale_contacts(lead_id);

DROP TRIGGER IF EXISTS set_post_sale_contacts_updated_at ON public.post_sale_contacts;
CREATE TRIGGER set_post_sale_contacts_updated_at
BEFORE UPDATE ON public.post_sale_contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();