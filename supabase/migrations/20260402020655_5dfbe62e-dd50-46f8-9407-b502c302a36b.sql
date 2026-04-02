CREATE TABLE IF NOT EXISTS public.promotional_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  name text NOT NULL,
  segment_type text NOT NULL,
  segment_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  message_template text NOT NULL,
  discount_percent numeric,
  targeted_leads_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'disparada',
  launched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promotional_campaigns'
      AND policyname = 'promotional_campaigns access'
  ) THEN
    CREATE POLICY "promotional_campaigns access"
    ON public.promotional_campaigns
    FOR ALL
    TO authenticated
    USING (public.has_loja_access(auth.uid(), loja_id))
    WITH CHECK (public.has_loja_access(auth.uid(), loja_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_loja_launched_at
  ON public.promotional_campaigns(loja_id, launched_at DESC);

DROP TRIGGER IF EXISTS set_promotional_campaigns_updated_at ON public.promotional_campaigns;
CREATE TRIGGER set_promotional_campaigns_updated_at
BEFORE UPDATE ON public.promotional_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.follow_ups
  ADD COLUMN IF NOT EXISTS campaign_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'follow_ups_campaign_id_fkey'
      AND conrelid = 'public.follow_ups'::regclass
  ) THEN
    ALTER TABLE public.follow_ups
      ADD CONSTRAINT follow_ups_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES public.promotional_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_follow_ups_campaign_id ON public.follow_ups(campaign_id);