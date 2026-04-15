
-- 1. Enable RLS on juliana_crisis_log
ALTER TABLE public.juliana_crisis_log ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policy — only platform admins
CREATE POLICY "platform admins can manage crisis logs"
  ON public.juliana_crisis_log
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- 3. Fix search_path on mutable functions
CREATE OR REPLACE FUNCTION public.sync_canal_origem()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  IF NEW.canal_origem IS NOT NULL AND (OLD.canal_origem IS DISTINCT FROM NEW.canal_origem) THEN
    NEW.origem := NEW.canal_origem;
  END IF;
  IF NEW.origem IS NOT NULL AND (OLD.origem IS DISTINCT FROM NEW.origem) THEN
    NEW.canal_origem := NEW.origem;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_set_lead_loja_id()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF NEW.loja_id IS NULL AND NEW.instance IS NOT NULL THEN
    SELECT id INTO NEW.loja_id
    FROM lojas
    WHERE instance = NEW.instance
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_set_historico_loja_id()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF NEW.loja_id IS NULL AND NEW.telefone IS NOT NULL THEN
    SELECT loja_id INTO NEW.loja_id
    FROM leads
    WHERE telefone = NEW.telefone
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_loja_clinic_link()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    RAISE EXCEPTION 'clinic_id is required for lojas';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.clinics WHERE id = NEW.clinic_id
  ) THEN
    RAISE EXCEPTION 'clinic_id must reference an existing clinic';
  END IF;
  RETURN NEW;
END;
$function$;
