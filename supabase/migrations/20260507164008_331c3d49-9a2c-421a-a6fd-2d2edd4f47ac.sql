-- 1. Colunas
ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS canal_whatsapp text NOT NULL DEFAULT 'evolution'
    CHECK (canal_whatsapp IN ('evolution','meta'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS wa_id text;

CREATE INDEX IF NOT EXISTS idx_leads_wa_id ON public.leads(wa_id) WHERE wa_id IS NOT NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

-- 2. meta_templates
CREATE TABLE IF NOT EXISTS public.meta_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('UTILITY','MARKETING','AUTHENTICATION')),
  idioma text NOT NULL DEFAULT 'pt_BR',
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','PAUSED','DISABLED')),
  num_variaveis int NOT NULL DEFAULT 0,
  tem_botoes boolean NOT NULL DEFAULT false,
  meta_template_id text,
  body_text text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(loja_id, nome, idioma)
);

CREATE INDEX IF NOT EXISTS idx_meta_templates_loja_id ON public.meta_templates(loja_id);
CREATE INDEX IF NOT EXISTS idx_meta_templates_status ON public.meta_templates(status);

ALTER TABLE public.meta_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_templates loja access"
ON public.meta_templates
FOR ALL
TO authenticated
USING (has_loja_access(auth.uid(), loja_id))
WITH CHECK (has_loja_access(auth.uid(), loja_id));

CREATE TRIGGER trg_meta_templates_updated_at
BEFORE UPDATE ON public.meta_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. meta_webhook_events
CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  waba_id text,
  phone_number_id text,
  wa_id text,
  message_id text,
  status text,
  raw_payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processing_error text
);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_received_at ON public.meta_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_wa_id ON public.meta_webhook_events(wa_id) WHERE wa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_message_id ON public.meta_webhook_events(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_processed ON public.meta_webhook_events(processed) WHERE processed = false;

ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_webhook_events admin only"
ON public.meta_webhook_events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

-- 4. normalize_phone_br
CREATE OR REPLACE FUNCTION public.normalize_phone_br(input text)
RETURNS TABLE(e164 text, com_nove text, sem_nove text)
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  digits text;
  ddd text;
BEGIN
  digits := regexp_replace(coalesce(input,''), '\D', '', 'g');

  IF length(digits) IN (10,11) THEN
    digits := '55' || digits;
  END IF;

  IF length(digits) NOT IN (12,13) THEN
    e164 := '+' || digits;
    com_nove := digits;
    sem_nove := digits;
    RETURN NEXT;
    RETURN;
  END IF;

  ddd := substring(digits FROM 3 FOR 2);

  IF length(digits) = 13 THEN
    com_nove := digits;
    sem_nove := '55' || ddd || substring(digits FROM 6);
  ELSE
    sem_nove := digits;
    com_nove := '55' || ddd || '9' || substring(digits FROM 5);
  END IF;

  e164 := '+' || com_nove;
  RETURN NEXT;
END;
$$;

-- 5. lead_pode_receber_texto_livre
CREATE OR REPLACE FUNCTION public.lead_pode_receber_texto_livre(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT COALESCE(last_inbound_at, '1970-01-01'::timestamptz) > now() - interval '24 hours'
  FROM public.leads
  WHERE id = p_lead_id;
$$;

-- 6. touch_lead_inbound
CREATE OR REPLACE FUNCTION public.touch_lead_inbound(p_lead_id uuid, p_wa_id text)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.leads
  SET last_inbound_at = now(),
      wa_id = COALESCE(wa_id, p_wa_id),
      updated_at = now()
  WHERE id = p_lead_id;
$$;