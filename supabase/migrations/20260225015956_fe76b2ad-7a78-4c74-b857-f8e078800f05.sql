
-- 1. Tags nos pacientes + UTM tracking
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE INDEX IF NOT EXISTS idx_patients_tags ON public.patients USING GIN(tags);

-- 2. Professional name nos agendamentos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS professional_name text;

-- 3. Metas de faturamento
CREATE TABLE IF NOT EXISTS public.revenue_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  period text NOT NULL, -- '2026-02' format
  target_amount numeric NOT NULL DEFAULT 0,
  professional_name text, -- null = meta geral da clínica
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, period, professional_name)
);

ALTER TABLE public.revenue_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage goals in their clinic"
ON public.revenue_goals FOR ALL
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = revenue_goals.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

-- 4. Logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  user_id uuid,
  user_email text,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic users can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = audit_logs.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic ON public.audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 5. Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clinic_id uuid;
  _user_id uuid;
  _user_email text;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  
  IF TG_OP = 'DELETE' THEN
    _clinic_id := OLD.clinic_id;
    INSERT INTO public.audit_logs (clinic_id, user_id, user_email, action, table_name, record_id, old_data)
    VALUES (_clinic_id, _user_id, _user_email, 'DELETE', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _clinic_id := NEW.clinic_id;
    INSERT INTO public.audit_logs (clinic_id, user_id, user_email, action, table_name, record_id, old_data, new_data)
    VALUES (_clinic_id, _user_id, _user_email, 'UPDATE', TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    _clinic_id := NEW.clinic_id;
    INSERT INTO public.audit_logs (clinic_id, user_id, user_email, action, table_name, record_id, new_data)
    VALUES (_clinic_id, _user_id, _user_email, 'INSERT', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers to key tables
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_budgets AFTER INSERT OR UPDATE OR DELETE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_financial AFTER INSERT OR UPDATE OR DELETE ON public.financial_installments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 6. Post-procedure automation templates table
CREATE TABLE IF NOT EXISTS public.post_procedure_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  name text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 24,
  message_template text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_procedure_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage post procedure templates in their clinic"
ON public.post_procedure_templates FOR ALL
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = post_procedure_templates.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);
