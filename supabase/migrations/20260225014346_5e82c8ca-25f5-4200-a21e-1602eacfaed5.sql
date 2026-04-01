
-- Table to store clinic integrations config (Evolution API, Google Calendar)
CREATE TABLE public.clinic_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'evolution_api' or 'google_calendar'
  config jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'pending'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, provider)
);

ALTER TABLE public.clinic_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage integrations in their clinic"
ON public.clinic_integrations FOR ALL
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = clinic_integrations.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

-- Trigger: when appointment status changes to 'realizado', auto-update patient stage
CREATE OR REPLACE FUNCTION public.on_appointment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'realizado' AND (OLD.status IS NULL OR OLD.status != 'realizado') THEN
    -- Update patient stage to em_tratamento
    UPDATE public.patients SET stage = 'em_tratamento', updated_at = now()
    WHERE id = NEW.patient_id AND stage IN ('lead', 'paciente_ativo');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_appointment_completed
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.on_appointment_completed();
