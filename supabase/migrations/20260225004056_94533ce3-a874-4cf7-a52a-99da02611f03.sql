
-- Patients / Leads table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  source TEXT DEFAULT 'manual',
  stage TEXT DEFAULT 'lead',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patients of their clinic"
  ON public.patients FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = patients.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert patients in their clinic"
  ON public.patients FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = patients.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can update patients in their clinic"
  ON public.patients FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = patients.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can delete patients in their clinic"
  ON public.patients FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = patients.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Procedures catalog
CREATE TABLE public.procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view procedures of their clinic"
  ON public.procedures FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = procedures.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert procedures in their clinic"
  ON public.procedures FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = procedures.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can update procedures in their clinic"
  ON public.procedures FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = procedures.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can delete procedures in their clinic"
  ON public.procedures FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = procedures.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments of their clinic"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = appointments.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert appointments in their clinic"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = appointments.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can update appointments in their clinic"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = appointments.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can delete appointments in their clinic"
  ON public.appointments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = appointments.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Budgets (Orçamentos)
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente',
  total NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  notes TEXT,
  loss_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets of their clinic"
  ON public.budgets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = budgets.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert budgets in their clinic"
  ON public.budgets FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = budgets.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can update budgets in their clinic"
  ON public.budgets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = budgets.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can delete budgets in their clinic"
  ON public.budgets FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = budgets.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Budget items
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id),
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage budget items via budget clinic"
  ON public.budget_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      JOIN user_roles ur ON ur.clinic_id = b.clinic_id
      WHERE b.id = budget_items.budget_id AND ur.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Automations
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  message_template TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automations of their clinic"
  ON public.automations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = automations.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert automations in their clinic"
  ON public.automations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = automations.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can update automations in their clinic"
  ON public.automations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = automations.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can delete automations in their clinic"
  ON public.automations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = automations.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- NPS Responses
CREATE TABLE public.nps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nps of their clinic"
  ON public.nps_responses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = nps_responses.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert nps in their clinic"
  ON public.nps_responses FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND clinic_id = nps_responses.clinic_id)
    OR has_role(auth.uid(), 'platform_admin')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_budgets_clinic_id ON public.budgets(clinic_id);
CREATE INDEX idx_procedures_clinic_id ON public.procedures(clinic_id);
CREATE INDEX idx_automations_clinic_id ON public.automations(clinic_id);
CREATE INDEX idx_nps_responses_clinic_id ON public.nps_responses(clinic_id);
