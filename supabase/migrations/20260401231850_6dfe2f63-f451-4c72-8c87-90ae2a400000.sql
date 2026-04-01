ALTER TABLE public.lojas RENAME COLUMN link_google_maps TO maps_link;
ALTER TABLE public.lojas RENAME COLUMN url_base_checkout TO checkout_base_url;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS is_bot_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bot_paused_until timestamptz;

DROP TRIGGER IF EXISTS validate_loja_clinic_link_trigger ON public.lojas;
CREATE TRIGGER validate_loja_clinic_link_trigger
BEFORE INSERT OR UPDATE ON public.lojas
FOR EACH ROW
EXECUTE FUNCTION public.validate_loja_clinic_link();

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON %I.%I;', t.table_schema, t.table_name);
    EXECUTE format(
      'CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t.table_schema,
      t.table_name
    );
  END LOOP;
END $$;