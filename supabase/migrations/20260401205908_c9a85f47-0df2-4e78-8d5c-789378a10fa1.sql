CREATE OR REPLACE FUNCTION public.validate_loja_clinic_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    RAISE EXCEPTION 'clinic_id is required for lojas';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.clinics
    WHERE id = NEW.clinic_id
  ) THEN
    RAISE EXCEPTION 'clinic_id must reference an existing clinic';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_loja_clinic_link_on_write ON public.lojas;

CREATE TRIGGER validate_loja_clinic_link_on_write
BEFORE INSERT OR UPDATE ON public.lojas
FOR EACH ROW
EXECUTE FUNCTION public.validate_loja_clinic_link();